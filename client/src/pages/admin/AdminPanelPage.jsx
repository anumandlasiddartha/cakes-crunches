/**
 * AdminPanelPage — Core Administration Control Center
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ShieldAlert, Users, Shield, Calendar, Activity, ChevronLeft,
  ChevronRight, ToggleLeft, ToggleRight, Loader2, Key
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function AdminPanelPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  const [usersPage, setUsersPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  const limit = 10;

  // Fetch users list
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers", usersPage],
    queryFn: async () => {
      const res = await apiClient.get("/users", { params: { page: usersPage, limit } });
      return res.data;
    },
    enabled: activeTab === "users",
  });

  // Fetch audit logs
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["adminAuditLogs", auditPage],
    queryFn: async () => {
      const res = await apiClient.get("/admin/audit-logs", { params: { page: auditPage, limit } });
      return res.data;
    },
    enabled: activeTab === "audits",
  });

  // Fetch general system stats
  const { data: statsData } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/system-stats");
      return res.data.data;
    },
  });

  const users = usersData?.data || [];
  const usersTotalPages = usersData?.pagination?.totalPages || 1;

  const audits = auditData?.data || [];
  const auditsTotalPages = auditData?.pagination?.totalPages || 1;

  const stats = statsData || {};

  // Toggle user activation mutation
  const toggleMutation = useMutation({
    mutationFn: async (userId) => {
      await apiClient.patch(`/users/${userId}/toggle-active`);
    },
    onSuccess: () => {
      toast.success("User access status updated.");
      queryClient.invalidateQueries(["adminUsers"]);
    },
  });

  return (
    <PageWrapper title="Admin Panel">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-enter">
        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Console Center</h1>
          <p className="text-xs text-text-secondary">Administrative configuration panel and user security controls.</p>
        </div>

        {/* System metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Active Staff", value: stats.users },
            { label: "Total Customers", value: stats.customers },
            { label: "Bulk Orders", value: stats.orders },
            { label: "Receipt Entries", value: stats.payments },
            { label: "Unread Alerts", value: stats.unreadAlerts, critical: stats.unreadAlerts > 0 },
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-4 flex flex-col gap-1.5 text-center">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{stat.label}</span>
              <span className={`text-xl font-black font-display ${stat.critical ? "text-danger" : "text-text-primary"}`}>
                {stat.value || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="glass-card-static p-6 flex flex-col gap-4">
          <div className="flex border-b border-glass-border gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-2.5 px-4 text-xs font-bold cursor-pointer transition-colors border-b-2 ${
                activeTab === "users" ? "border-primary text-primary-light" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Operator Accounts
            </button>
            <button
              onClick={() => setActiveTab("audits")}
              className={`pb-2.5 px-4 text-xs font-bold cursor-pointer transition-colors border-b-2 ${
                activeTab === "audits" ? "border-primary text-primary-light" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Database Audit Logs
            </button>
          </div>

          {/* User management tab */}
          {activeTab === "users" && (
            <>
              {usersLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Operator Name</th>
                        <th>Email Address</th>
                        <th>Phone</th>
                        <th>Role Assigned</th>
                        <th>Portal Status</th>
                        <th className="text-right">Access Controls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="font-bold text-text-primary">
                            {u.firstName} {u.lastName}
                          </td>
                          <td className="font-medium text-text-secondary">{u.email}</td>
                          <td>{u.phone || "—"}</td>
                          <td className="capitalize text-xs font-semibold text-text-secondary">{u.role?.name}</td>
                          <td>
                            <span className={`badge ${u.isActive ? "badge-success" : "badge-neutral"}`}>
                              {u.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td className="text-right">
                            {u.email !== "admin@cakesandcrunches.com" ? (
                              <button
                                onClick={() => toggleMutation.mutate(u.id)}
                                className={`btn-ghost py-1 px-2.5 text-xs flex items-center gap-1.5 ml-auto cursor-pointer ${
                                  u.isActive ? "text-danger hover:bg-danger/5" : "text-success hover:bg-success/5"
                                }`}
                                disabled={toggleMutation.isPending}
                              >
                                {u.isActive ? (
                                  <>
                                    <ToggleRight className="w-4 h-4 text-danger" /> Disable Access
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-4 h-4 text-success" /> Enable Access
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-text-muted italic pr-4">Root Access</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Users Pagination */}
              {usersTotalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-glass-border">
                  <span className="text-xs text-text-secondary">
                    Page {usersPage} of {usersTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={usersPage === 1}
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                      disabled={usersPage === usersTotalPages}
                      onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Audit Logs tab */}
          {activeTab === "audits" && (
            <>
              {auditLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Target Table</th>
                        <th>Row ID</th>
                        <th>Action</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audits.map((a) => (
                        <tr key={a.id}>
                          <td>{format(new Date(a.createdAt), "MMM dd, yyyy HH:mm:ss")}</td>
                          <td className="font-bold text-text-primary">
                            {a.user ? `${a.user.firstName} ${a.user.lastName}` : "System"}
                          </td>
                          <td className="font-semibold text-text-secondary">{a.tableName}</td>
                          <td>{a.recordId}</td>
                          <td>
                            <span className={`badge ${
                              a.action === "create" ? "badge-success" : 
                              a.action === "delete" ? "badge-danger" : 
                              "badge-warning"
                            }`}>{a.action}</span>
                          </td>
                          <td className="text-xs text-text-muted font-mono">{a.ipAddress || "local"}</td>
                        </tr>
                      ))}
                      {audits.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center text-text-muted py-12">No database audits logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Audits Pagination */}
              {auditsTotalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-glass-border">
                  <span className="text-xs text-text-secondary">
                    Page {auditPage} of {auditsTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={auditPage === 1}
                      onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                      disabled={auditPage === auditsTotalPages}
                      onClick={() => setAuditPage(p => Math.min(auditsTotalPages, p + 1))}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
