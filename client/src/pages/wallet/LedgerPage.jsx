/**
 * LedgerPage — System transaction ledger for double-entry tracking
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BookOpen, Calendar, Search, Download, ChevronLeft, ChevronRight
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function LedgerPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const limit = 15;

  // Fetch ledger summary stats
  const { data: summaryData } = useQuery({
    queryKey: ["ledgerSummary"],
    queryFn: async () => {
      const res = await apiClient.get("/ledger/summary");
      return res.data.data;
    },
  });

  // Fetch ledger entries
  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ["ledgerEntries", page, type],
    queryFn: async () => {
      const res = await apiClient.get("/ledger", { params: { page, limit, type } });
      return res.data;
    },
  });

  const summary = summaryData || {};
  const entries = ledgerData?.data || [];
  const totalPages = ledgerData?.pagination?.totalPages || 1;

  const handleExportCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL || "/api"}/reports/export/csv/payments`, "_blank");
    toast.success("CSV export initiated.");
  };

  return (
    <PageWrapper title="System Ledger">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">System Ledger</h1>
            <p className="text-xs text-text-secondary">Audit trail of all financial events and cash inflows.</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Ledger
          </button>
        </div>

        {/* Financial Summary panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 flex flex-col gap-3">
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Book Balance</span>
            <span className="text-2xl font-black font-display text-text-primary">
              ₹{(summary.currentBalance || 0).toLocaleString()}
            </span>
          </div>

          <div className="glass-card p-5 flex flex-col gap-3">
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Total Credits</span>
            <span className="text-2xl font-black font-display text-success">
              ₹{(summary.totalCredit || 0).toLocaleString()}
            </span>
          </div>

          <div className="glass-card p-5 flex flex-col gap-3">
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Total Debits</span>
            <span className="text-2xl font-black font-display text-danger">
              ₹{(summary.totalDebit || 0).toLocaleString()}
            </span>
          </div>

          <div className="glass-card p-5 flex flex-col gap-3">
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Total Entries</span>
            <span className="text-2xl font-black font-display text-text-primary">
              {summary.totalEntries || 0}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card-static p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="input py-2 pr-8 w-auto min-w-[160px] cursor-pointer"
            >
              <option value="">All Transactions</option>
              <option value="advance_received">Advance Payments</option>
              <option value="balance_received">Balance Settlements</option>
              <option value="wallet_credit">Wallet Credits</option>
              <option value="wallet_debit">Wallet Debits</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Debit (₹)</th>
                    <th>Credit (₹)</th>
                    <th className="text-right">Book Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap">{format(new Date(e.createdAt), "MMM dd, yyyy HH:mm")}</td>
                      <td className="font-bold text-text-secondary whitespace-nowrap">{e.transactionRef}</td>
                      <td>
                        <span className={`badge ${
                          e.type.startsWith("wallet") ? "badge-primary" : 
                          e.type.includes("received") ? "badge-success" : 
                          "badge-neutral"
                        }`}>{e.type.replace("_", " ")}</span>
                      </td>
                      <td className="text-text-secondary font-medium min-w-[200px]">{e.description}</td>
                      <td className="text-danger font-semibold">
                        {parseFloat(e.debit) > 0 ? `₹${parseFloat(e.debit).toLocaleString()}` : "—"}
                      </td>
                      <td className="text-success font-semibold">
                        {parseFloat(e.credit) > 0 ? `₹${parseFloat(e.credit).toLocaleString()}` : "—"}
                      </td>
                      <td className="text-right font-black">₹{parseFloat(e.runningBalance).toLocaleString()}</td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-text-muted py-12">No ledger records found.</td>
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
