"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/profile");
      }, 2500);
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again or request a new reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream flex items-center justify-center p-4 pt-28 pb-16">
      <Container className="max-w-md w-full">
        <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft overflow-hidden">
          {/* Header */}
          <div className="bg-brand-green px-8 py-8 text-center text-white relative">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 text-[#e5c89d]">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Set New Password</h1>
            <p className="text-brand-cream/80 text-xs sm:text-sm mt-1.5">
              Enter your new credentials below to securely regain access to your account.
            </p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-5">
            {isSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="font-display text-xl font-bold text-brand-green">
                  Password Updated!
                </h2>
                <p className="text-sm text-charcoal/70">
                  Your password has been changed successfully. Redirecting you to your account...
                </p>
                <Link href="/profile" className="inline-block pt-2">
                  <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Go to Account
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errorMessage && (
                  <div className="p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta rounded-xl text-xs sm:text-sm font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-1">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className={`w-full px-4 py-3 bg-brand-cream border rounded-xl text-sm text-charcoal outline-none transition-all pr-10 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 ${
                        errors.password ? "border-terracotta/60" : "border-warmgrey"
                      }`}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-terracotta">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="confirm_password"
                    className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm_password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                    className={`w-full px-4 py-3 bg-brand-cream border rounded-xl text-sm text-charcoal outline-none transition-all focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 ${
                      errors.confirm_password ? "border-terracotta/60" : "border-warmgrey"
                    }`}
                    {...register("confirm_password")}
                  />
                  {errors.confirm_password && (
                    <p className="text-xs text-terracotta">{errors.confirm_password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/"
                    className="text-xs text-charcoal/60 hover:text-brand-green transition-colors"
                  >
                    ← Return to Homepage
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
