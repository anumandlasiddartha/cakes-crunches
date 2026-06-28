/**
 * AdvanceCollectionPage — Manage and track advance collections
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Coins, Clock, AlertTriangle, ShieldCheck, ChevronRight, Eye
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function AdvanceCollectionPage() {
  const navigate = useNavigate();

  // Fetch orders pending advance (in pending/confirmed state with incomplete advance)
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ["ordersPendingAdvance"],
    queryFn: async () => {
      const res = await apiClient.get("/orders", { params: { limit: 50 } });
      // Filter orders where status is pending or confirmed, and paidAmount is less than 30% of grandTotal
      return res.data.data.filter((order) => {
        const grandTotal = parseFloat(order.grandTotal);
        const paid = parseFloat(order.paidAmount);
        const percent = grandTotal > 0 ? (paid / grandTotal) * 100 : 0;
        return percent < 30 && order.status !== "cancelled" && order.status !== "completed";
      });
    },
  });

  const orders = ordersData || [];

  return (
    <PageWrapper title="Advance Collections">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/payments")}
            className="btn-secondary p-2.5 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Advance Collections</h1>
            <p className="text-xs text-text-secondary">Verify advance payment deposits before triggering production cycles.</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl text-xs text-text-primary leading-relaxed">
          <Coins className="w-5 h-5 text-primary-light shrink-0 mt-0.5" />
          <div>
            <span className="block font-bold mb-1">Bakery Advance Requirement Rule</span>
            <span>
              All custom confectionery bulk orders require a minimum of **30% advance deposit** before production begins. 
              Orders with insufficient advance deposits are flagged below.
            </span>
          </div>
        </div>

        {/* List of orders pending advance */}
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
                    <th>Grand Total</th>
                    <th>Advance Paid</th>
                    <th>Advance %</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const grandTotal = parseFloat(order.grandTotal);
                    const paid = parseFloat(order.paidAmount);
                    const percent = grandTotal > 0 ? (paid / grandTotal) * 100 : 0;

                    return (
                      <tr key={order.id}>
                        <td className="font-bold text-primary-light whitespace-nowrap">{order.orderNumber}</td>
                        <td className="font-semibold">{order.customer?.name}</td>
                        <td className="font-semibold">₹{grandTotal.toLocaleString()}</td>
                        <td className="font-bold text-warning">₹{paid.toLocaleString()}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-danger">{percent.toFixed(0)}%</span>
                            <div className="w-20 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-danger rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-warning flex items-center gap-1 self-start">
                            <AlertTriangle className="w-3 h-3" /> Production Blocked
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="btn-ghost py-1 px-2.5 text-xs flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Collect Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-text-muted py-12">
                        🎉 All active orders have met the 30% advance collection requirement!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
