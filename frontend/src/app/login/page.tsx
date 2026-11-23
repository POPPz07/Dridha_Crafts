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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Enter a valid email address"),
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

  useEffect(() => {
    if (user) {
      router.replace(redirectTo);
    }
  }, [user, router, redirectTo]);

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
        const appRole = (authData.user.app_metadata?.role as "admin" | "customer") || "customer";
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
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
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
          phone: null,
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
            onClick={() => {
              setView("login");
              setErrorMessage("");
              setSuccessMessage("");
            }}
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
            onClick={() => {
              setView("signup");
              setErrorMessage("");
              setSuccessMessage("");
            }}
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

      {/* Login Form */}
      {view === "login" ? (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Email Address
            </label>
            <input
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
        <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Full Name
            </label>
            <input
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
