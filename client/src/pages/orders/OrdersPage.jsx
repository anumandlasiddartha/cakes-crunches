/**
 * OrdersPage — Complete Bulk Orders Listing with pagination & search
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Search, Plus, Eye, Calendar, Filter, ChevronLeft, ChevronRight,
  TrendingDown, FileSpreadsheet, Check
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const limit = 10;

  // Fetch orders
  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, search, status, paymentStatus],
    queryFn: async () => {
      const res = await apiClient.get("/orders", {
        params: {
          page,
          limit,
          search,
          status,
          paymentStatus,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });
      return res.data;
    },
  });

  const orders = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const handleExportCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL || "/api"}/reports/export/csv/orders`, "_blank");
    toast.success("CSV export initiated.");
  };

  return (
    <PageWrapper title="Bulk Orders">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Bulk Orders</h1>
            <p className="text-xs text-text-secondary">Manage and track confectionery bulk orders.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Orders
            </button>
            <button
              onClick={() => navigate("/orders/new")}
              className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2 cursor-pointer shadow-glow"
            >
              <Plus className="w-4 h-4" /> Record Order
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="glass-card-static p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search order #, customer name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10.5 py-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input py-2 pr-8 w-auto min-w-[130px] cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_production">In Production</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Payment Status */}
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="input py-2 pr-8 w-auto min-w-[140px] cursor-pointer"
            >
              <option value="">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Order Date</th>
                    <th>Event Date</th>
                    <th>Grand Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Order Status</th>
                    <th>Payment</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-bold text-primary-light whitespace-nowrap">{order.orderNumber}</td>
                      <td className="font-medium">{order.customer?.name}</td>
                      <td className="whitespace-nowrap">{format(new Date(order.orderDate), "MMM dd, yyyy")}</td>
                      <td className="whitespace-nowrap">
                        {order.eventDate ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(order.eventDate), "MMM dd, yyyy")}
                          </span>
                        ) : "N/A"}
                      </td>
                      <td className="font-bold">₹{parseFloat(order.grandTotal).toLocaleString()}</td>
                      <td className="text-success font-semibold">₹{parseFloat(order.paidAmount).toLocaleString()}</td>
                      <td className={`font-bold ${parseFloat(order.balanceAmount) > 0 ? "text-danger" : "text-success"}`}>
                        ₹{parseFloat(order.balanceAmount).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${
                          order.status === "completed" ? "badge-success" : 
                          order.status === "in_production" ? "badge-primary" : 
                          order.status === "cancelled" ? "badge-danger" : 
                          "badge-warning"
                        }`}>{order.status.replace("_", " ")}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          order.paymentStatus === "paid" ? "badge-success" : 
                          order.paymentStatus === "partial" ? "badge-warning" : 
                          order.paymentStatus === "overdue" ? "badge-danger" : 
                          "badge-neutral"
                        }`}>{order.paymentStatus}</span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="btn-ghost py-1 px-2.5 text-xs flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="10" className="text-center text-text-muted py-12">No orders found.</td>
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
