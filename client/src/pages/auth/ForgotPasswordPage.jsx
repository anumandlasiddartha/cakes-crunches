/**
 * ForgotPasswordPage — Premium Password Reset Request Screen
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Cake, Mail, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import apiClient from "../../api/client";
import toast from "react-hot-toast";
import PageWrapper from "../../components/shared/PageWrapper";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    setAuthError("");
    try {
      await apiClient.post("/auth/forgot-password", { email: data.email });
      setSubmitted(true);
      toast.success("Reset link generated! Check console/logs.");
    } catch (error) {
      setAuthError(error.response?.data?.message || "An error occurred. Please try again.");
      toast.error("Failed to generate link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper title="Forgot Password">
      <div className="w-full max-w-[420px] glass-card-glow-purple p-8 flex flex-col gap-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Cake className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-text-primary mt-2">
            Reset Password
          </h2>
          <p className="text-xs text-text-secondary">
             cakesandcrunches.com — Bulk Order Tracking Portal
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col gap-4 text-center">
            <div className="flex justify-center text-success">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Link Dispatched</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              If the email address exists in our database, we have dispatched a password reset token. 
              Please check your inbox (and spam folder) for instruction emails.
            </p>
            <div className="h-px bg-glass-border my-2" />
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-xs text-primary-light hover:text-primary transition-colors font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {authError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <p className="text-xs text-text-secondary leading-relaxed text-center">
              Provide your registered email address below, and we will dispatch instructions to securely reset your credentials.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    placeholder="chef@cakesandcrunches.com"
                    className={`input pl-10.5 ${errors.email ? "input-error" : ""}`}
                    disabled={submitting}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <span className="text-[11px] text-danger font-medium mt-0.5">{errors.email.message}</span>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-premium py-3 mt-2 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-glow"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" /> Querying Database...
                  </>
                ) : (
                  "Dispatch Reset Link"
                )}
              </button>
            </form>

            <div className="h-px bg-glass-border my-1" />

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
