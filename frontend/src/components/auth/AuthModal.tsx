"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";

// ── Validation Schemas ─────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const signupSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    password: z.string().min(8, "At least 8 characters").max(128),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;
type SignupForm = z.infer<typeof signupSchema>;

// ── Auth Modal Component ───────────────────────────────────────
export function AuthModal() {
  const { isAuthModalOpen, authModalView, closeAuthModal, openAuthModal, setUser } =
    useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isLogin = authModalView === "login";
  const isForgot = authModalView === "forgot_password";
  const isOpen = isAuthModalOpen;

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });
  const forgotForm = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const switchToSignup = () => {
    const email = loginForm.getValues("email") || forgotForm.getValues("email");
    if (email) {
      signupForm.setValue("email", email, { shouldValidate: true });
    }
    setErrorMsg("");
    setSuccessMsg("");
    openAuthModal("signup");
  };

  const switchToLogin = () => {
    const email = signupForm.getValues("email") || forgotForm.getValues("email");
    if (email) {
      loginForm.setValue("email", email, { shouldValidate: true });
    }
    setErrorMsg("");
    setSuccessMsg("");
    openAuthModal("login");
  };

  const switchToForgot = () => {
    const email = loginForm.getValues("email") || signupForm.getValues("email");
    if (email) {
      forgotForm.setValue("email", email, { shouldValidate: true });
    }
    setErrorMsg("");
    setSuccessMsg("");
    openAuthModal("forgot_password");
  };

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      const redirectOrigin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://www.dridhacrafts.co.in";
      const oauthRedirect = `${redirectOrigin}/login`;

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
        setErrorMsg(error.message);
        setIsLoading(false);
      }
    } catch {
      setErrorMsg("Could not initiate Google sign in. Please try again.");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotForm) => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : "/reset-password";

      const res = await api.post<{ message: string }>("/api/auth/forgot-password", {
        email: data.email,
        redirect_to: redirectUrl,
      });

      setSuccessMsg(
        res.message ||
          "Password reset email sent! Check your inbox for instructions to set a new password."
      );
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          "This email address is not registered with Dridha Crafts. Please check your email or create an account."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setErrorMsg(error.message);
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

        if (appRole === "admin") {
          await supabase.auth.signOut();
          useAuthStore.getState().logout();
          setErrorMsg(
            "Admin accounts cannot sign in through the customer storefront. Please sign in via the official Admin Portal at /admin."
          );
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

        // Resume pending Add to Cart action once if one was held
        const pending = useAuthStore.getState().consumePendingCartItem();
        if (pending) {
          useCartStore.getState().addItem(pending);
          useCartStore.getState().openCart();
        }

        setSuccessMsg("Signed in successfully!");
        setTimeout(() => {
          setSuccessMsg("");
          closeAuthModal();
        }, 800);
      }
    } catch {
      setErrorMsg("An error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);
    setErrorMsg("");
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
        setErrorMsg(error.message);
        return;
      }

      if (authData.session && authData.user) {
        setUser({
          id: authData.user.id,
          email: authData.user.email || data.email,
          full_name: data.full_name,
          phone: data.phone,
          role: "customer",
          created_at: authData.user.created_at,
        });

        const pending = useAuthStore.getState().consumePendingCartItem();
        if (pending) {
          useCartStore.getState().addItem(pending);
          useCartStore.getState().openCart();
        }

        setSuccessMsg("Account created and signed in!");
        setTimeout(() => {
          setSuccessMsg("");
          closeAuthModal();
        }, 1000);
      } else {
        setSuccessMsg("Registration successful! Check your email to confirm your account.");
      }
    } catch {
      setErrorMsg("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-charcoal/60 backdrop-blur-sm"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="relative bg-white rounded-3xl shadow-elevated w-full max-w-md overflow-hidden animate-scale-in"
          role="dialog"
          aria-modal="true"
          aria-label={isLogin ? "Login" : "Create Account"}
        >
          {/* Header */}
          <div className="bg-brand-green px-8 pt-8 pb-6 relative">
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            {isForgot ? (
              <div>
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e5c89d] hover:text-white transition-colors mb-3 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>
                <h2 className="font-display text-2xl font-bold text-white">Reset Password</h2>
                <p className="text-sm text-brand-cream/70 mt-1">
                  Enter your registered email address and we&apos;ll send you a recovery link.
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isLogin ? "bg-brand-gold text-charcoal" : "bg-white/20 text-white/70 hover:bg-white/30"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={switchToSignup}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      !isLogin ? "bg-brand-gold text-charcoal" : "bg-white/20 text-white/70 hover:bg-white/30"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {isLogin ? "Welcome Back" : "Join Dridha Crafts"}
                </h2>
                <p className="text-sm text-brand-cream/70 mt-1">
                  {isLogin
                    ? "Sign in to your account to view orders and wishlist."
                    : "Create an account to track orders and save your wishlist."}
                </p>
              </>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            {successMsg && (
              <div className="mb-4 px-4 py-3 bg-sage/15 border border-sage/30 rounded-xl text-sm text-brand-green-dark font-medium">
                ✓ {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 px-4 py-3 bg-terracotta/10 border border-terracotta/20 rounded-xl text-sm text-terracotta">
                {errorMsg}
              </div>
            )}

            {!isForgot && (
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
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-warmgrey/80 w-full" />
                  <span className="bg-white px-3 text-[11px] font-medium text-charcoal/50 uppercase tracking-wider relative">
                    or continue with email
                  </span>
                </div>
              </div>
            )}

            {isForgot ? (
              <form key="modal-forgot-form" onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                <FloatingInput
                  key="forgot-email"
                  id="forgot-email"
                  type="email"
                  label="Email Address"
                  autoComplete="email"
                  error={forgotForm.formState.errors.email?.message}
                  {...forgotForm.register("email")}
                />
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
                  {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-xs text-charcoal/60 hover:text-brand-green font-medium cursor-pointer"
                  >
                    Remember your password? Sign in
                  </button>
                </div>
              </form>
            ) : isLogin ? (
              <form key="modal-login-form" onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FloatingInput
                  key="login-email"
                  id="login-email"
                  type="email"
                  label="Email Address"
                  autoComplete="email"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register("email")}
                />
                <FloatingInput
                  key="login-password"
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  autoComplete="current-password"
                  error={loginForm.formState.errors.password?.message}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-charcoal/50 hover:text-charcoal"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  {...loginForm.register("password")}
                />
                <div className="flex items-center justify-end -mt-1">
                  <button
                    type="button"
                    onClick={switchToForgot}
                    className="text-xs text-brand-green hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form key="modal-signup-form" onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <FloatingInput
                  key="signup-name"
                  id="signup-name"
                  type="text"
                  label="Full Name"
                  autoComplete="name"
                  error={signupForm.formState.errors.full_name?.message}
                  {...signupForm.register("full_name")}
                />
                <FloatingInput
                  key="signup-email"
                  id="signup-email"
                  type="email"
                  label="Email Address"
                  autoComplete="email"
                  error={signupForm.formState.errors.email?.message}
                  {...signupForm.register("email")}
                />
                <FloatingInput
                  key="signup-phone"
                  id="signup-phone"
                  type="tel"
                  label="Phone Number (10 digits)"
                  placeholder="9876543210"
                  maxLength={10}
                  autoComplete="tel"
                  error={signupForm.formState.errors.phone?.message}
                  {...signupForm.register("phone")}
                />
                <FloatingInput
                  key="signup-password"
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  label="Password (min 8 characters)"
                  autoComplete="new-password"
                  error={signupForm.formState.errors.password?.message}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-charcoal/50 hover:text-charcoal"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  {...signupForm.register("password")}
                />
                <FloatingInput
                  key="signup-confirm"
                  id="signup-confirm"
                  type="password"
                  label="Confirm Password"
                  autoComplete="new-password"
                  error={signupForm.formState.errors.confirm_password?.message}
                  {...signupForm.register("confirm_password")}
                />
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            )}

            <p className="text-[10px] text-charcoal/40 text-center mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Floating Label Input ───────────────────────────────────────
interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  rightElement?: React.ReactNode;
}

const FloatingInput = ({ id, label, error, rightElement, className, ...props }: FloatingInputProps) => {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={`w-full px-4 py-3 bg-brand-cream border rounded-xl text-sm text-charcoal placeholder-charcoal/30 transition-all outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 ${
            error ? "border-terracotta/60 bg-terracotta/5" : "border-warmgrey"
          } ${rightElement ? "pr-10" : ""} ${className || ""}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-xs text-terracotta font-medium">{error}</p>}
    </div>
  );
};
