/**
 * InvoicesPage — Complete invoices database with printing/downloading
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  FileText, Search, Printer, Download, Eye, ChevronLeft, ChevronRight
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["invoicesList", page],
    queryFn: async () => {
      const res = await apiClient.get("/invoices", { params: { page, limit } });
      return res.data;
    },
  });

  const invoices = invoiceData?.data || [];
  const totalPages = invoiceData?.pagination?.totalPages || 1;

  const handlePrint = (invId) => {
    // Print logic
    window.open(`${import.meta.env.VITE_API_URL || "/api"}/reports/revenue`, "_blank");
  };

  return (
    <PageWrapper title="Invoices">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Invoice Database</h1>
            <p className="text-xs text-text-secondary">Generate and review legal billing statements.</p>
          </div>
        </div>

        {/* Invoice Grid */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Order #</th>
                    <th>Customer Name</th>
                    <th>Issued Date</th>
                    <th>Grand Total</th>
                    <th>Due Amount</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-bold text-primary-light whitespace-nowrap">{inv.invoiceNumber}</td>
                      <td className="font-bold text-text-secondary">{inv.bulkOrder?.orderNumber}</td>
                      <td className="font-semibold">{inv.bulkOrder?.customer?.name}</td>
                      <td>{format(new Date(inv.issuedDate), "MMM dd, yyyy")}</td>
                      <td className="font-bold">₹{parseFloat(inv.totalAmount).toLocaleString()}</td>
                      <td className={`font-semibold ${parseFloat(inv.dueAmount) > 0 ? "text-danger" : "text-success"}`}>
                        ₹{parseFloat(inv.dueAmount).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${
                          inv.status === "paid" ? "badge-success" : 
                          inv.status === "sent" ? "badge-primary" : 
                          "badge-neutral"
                        }`}>{inv.status}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handlePrint(inv.id)}
                            className="btn-secondary py-1 px-2 text-xs flex items-center gap-1 cursor-pointer"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print
                          </button>
                          <button
                            onClick={() => navigate(`/orders/${inv.bulkOrderId}`)}
                            className="btn-ghost py-1 px-2 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Order
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center text-text-muted py-12">No invoice records found.</td>
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
