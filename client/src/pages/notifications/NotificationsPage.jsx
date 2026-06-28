/**
 * NotificationsPage — User personal inbox panel
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Bell, Check, Trash2, Mail, Eye, Info, CheckCheck, Loader2
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifData, isLoading } = useQuery({
    queryKey: ["notificationsList"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications", { params: { limit: 50 } });
      return res.data.data;
    },
  });

  const notifications = notifData || [];

  const readMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notificationsList"]);
    },
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/notifications/read-all");
    },
    onSuccess: () => {
      toast.success("Inbox marked as read.");
      queryClient.invalidateQueries(["notificationsList"]);
    },
  });

  return (
    <PageWrapper title="Notifications">
      <div className="flex flex-col gap-6 max-w-xl mx-auto animate-enter">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Inbox Center</h1>
            <p className="text-xs text-text-secondary">Updates on customer files and operational status changes.</p>
          </div>

          {notifications.some(n => !n.isRead) && (
            <button
              onClick={() => readAllMutation.mutate()}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
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

        {/* Notifications list */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && readMutation.mutate(n.id)}
                className={`glass-card p-4 border flex gap-3.5 items-start transition-all cursor-pointer ${
                  n.isRead ? "opacity-60 border-glass-border" : "border-primary/20 bg-primary/5 shadow-glow"
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  n.isRead ? "bg-glass-hover text-text-secondary" : "bg-primary/10 text-primary-light"
                }`}>
                  <Bell className="w-4 h-4" />
                </div>

                <div className="flex-1 flex flex-col gap-1 text-xs">
                  <span className="font-bold text-text-primary">{n.title}</span>
                  <p className="text-text-secondary leading-relaxed font-medium">{n.body}</p>
                  <span className="text-[10px] text-text-muted mt-1">{format(new Date(n.createdAt), "PPp")}</span>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center text-xs text-text-muted py-20 flex flex-col justify-center items-center gap-3">
                <Mail className="w-12 h-12 text-text-muted opacity-40" />
                Inbox is clean. No notifications.
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
