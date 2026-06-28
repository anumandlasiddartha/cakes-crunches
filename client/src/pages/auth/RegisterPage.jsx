/**
 * RegisterPage — Premium Account Creation Screen
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Cake, Mail, Lock, User, Phone, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import PageWrapper from "../../components/shared/PageWrapper";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register: formRegister, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    setAuthError("");
    
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...registerData } = data;
    const res = await register(registerData);
    
    if (res.success) {
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } else {
      setAuthError(res.message);
      toast.error(res.message);
    }
    setSubmitting(false);
  };

  return (
    <PageWrapper title="Register">
      <div className="w-full max-w-[480px] glass-card-glow-pink p-8 flex flex-col gap-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Cake className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-text-primary mt-2">
            Create Account
          </h2>
          <p className="text-xs text-text-secondary">
             cakesandcrunches.com — Bulk Order Tracking Portal
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="flex flex-col gap-1.5">
              <label className="label">First Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Rahul"
                  className={`input pl-10.5 ${errors.firstName ? "input-error" : ""}`}
                  disabled={submitting}
                  {...formRegister("firstName")}
                />
              </div>
              {errors.firstName && (
                <span className="text-[11px] text-danger font-medium mt-0.5">{errors.firstName.message}</span>
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1.5">
              <label className="label">Last Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Kumar"
                  className={`input pl-10.5 ${errors.lastName ? "input-error" : ""}`}
                  disabled={submitting}
                  {...formRegister("lastName")}
                />
              </div>
              {errors.lastName && (
                <span className="text-[11px] text-danger font-medium mt-0.5">{errors.lastName.message}</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email"
                placeholder="staff@cakesandcrunches.com"
                className={`input pl-10.5 ${errors.email ? "input-error" : ""}`}
                disabled={submitting}
                {...formRegister("email")}
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-danger font-medium mt-0.5">{errors.email.message}</span>
            )}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="tel"
                placeholder="+91 9876543210"
                className="input pl-10.5"
                disabled={submitting}
                {...formRegister("phone")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input pl-10.5 ${errors.password ? "input-error" : ""}`}
                  disabled={submitting}
                  {...formRegister("password")}
                />
              </div>
              {errors.password && (
                <span className="text-[11px] text-danger font-medium mt-0.5">{errors.password.message}</span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input pl-10.5 ${errors.confirmPassword ? "input-error" : ""}`}
                  disabled={submitting}
                  {...formRegister("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-[11px] text-danger font-medium mt-0.5">{errors.confirmPassword.message}</span>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-premium py-3 mt-2 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-glow"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" /> Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="h-px bg-glass-border my-1" />

        <div className="text-center text-xs text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-light hover:text-primary transition-colors font-semibold">
            Login here
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
