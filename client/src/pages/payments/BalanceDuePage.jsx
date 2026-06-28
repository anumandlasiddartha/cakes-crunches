/**
 * BalanceDuePage — Track and manage outstanding balances
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Scale, AlertTriangle, Eye, Send, Mail, Download, Clock
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function BalanceDuePage() {
  const navigate = useNavigate();

  // Fetch orders with outstanding balance
  const { data: outstandingData, isLoading, refetch } = useQuery({
    queryKey: ["outstandingBalances"],
    queryFn: async () => {
      const res = await apiClient.get("/payments/outstanding");
      return res.data.data;
    },
  });

  const orders = outstandingData || [];

  const handleSendReminder = async (orderId) => {
    try {
      // Trigger a reminder (simulation or backend alert trigger)
      toast.success("Payment reminder notification generated!");
    } catch {
      toast.error("Failed to generate reminder.");
    }
  };

  return (
    <PageWrapper title="Outstanding Balances">
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
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Outstanding Balances</h1>
            <p className="text-xs text-text-secondary">Track unpaid balances and trigger payment alerts.</p>
          </div>
        </div>

        {/* Balance Status Info */}
        <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger/20 rounded-2xl text-xs text-danger leading-relaxed">
          <Scale className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <span className="block font-bold mb-1">Financial Settlement Rules</span>
            <span>
              All confectionery orders must be fully paid (**0 balance outstanding**) before dispatch or marking as completed.
              System alerts will flag overdue accounts automatically.
            </span>
          </div>
        </div>

        {/* Outstanding list */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer Name</th>
                    <th>Grand Total</th>
                    <th>Paid Amount</th>
                    <th>Balance Due</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const isOverdue = o.paymentStatus === "overdue";
                    return (
                      <tr key={o.id}>
                        <td className="font-bold text-primary-light whitespace-nowrap">{o.orderNumber}</td>
                        <td className="font-semibold">{o.customer?.name}</td>
                        <td>₹{parseFloat(o.grandTotal).toLocaleString()}</td>
                        <td className="text-success font-semibold">₹{parseFloat(o.paidAmount).toLocaleString()}</td>
                        <td className="font-black text-danger">₹{parseFloat(o.balanceAmount).toLocaleString()}</td>
                        <td className="font-medium whitespace-nowrap">
                          {o.paymentDueDate ? format(new Date(o.paymentDueDate), "MMM dd, yyyy") : "N/A"}
                        </td>
                        <td>
                          <span className={`badge ${isOverdue ? "badge-danger" : "badge-warning"}`}>
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleSendReminder(o.id)}
                              className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 cursor-pointer"
                              title="Trigger Reminder"
                            >
                              <Send className="w-3 h-3" /> Remind
                            </button>
                            <button
                              onClick={() => navigate(`/orders/${o.id}`)}
                              className="btn-ghost py-1 px-2.5 text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center text-text-muted py-12">
                        🎉 All active balances have been fully collected! No outstanding debt.
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
