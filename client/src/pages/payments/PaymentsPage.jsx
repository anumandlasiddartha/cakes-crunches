/**
 * PaymentsPage — Overall financial collections dashboard
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  CreditCard, TrendingUp, Coins, Calendar, ArrowUpRight,
  ChevronLeft, ChevronRight, FileSpreadsheet, Download
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch payments statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["paymentStats"],
    queryFn: async () => {
      const res = await apiClient.get("/payments/stats");
      return res.data.data;
    },
  });

  // Fetch payments list
  const { data: paymentsData, isLoading: listLoading } = useQuery({
    queryKey: ["paymentsList", page],
    queryFn: async () => {
      const res = await apiClient.get("/payments", { params: { page, limit } });
      return res.data;
    },
  });

  const stats = statsData || {};
  const payments = paymentsData?.data || [];
  const totalPages = paymentsData?.pagination?.totalPages || 1;

  const handleExportCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL || "/api"}/reports/export/csv/payments`, "_blank");
    toast.success("CSV export initiated.");
  };

  const kpis = [
    { label: "Gross Receipts", value: stats.total, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: "Today's Collection", value: stats.daily, icon: CreditCard, color: "text-info", bg: "bg-info/10" },
    { label: "This Week", value: stats.weekly, icon: Calendar, color: "text-primary-light", bg: "bg-primary/10" },
    { label: "This Month", value: stats.monthly, icon: Coins, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <PageWrapper title="Payments Dashboard">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Financial Tracker</h1>
            <p className="text-xs text-text-secondary">Monitor payment collections and system cashflow.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Ledger
            </button>
            <button
              onClick={() => navigate("/payments/balance")}
              className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2 cursor-pointer shadow-glow"
            >
              Collect Payments
            </button>
          </div>
        </div>

        {/* KPIs */}
        {statsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((card, idx) => (
              <div key={idx} className="glass-card p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">{card.label}</span>
                  <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-black font-display text-text-primary">
                  ₹{(card.value || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Collections Breakdown Page navigation buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => navigate("/payments/advance")}
            className="glass-card p-6 flex flex-col gap-3 cursor-pointer relative overflow-hidden group"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-text-primary group-hover:text-primary-light transition-colors">Advance Collection Queue</h3>
              <ArrowUpRight className="w-5 h-5 text-text-muted group-hover:text-primary-light group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Verify advance deposits before production triggers. Monitor minimum thresholds (30%) and flag insufficient orders.
            </p>
          </div>

          <div
            onClick={() => navigate("/payments/balance")}
            className="glass-card p-6 flex flex-col gap-3 cursor-pointer relative overflow-hidden group"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-text-primary group-hover:text-primary-light transition-colors">Balance Collections Panel</h3>
              <ArrowUpRight className="w-5 h-5 text-text-muted group-hover:text-primary-light group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Track outstanding balances, manage due dates, detect overdue bills, and trigger automated reminders.
            </p>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="glass-card p-6 flex flex-col gap-4 overflow-hidden">
          <h3 className="text-base font-bold text-text-primary">Recent Receipts</h3>
          {listLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order #</th>
                    <th>Customer Name</th>
                    <th>Type</th>
                    <th>Payment Method</th>
                    <th>Reference</th>
                    <th className="text-right">Collected Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, idx) => (
                    <tr
                      key={idx}
                      onClick={() => navigate(`/orders/${p.bulkOrderId}`)}
                      className="cursor-pointer"
                    >
                      <td className="whitespace-nowrap">{format(new Date(p.receivedDate || p.createdAt), "MMM dd, yyyy")}</td>
                      <td className="font-bold text-primary-light">{p.bulkOrder?.orderNumber}</td>
                      <td className="font-semibold">{p.bulkOrder?.customer?.name}</td>
                      <td>
                        <span className={`badge ${p.paymentType === "advance" ? "badge-primary" : "badge-success"}`}>
                          {p.paymentType}
                        </span>
                      </td>
                      <td className="uppercase text-xs font-semibold text-text-secondary">{p.paymentMethod}</td>
                      <td className="text-text-muted text-xs">{p.referenceNumber || "N/A"}</td>
                      <td className="text-right font-black text-success">₹{parseFloat(p.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-text-muted py-8">No collections tracked.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

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
      </div>
    </PageWrapper>
  );
}
