/**
 * LoginPage — Premium Authenticated Login Screen
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Cake, Mail, Lock, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import PageWrapper from "../../components/shared/PageWrapper";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register: formRegister, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    setAuthError("");
    const res = await login(data.email, data.password);
    if (res.success) {
      toast.success(`Welcome back, ${res.user.firstName}!`);
      navigate("/dashboard");
    } else {
      setAuthError(res.message);
      toast.error(res.message);
    }
    setSubmitting(false);
  };

  return (
    <PageWrapper title="Login">
      <div className="w-full max-w-[420px] glass-card-glow-purple p-8 flex flex-col gap-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Cake className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-text-primary mt-2">
            Welcome Back
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

        {/* Login Form */}
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
                {...formRegister("email")}
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-danger font-medium mt-0.5">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="label">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary-light hover:text-primary transition-colors font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`input pl-10.5 pr-10 ${errors.password ? "input-error" : ""}`}
                disabled={submitting}
                {...formRegister("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-[11px] text-danger font-medium mt-0.5">{errors.password.message}</span>
            )}
          </div>

          {/* Remember Me */}
          <label className="flex items-center gap-2 text-xs text-text-secondary select-none font-medium cursor-pointer">
            <input
              type="checkbox"
              className="w-4.5 h-4.5 rounded border border-glass-border accent-primary focus:ring-0 focus:outline-none"
              disabled={submitting}
              {...formRegister("rememberMe")}
            />
            Remember my session on this device
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="btn-premium py-3 mt-2 text-sm font-semibold select-none flex items-center justify-center gap-2 cursor-pointer shadow-glow"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" /> Verifying Credentials...
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
        </form>

        <div className="text-center text-xs text-text-secondary">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary-light hover:text-primary transition-colors font-semibold">
            Register here
          </Link>
        </div>

        <div className="h-px bg-glass-border my-1" />

        {/* Demo Accounts */}
        <div className="flex flex-col gap-2 p-4 bg-bg-secondary/40 rounded-2xl border border-glass-border">
          <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Demo Credentials:</span>
          <div className="grid grid-cols-1 gap-1 text-[11px] text-text-secondary font-medium">
            <div>🔑 Admin: <code className="text-text-primary">admin@cakesandcrunches.com</code> / <code className="text-text-primary">admin123</code></div>
            <div>🔑 Manager: <code className="text-text-primary">manager@cakesandcrunches.com</code> / <code className="text-text-primary">admin123</code></div>
            <div>🔑 Staff: <code className="text-text-primary">staff@cakesandcrunches.com</code> / <code className="text-text-primary">admin123</code></div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
