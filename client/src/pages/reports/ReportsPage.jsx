/**
 * ReportsPage — Generate and export finance reports
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Download, FileSpreadsheet, Eye, Printer, Filter
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("revenue");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["reportData", reportType, from, to],
    queryFn: async () => {
      let url = "/reports/revenue";
      if (reportType === "pending-balance") url = "/reports/pending-balance";
      if (reportType === "advance-collection") url = "/reports/advance-collection";

      const res = await apiClient.get(url, { params: { from, to } });
      return res.data.data;
    },
  });

  const handleExportCSV = () => {
    let typeKey = "orders";
    if (reportType === "pending-balance") typeKey = "orders";
    if (reportType === "advance-collection") typeKey = "payments";

    window.open(`${import.meta.env.VITE_API_URL || "/api"}/reports/export/csv/${typeKey}`, "_blank");
    toast.success("CSV export initiated.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageWrapper title="Reports">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Financial Audits</h1>
            <p className="text-xs text-text-secondary">Generate and print balance lists and collections worksheets.</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Sheet
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer shadow-glow"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download CSV
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="glass-card-static p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input py-2 pr-8 w-auto min-w-[180px] cursor-pointer"
            >
              <option value="revenue">Revenue Summary</option>
              <option value="pending-balance">Outstanding Balances</option>
              <option value="advance-collection">Advance Collections</option>
            </select>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-secondary font-medium">From:</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="input py-1.5 text-xs cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-secondary font-medium">To:</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input py-1.5 text-xs cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Reports Visuals */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="glass-card p-6 flex flex-col gap-6">
            {reportType === "revenue" && (
              <>
                {/* Revenue stats summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-bg-secondary/30 p-4 border border-glass-border rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary uppercase font-bold">Gross Revenue</span>
                    <span className="text-lg font-black mt-1 text-text-primary">
                      ₹{(reportData?.summary?.totalRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary uppercase font-bold">Total Collected</span>
                    <span className="text-lg font-black mt-1 text-success">
                      ₹{(reportData?.summary?.totalCollected || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary uppercase font-bold">Advance Deposits</span>
                    <span className="text-lg font-black mt-1 text-primary-light">
                      ₹{(reportData?.summary?.totalAdvance || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary uppercase font-bold">Pending Balances</span>
                    <span className="text-lg font-black mt-1 text-danger">
                      ₹{(reportData?.summary?.totalPending || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Revenue detailed list */}
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total Amount</th>
                        <th>Paid</th>
                        <th>Balance Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.orders?.map((o, idx) => (
                        <tr key={idx}>
                          <td className="font-bold text-primary-light">{o.orderNumber}</td>
                          <td className="font-semibold">{o.customer?.name}</td>
                          <td>{format(new Date(o.orderDate), "MMM dd, yyyy")}</td>
                          <td className="font-bold">₹{parseFloat(o.grandTotal).toLocaleString()}</td>
                          <td className="text-success font-semibold">₹{parseFloat(o.paidAmount).toLocaleString()}</td>
                          <td className={`font-bold ${parseFloat(o.balanceAmount) > 0 ? "text-danger" : "text-success"}`}>
                            ₹{parseFloat(o.balanceAmount).toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge ${o.paymentStatus === "paid" ? "badge-success" : "badge-warning"}`}>
                              {o.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {reportType === "pending-balance" && (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer Details</th>
                      <th>Total Amount</th>
                      <th>Advance Collected</th>
                      <th>Outstanding Balance</th>
                      <th>Payment Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.map((o, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-primary-light">{o.orderNumber}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-xs">{o.customer?.name}</span>
                            <span className="text-[10px] text-text-muted">📞 {o.customer?.phone}</span>
                          </div>
                        </td>
                        <td>₹{parseFloat(o.grandTotal).toLocaleString()}</td>
                        <td className="text-success font-semibold">₹{parseFloat(o.paidAmount).toLocaleString()}</td>
                        <td className="font-black text-danger">₹{parseFloat(o.balanceAmount).toLocaleString()}</td>
                        <td className="font-medium text-text-secondary">
                          {o.paymentDueDate ? format(new Date(o.paymentDueDate), "MMM dd, yyyy") : "N/A"}
                        </td>
                      </tr>
                    ))}
                    {(!reportData || reportData.length === 0) && (
                      <tr>
                        <td colSpan="6" className="text-center text-text-muted py-8">No outstanding balances found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === "advance-collection" && (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Receipt Date</th>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Method</th>
                      <th>Txn Reference</th>
                      <th className="text-right">Advance Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.map((p, idx) => (
                      <tr key={idx}>
                        <td>{format(new Date(p.receivedDate), "MMM dd, yyyy")}</td>
                        <td className="font-bold text-primary-light">{p.bulkOrder?.orderNumber}</td>
                        <td className="font-semibold">{p.bulkOrder?.customer?.name}</td>
                        <td className="uppercase text-xs font-semibold text-text-secondary">{p.paymentMethod}</td>
                        <td className="text-xs text-text-muted">{p.referenceNumber || "N/A"}</td>
                        <td className="text-right font-black text-success">₹{parseFloat(p.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!reportData || reportData.length === 0) && (
                      <tr>
                        <td colSpan="6" className="text-center text-text-muted py-8">No advance collections recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
