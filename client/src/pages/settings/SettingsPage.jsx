/**
 * SettingsPage — Admin Settings and System Configurations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Settings, Save, Loader2, RefreshCw } from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settingsList"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/settings");
      return res.data.data;
    },
  });

  const settings = settingsData || [];

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const res = await apiClient.put(`/admin/settings/${key}`, { value });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Settings updated successfully!");
      queryClient.invalidateQueries(["settingsList"]);
    },
    onError: () => {
      toast.error("Failed to update setting.");
    },
  });

  const handleSaveSetting = (key, value) => {
    updateMutation.mutate({ key, value });
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <PageWrapper title="System Settings">
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">System Settings</h1>
          <p className="text-xs text-text-secondary">Configure defaults, threshold rules, and alerts settings.</p>
        </div>

        {/* Settings categories */}
        <div className="flex flex-col gap-6">
          {["payments", "orders", "general", "reminders"].map((category) => {
            const categorySettings = settings.filter(s => s.category === category);
            if (categorySettings.length === 0) return null;

            return (
              <div key={category} className="glass-card-static p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider capitalize">
                  {category} Configurations
                </h3>
                <div className="h-px bg-glass-border" />

                <div className="flex flex-col gap-4">
                  {categorySettings.map((s) => (
                    <div key={s.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5 flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-text-primary">{s.key.replace(/_/g, " ")}</span>
                        <span className="text-[10px] text-text-muted">{s.description || "No description."}</span>
                      </div>
                      <div className="md:col-span-5">
                        <input
                          type={s.type === "number" ? "number" : "text"}
                          defaultValue={s.value}
                          id={`input-${s.key}`}
                          className="input py-2 text-xs"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <button
                          onClick={() => {
                            const val = document.getElementById(`input-${s.key}`).value;
                            handleSaveSetting(s.key, val);
                          }}
                          className="btn-secondary py-2 px-3 text-xs w-full flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
}
