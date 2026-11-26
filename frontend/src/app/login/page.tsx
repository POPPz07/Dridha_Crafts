"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, Shield } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits (required for delivery coordination)")
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number (required for order updates and delivery coordination)"),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

function sanitizeRedirect(url: string | null): string {
  if (!url) return "/";
  try {
    const decoded = decodeURIComponent(url).trim();
    // Enforce strictly relative path: must start with single '/' and not '//' or '/\' and contain no protocol schemes, backslashes, or control characters
    if (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !decoded.startsWith("/\\") &&
      !decoded.includes(":") &&
      !decoded.includes("\\") &&
      !/[\r\n\t]/.test(decoded)
    ) {
      return decoded;
    }
  } catch {
    return "/";
  }
  return "/";
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams?.get("redirect"));
  const isAdminLogin = redirectTo.startsWith("/admin") || redirectTo.includes("/admin");

  const { user, setUser } = useAuthStore();
  const [view, setView] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const switchToSignup = () => {
    const email = loginForm.getValues("email");
    if (email) {
      signupForm.setValue("email", email, { shouldValidate: true });
    }
    setView("signup");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const switchToLogin = () => {
    const email = signupForm.getValues("email");
    if (email) {
      loginForm.setValue("email", email, { shouldValidate: true });
    }
    setView("login");
    setErrorMessage("");
    setSuccessMessage("");
  };

  useEffect(() => {
    if (user) {
      if (user.role === "admin" && !isAdminLogin) {
        const supabase = createClient();
        supabase.auth.signOut().catch(() => {});
        useAuthStore.getState().logout();
        setErrorMessage("Admin accounts cannot sign in through the customer storefront. Please sign in via the official Admin Portal at /admin.");
        return;
      }
      if (user.role !== "admin" && isAdminLogin) {
        const supabase = createClient();
        supabase.auth.signOut().catch(() => {});
        useAuthStore.getState().logout();
        setErrorMessage("Access denied: Customer accounts cannot sign in through the Admin Portal. Please use the standard login.");
        return;
      }
      router.replace(redirectTo);
    }
  }, [user, router, redirectTo, isAdminLogin]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const redirectOrigin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://www.dridhacrafts.co.in";
      const oauthRedirect = `${redirectOrigin}/login?redirect=${encodeURIComponent(redirectTo)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthRedirect,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Could not initiate Google sign in. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (authData.user) {
        let appRole: "admin" | "customer" = "customer";
        try {
          const profile = await api.get<{ role?: string }>("/api/auth/me", {
            token: authData.session.access_token,
          });
          if (profile && profile.role === "admin") {
            appRole = "admin";
          }
        } catch {
          if (authData.user.app_metadata?.role === "admin") {
            appRole = "admin";
          }
        }

        if (appRole === "admin" && !isAdminLogin) {
          await supabase.auth.signOut();
          useAuthStore.getState().logout();
          setErrorMessage("Admin accounts cannot sign in through the customer storefront. Please sign in via the official Admin Portal at /admin.");
          setIsLoading(false);
          return;
        }

        if (appRole !== "admin" && isAdminLogin) {
          await supabase.auth.signOut();
          useAuthStore.getState().logout();
          setErrorMessage("Access denied: Customer accounts cannot sign in through the Admin Portal. Please use the standard login.");
          setIsLoading(false);
          return;
        }

        setUser({
          id: authData.user.id,
          email: authData.user.email || data.email,
          full_name:
            authData.user.user_metadata?.full_name ||
            authData.user.email?.split("@")[0] ||
            "User",
          phone: authData.user.phone || null,
          role: appRole,
          created_at: authData.user.created_at,
        });

        const pending = useAuthStore.getState().consumePendingCartItem();
        if (pending) {
          useCartStore.getState().addItem(pending);
          useCartStore.getState().openCart();
        }

        setSuccessMessage(appRole === "admin" ? "Signed in as Admin! Redirecting to Dashboard..." : "Signed in successfully! Redirecting...");
        setTimeout(() => {
          const target = appRole === "admin" && redirectTo === "/" ? "/admin" : redirectTo;
          router.replace(target);
        }, 800);
      }
    } catch {
      setErrorMessage("An unexpected error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}`
          : "https://www.dridhacrafts.co.in";

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.full_name,
            phone: data.phone,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (authData.user) {
        setUser({
          id: authData.user.id,
          email: authData.user.email || data.email,
          full_name: data.full_name,
          phone: data.phone,
          role: "customer",
          created_at: authData.user.created_at,
        });

        setSuccessMessage("Account created successfully! Welcome to Dridha Crafts.");
        setTimeout(() => {
          router.replace(redirectTo);
        }, 1000);
      }
    } catch {
      setErrorMessage("An unexpected error occurred during sign up. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-warmgrey/70 shadow-elevated">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-block group mb-3">
          <span className="font-display text-2xl font-bold tracking-wider text-brand-green group-hover:text-brand-brown transition-colors">
            DRIDHA CRAFTS
          </span>
          <span className="block text-[10px] tracking-widest uppercase text-brand-gold font-sans font-medium">
            Kashmir Valley
          </span>
        </Link>
        {isAdminLogin ? (
          <div className="space-y-1.5 mt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-[11px] font-semibold tracking-wider uppercase mb-1">
              <Shield className="w-3.5 h-3.5 text-brand-green" />
              Admin Portal
            </div>
            <h1 className="font-display text-2xl font-bold text-brand-green">
              Staff Sign In
            </h1>
            <p className="text-xs text-charcoal/60 max-w-xs mx-auto">
              Restricted administrative portal for authorized Dridha Crafts personnel.
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-brand-green mt-2">
              {view === "login" ? "Welcome Back" : "Join the Dridha Family"}
            </h1>
            <p className="text-xs text-charcoal/60 mt-1">
              {view === "login"
                ? "Sign in to access your orders, wishlist, and saved addresses."
                : "Create an account to track orders and save your favorites."}
            </p>
          </>
        )}
      </div>

      {/* View Switcher (Hidden in Admin Mode) */}
      {!isAdminLogin && (
        <div className="flex rounded-xl bg-brand-cream p-1 mb-6 border border-warmgrey/60">
          <button
            type="button"
            onClick={switchToLogin}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              view === "login"
                ? "bg-brand-green text-white shadow-soft"
                : "text-charcoal/70 hover:text-brand-green"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={switchToSignup}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              view === "signup"
                ? "bg-brand-green text-white shadow-soft"
                : "text-charcoal/70 hover:text-brand-green"
            }`}
          >
            Create Account
          </button>
        </div>
      )}

      {/* Alerts */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {/* Continue with Google */}
      <div className="space-y-4 mb-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-warmgrey/80 bg-white hover:bg-brand-cream/50 transition-all font-semibold text-xs sm:text-sm text-charcoal shadow-2xs hover:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.28v3.15C3.31 21.36 7.38 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.41l4-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.38 0 3.31 2.64 1.28 6.59l4 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-warmgrey/70" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-charcoal/40">
            or continue with email
          </span>
        </div>
      </div>

      {/* Login Form */}
      {view === "login" ? (
        <form key="page-login-form" onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Email Address
            </label>
            <input
              key="login-email-input"
              type="email"
              placeholder="you@example.com"
              {...loginForm.register("email")}
              className="w-full px-4 py-2.5 rounded-xl border border-warmgrey/80 focus:border-brand-green focus:outline-none text-sm bg-brand-cream/30 text-charcoal"
            />
            {loginForm.formState.errors.email && (
              <p className="text-[11px] text-red-600 mt-1">
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                key="login-password-input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...loginForm.register("password")}
                className="w-full px-4 py-2.5 rounded-xl border border-warmgrey/80 focus:border-brand-green focus:outline-none text-sm bg-brand-cream/30 text-charcoal pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {loginForm.formState.errors.password && (
              <p className="text-[11px] text-red-600 mt-1">
                {loginForm.formState.errors.password.message}
              </p>
            )}
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={() => {
                  const email = loginForm.getValues("email");
                  if (email) {
                    useAuthStore.getState().openAuthModal("forgot_password");
                  } else {
                    useAuthStore.getState().openAuthModal("forgot_password");
                  }
                }}
                className="text-xs font-semibold text-brand-green hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2"
            size="lg"
            variant="primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      ) : (
        /* Signup Form */
        <form key="page-signup-form" onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Full Name
            </label>
            <input
              key="signup-name-input"
              type="text"
              placeholder="Virendra Singh"
              {...signupForm.register("full_name")}
              className="w-full px-4 py-2.5 rounded-xl border border-warmgrey/80 focus:border-brand-green focus:outline-none text-sm bg-brand-cream/30 text-charcoal"
            />
            {signupForm.formState.errors.full_name && (
              <p className="text-[11px] text-red-600 mt-1">
                {signupForm.formState.errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Email Address
            </label>
            <input
              key="signup-email-input"
              type="email"
              placeholder="you@example.com"
              {...signupForm.register("email")}
              className="w-full px-4 py-2.5 rounded-xl border border-warmgrey/80 focus:border-brand-green focus:outline-none text-sm bg-brand-cream/30 text-charcoal"
            />
            {signupForm.formState.errors.email && (
              <p className="text-[11px] text-red-600 mt-1">
                {signupForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-charcoal/50 font-medium">
                +91
              </span>
              <input
                key="signup-phone-input"
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                {...signupForm.register("phone")}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-warmgrey/80 focus:border-brand-green focus:outline-none text-sm bg-brand-cream/30 text-charcoal"
              />
            </div>
            {signupForm.formState.errors.phone && (
              <p className="text-[11px] text-red-600 mt-1">
                {signupForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                {...signupForm.register("password")}
                className="w-full px-4 py-2.5 rounded-xl border border-warmgrey/80 focus:border-brand-green focus:outline-none text-sm bg-brand-cream/30 text-charcoal pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {signupForm.formState.errors.password && (
              <p className="text-[11px] text-red-600 mt-1">
                {signupForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Repeat password"
              {...signupForm.register("confirm_password")}
              className="w-full px-4 py-2.5 rounded-xl border border-warmgrey/80 focus:border-brand-green focus:outline-none text-sm bg-brand-cream/30 text-charcoal"
            />
            {signupForm.formState.errors.confirm_password && (
              <p className="text-[11px] text-red-600 mt-1">
                {signupForm.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2"
            size="lg"
            variant="primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      )}

      {/* Legal Disclaimer */}
      <p className="text-[11px] text-center text-charcoal/60 mt-5 leading-relaxed">
        By continuing, you agree to Dridha Crafts&apos;{" "}
        <Link href="/terms" className="text-brand-green font-semibold underline hover:text-brand-brown">
          Terms of Service
        </Link>{" "}
        and acknowledge our{" "}
        <Link href="/privacy" className="text-brand-green font-semibold underline hover:text-brand-brown">
          Privacy Policy
        </Link>.
      </p>

      {/* Admin Notice */}
      {isAdminLogin && (
        <div className="mt-6 pt-4 border-t border-warmgrey/50 text-center">
          <p className="text-[11px] text-charcoal/50 leading-relaxed">
            Administrative access is logged and monitored. New staff credentials must be provisioned internally by a system administrator.
          </p>
        </div>
      )}

      {/* Back to Home Link */}
      <div className={`text-center ${isAdminLogin ? "mt-4" : "mt-8 pt-6 border-t border-warmgrey/60"}`}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-charcoal/60 hover:text-brand-green transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Storefront
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-brand-cream flex items-center justify-center py-16 px-4">
      <Container className="flex justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-md p-10 bg-white rounded-3xl flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-green" />
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </Container>
    </main>
  );
}
