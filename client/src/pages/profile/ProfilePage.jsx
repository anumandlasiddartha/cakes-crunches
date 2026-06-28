/**
 * ProfilePage — User profile management and password modification
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { User, Lock, Save, Loader2, Key } from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import toast from "react-hot-toast";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmNewPassword: z.string().min(1, "Please confirm your new password."),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Profile Form
  const { register: profileRegister, handleSubmit: handleProfileSubmit } = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    },
  });

  // Password Form
  const { register: passRegister, handleSubmit: handlePassSubmit, reset: resetPassForm, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data) => {
    setSubmittingProfile(true);
    try {
      const res = await apiClient.put(`/users/${user.id}`, data);
      if (res.data.success) {
        updateProfile(res.data.data);
        toast.success("Profile details updated!");
      }
    } catch (error) {
      toast.error("Failed to update profile details.");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const onUpdatePassword = async (data) => {
    setSubmittingPassword(true);
    try {
      const res = await apiClient.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (res.data.success) {
        toast.success("Password changed successfully!");
        resetPassForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Password update failed.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <PageWrapper title="My Profile">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Profile File</h1>
          <p className="text-xs text-text-secondary">Manage your user profile details and credentials security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Profile details */}
          <div className="glass-card-static p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <User className="w-4.5 h-4.5 text-primary-light" /> Profile Information
            </h3>
            <div className="h-px bg-glass-border" />

            <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="flex flex-col gap-3.5">
              <div>
                <label className="label">First Name *</label>
                <input
                  type="text"
                  className="input"
                  {...profileRegister("firstName")}
                />
              </div>

              <div>
                <label className="label">Last Name *</label>
                <input
                  type="text"
                  className="input"
                  {...profileRegister("lastName")}
                />
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  {...profileRegister("phone")}
                />
              </div>

              <div>
                <label className="label">Registered Email</label>
                <input
                  type="email"
                  className="input opacity-50 cursor-not-allowed"
                  value={user?.email}
                  disabled
                />
              </div>

              <button
                type="submit"
                className="btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                disabled={submittingProfile}
              >
                {submittingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-4 h-4" />} Save Details
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="glass-card-static p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <Lock className="w-4.5 h-4.5 text-primary-light" /> Change Password
            </h3>
            <div className="h-px bg-glass-border" />

            <form onSubmit={handlePassSubmit(onUpdatePassword)} className="flex flex-col gap-3.5">
              <div>
                <label className="label">Current Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input ${errors.currentPassword ? "input-error" : ""}`}
                  {...passRegister("currentPassword")}
                />
                {errors.currentPassword && (
                  <span className="text-[11px] text-danger font-medium mt-0.5">{errors.currentPassword.message}</span>
                )}
              </div>

              <div>
                <label className="label">New Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input ${errors.newPassword ? "input-error" : ""}`}
                  {...passRegister("newPassword")}
                />
                {errors.newPassword && (
                  <span className="text-[11px] text-danger font-medium mt-0.5">{errors.newPassword.message}</span>
                )}
              </div>

              <div>
                <label className="label">Confirm New Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input ${errors.confirmNewPassword ? "input-error" : ""}`}
                  {...passRegister("confirmNewPassword")}
                />
                {errors.confirmNewPassword && (
                  <span className="text-[11px] text-danger font-medium mt-0.5">{errors.confirmNewPassword.message}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                disabled={submittingPassword}
              >
                {submittingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-4 h-4" />} Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
