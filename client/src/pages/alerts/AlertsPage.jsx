/**
 * AlertsPage — Audit center for automated system alerts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertTriangle, Bell, Clock, Eye, Trash2, ShieldAlert,
  ChevronLeft, ChevronRight, CheckCheck, Loader2
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function AlertsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch all alerts
  const { data: alertsData, isLoading, refetch } = useQuery({
    queryKey: ["alertsList"],
    queryFn: async () => {
      const res = await apiClient.get("/alerts", { params: { limit: 50 } });
      return res.data.data;
    },
  });

  const alerts = alertsData || [];

  // Read action mutation
  const readMutation = useMutation({
    mutationFn: async (alertId) => {
      await apiClient.patch(`/alerts/${alertId}/read`);
    },
    onSuccess: () => {
      toast.success("Alert dismissed.");
      queryClient.invalidateQueries(["alertsList"]);
    },
  });

  // Read all action mutation
  const readAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/alerts/read-all");
    },
    onSuccess: () => {
      toast.success("All alerts cleared.");
      queryClient.invalidateQueries(["alertsList"]);
    },
  });

  return (
    <PageWrapper title="System Alerts">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">System Warnings</h1>
            <p className="text-xs text-text-secondary">Automated security alerts and critical financial delays.</p>
          </div>

          {alerts.some(a => !a.isRead) && (
            <button
              onClick={() => readAllMutation.mutate()}
              className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
              disabled={readAllMutation.isPending}
            >
              {readAllMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="w-4 h-4" /> Clear All
                </>
              )}
            </button>
          )}
        </div>

        {/* Warning cards */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex flex-col gap-4">
            {alerts.map((a) => {
              const isCritical = a.severity === "critical" || a.severity === "danger";
              const isWarning = a.severity === "warning";

              return (
                <div
                  key={a.id}
                  className={`glass-card p-5 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 ${
                    a.isRead ? "opacity-60 border-glass-border" : 
                    isCritical ? "border-danger/35 bg-danger/5" :
                    isWarning ? "border-warning/35 bg-warning/5" :
                    "border-primary/25"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isCritical ? "bg-danger/10 text-danger" : 
                      isWarning ? "bg-warning/10 text-warning" : 
                      "bg-info/10 text-info"
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-text-primary text-sm">{a.title}</span>
                      <p className="text-xs text-text-secondary leading-relaxed max-w-xl">{a.message}</p>
                      <span className="text-[10px] text-text-muted mt-1">{format(new Date(a.createdAt), "PPp")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {a.entityId && a.entityType === "bulk_order" && (
                      <button
                        onClick={() => navigate(`/orders/${a.entityId}`)}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Order
                      </button>
                    )}
                    {!a.isRead && (
                      <button
                        onClick={() => readMutation.mutate(a.id)}
                        className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-text-muted hover:text-danger transition-colors" /> Dismiss
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {alerts.length === 0 && (
              <div className="text-center text-xs text-text-muted py-20 flex flex-col justify-center items-center gap-3">
                <ShieldAlert className="w-12 h-12 text-text-muted opacity-40" />
                No warnings detected. System health is normal.
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
