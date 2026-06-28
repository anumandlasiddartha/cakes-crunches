/**
 * ActivityLogsPage — User audit activity logs
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Activity, ChevronLeft, ChevronRight, Search
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["activityLogs", page],
    queryFn: async () => {
      const res = await apiClient.get("/admin/activity-logs", { params: { page, limit } });
      return res.data;
    },
  });

  const logs = logsData?.data || [];
  const totalPages = logsData?.pagination?.totalPages || 1;

  return (
    <PageWrapper title="Activity Logs">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Operational Events</h1>
          <p className="text-xs text-text-secondary">Chronological history log of system actions by active operators.</p>
        </div>

        {/* Logs List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Operator</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-bold text-text-primary">
                        {log.user?.firstName} {log.user?.lastName}
                      </td>
                      <td>
                        <span className="badge badge-primary">{log.action.replace("_", " ")}</span>
                      </td>
                      <td className="text-text-secondary font-medium">{log.details || "—"}</td>
                      <td className="text-xs text-text-muted font-mono">{log.ipAddress || "local"}</td>
                      <td className="text-xs text-text-secondary whitespace-nowrap">
                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-text-muted py-12">No activity events logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-glass-border">
                <span className="text-xs text-text-secondary">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
