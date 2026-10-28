"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

// ── Validation Schemas ─────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(128),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

// ── Auth Modal Component ───────────────────────────────────────
export function AuthModal() {
  const { isAuthModalOpen, authModalView, closeAuthModal, openAuthModal } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isLogin = authModalView === "login";
  const isOpen = isAuthModalOpen;

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  if (!isOpen) return null;

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // TODO: Connect to Supabase auth when set up
      console.log("Login:", data);
      setSuccessMsg("Login functionality will be enabled once Supabase is configured.");
      setTimeout(() => { setSuccessMsg(""); closeAuthModal(); }, 2000);
    } catch {
      setErrorMsg("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // TODO: Connect to Supabase auth when set up
      console.log("Signup:", data);
      setSuccessMsg("Sign up functionality will be enabled once Supabase is configured.");
      setTimeout(() => { setSuccessMsg(""); closeAuthModal(); }, 2000);
    } catch {
      setErrorMsg("An error occurred. Please try again.");
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
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => openAuthModal("login")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isLogin ? "bg-brand-gold text-charcoal" : "bg-white/20 text-white/70 hover:bg-white/30"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => openAuthModal("signup")}
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

            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FloatingInput
                  id="login-email"
                  type="email"
                  label="Email Address"
                  autoComplete="email"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register("email")}
                />
                <FloatingInput
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  autoComplete="current-password"
                  error={loginForm.formState.errors.password?.message}
                  rightElement={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-charcoal/50 hover:text-charcoal">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  {...loginForm.register("password")}
                />
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <FloatingInput
                  id="signup-name"
                  type="text"
                  label="Full Name"
                  autoComplete="name"
                  error={signupForm.formState.errors.full_name?.message}
                  {...signupForm.register("full_name")}
                />
                <FloatingInput
                  id="signup-email"
                  type="email"
                  label="Email Address"
                  autoComplete="email"
                  error={signupForm.formState.errors.email?.message}
                  {...signupForm.register("email")}
                />
                <FloatingInput
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  label="Password (min 8 characters)"
                  autoComplete="new-password"
                  error={signupForm.formState.errors.password?.message}
                  rightElement={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-charcoal/50 hover:text-charcoal">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  {...signupForm.register("password")}
                />
                <FloatingInput
                  id="signup-confirm"
                  type="password"
                  label="Confirm Password"
                  autoComplete="new-password"
                  error={signupForm.formState.errors.confirm_password?.message}
                  {...signupForm.register("confirm_password")}
                />
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
                  Create Account
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
