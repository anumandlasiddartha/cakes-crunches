/**
 * CustomerDetail — Detailed customer file with orders history, wallet transactions, and wallet action
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft, Coins, Wallet, Clock, User, Plus, FileText,
  CheckCircle2, AlertTriangle, ShieldCheck, MapPin, Receipt,
  Sparkles, History, ShoppingBag
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("orders");

  // Fetch Customer details
  const { data: customer, isLoading, refetch } = useQuery({
    queryKey: ["customerDetail", id],
    queryFn: async () => {
      const res = await apiClient.get(`/customers/${id}`);
      return res.data.data;
    },
  });

  // Fetch Wallet Transactions
  const { data: walletData } = useQuery({
    queryKey: ["customerWallet", id],
    queryFn: async () => {
      const res = await apiClient.get(`/wallet/${id}/transactions`);
      return res.data.data;
    },
  });

  const wallet = customer?.wallet;
  const orders = customer?.bulkOrders || [];
  const walletTransactions = walletData?.transactions || [];

  const handleWalletAction = (type) => {
    Swal.fire({
      title: `${type === "credit" ? "Credit" : "Debit"} Wallet`,
      html: `
        <div class="flex flex-col text-left gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Amount (₹)</label>
            <input id="swal-amount" type="number" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm" placeholder="0.00">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Transaction Description</label>
            <input id="swal-desc" type="text" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm" placeholder="Refund, pre-payment, adjustments...">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `${type === "credit" ? "Add Credit" : "Debit Balance"}`,
      confirmButtonColor: "#7C3AED",
      cancelButtonColor: "#334155",
      background: "#1E293B",
      color: "#F1F5F9",
      preConfirm: () => {
        return {
          amount: document.getElementById("swal-amount").value,
          description: document.getElementById("swal-desc").value,
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { amount, description } = result.value;
        if (!amount || parseFloat(amount) <= 0) {
          toast.error("Please enter a valid amount.");
          return;
        }

        try {
          const url = type === "credit" ? "/wallet/credit" : "/wallet/debit";
          await apiClient.post(url, {
            customerId: customer.id,
            amount: parseFloat(amount),
            description,
          });
          toast.success("Wallet updated successfully!");
          refetch();
          queryClient.invalidateQueries(["customerWallet", id]);
        } catch (error) {
          toast.error(error.response?.data?.message || "Transaction failed.");
        }
      }
    });
  };

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!customer) return <div className="text-center py-20 text-danger font-bold">Customer profile not found.</div>;

  // Calculate outstanding balance across all orders
  const totalOutstanding = orders.reduce((sum, o) => sum + parseFloat(o.balanceAmount || 0), 0);

  const kpiCards = [
    { label: "Total Spent", value: customer.totalSpent, icon: Coins, color: "text-success", bg: "bg-success/10", currency: true },
    { label: "Orders Placed", value: customer.totalOrders, icon: ShoppingBag, color: "text-info", bg: "bg-info/10" },
    { label: "Wallet Balance", value: wallet?.balance || 0, icon: Wallet, color: "text-primary-light", bg: "bg-primary/10", currency: true },
    { label: "Pending Balance", value: totalOutstanding, icon: AlertTriangle, color: totalOutstanding > 0 ? "text-danger" : "text-success", bg: totalOutstanding > 0 ? "bg-danger/10" : "bg-success/10", currency: true },
  ];

  return (
    <PageWrapper title={`${customer.name} - File`}>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/customers")}
              className="btn-secondary p-2.5 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{customer.name}</h1>
              <p className="text-xs text-text-secondary">📍 {customer.city || "Location details incomplete"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleWalletAction("credit")}
              className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Credit Wallet
            </button>
            <button
              onClick={() => handleWalletAction("debit")}
              className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer text-danger border-danger/25 hover:bg-danger/5"
            >
              Debit Wallet
            </button>
          </div>
        </div>

        {/* Customer KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => (
            <div key={idx} className="glass-card p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black font-display text-text-primary">
                {card.currency ? `₹${parseFloat(card.value).toLocaleString()}` : card.value}
              </span>
            </div>
          ))}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-card-static p-6 flex flex-col gap-4">
              <div className="flex border-b border-glass-border gap-2">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`pb-2.5 px-4 text-xs font-bold cursor-pointer transition-colors border-b-2 ${
                    activeTab === "orders" ? "border-primary text-primary-light" : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  Bulk Orders ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab("wallet")}
                  className={`pb-2.5 px-4 text-xs font-bold cursor-pointer transition-colors border-b-2 ${
                    activeTab === "wallet" ? "border-primary text-primary-light" : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  Wallet History ({walletTransactions.length})
                </button>
              </div>

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Event Date</th>
                        <th>Grand Total</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => navigate(`/orders/${o.id}`)}
                          className="cursor-pointer"
                        >
                          <td className="font-bold text-primary-light">{o.orderNumber}</td>
                          <td>{o.eventDate ? format(new Date(o.eventDate), "MMM dd, yyyy") : "N/A"}</td>
                          <td className="font-semibold">₹{parseFloat(o.grandTotal).toLocaleString()}</td>
                          <td className={`font-bold ${parseFloat(o.balanceAmount) > 0 ? "text-danger" : "text-success"}`}>
                            ₹{parseFloat(o.balanceAmount).toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge ${
                              o.status === "completed" ? "badge-success" : 
                              o.status === "cancelled" ? "badge-danger" : 
                              "badge-warning"
                            }`}>{o.status.replace("_", " ")}</span>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center text-text-muted py-8">No order history found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Wallet Transactions Tab */}
              {activeTab === "wallet" && (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{format(new Date(tx.createdAt), "MMM dd, yyyy")}</td>
                          <td className="font-bold text-text-secondary">{tx.reference || "N/A"}</td>
                          <td>
                            <span className={`badge ${tx.type === "credit" ? "badge-success" : "badge-danger"}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="text-text-secondary font-medium">{tx.description}</td>
                          <td className={`text-right font-bold ${tx.type === "credit" ? "text-success" : "text-danger"}`}>
                            ₹{parseFloat(tx.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {walletTransactions.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center text-text-muted py-8">No wallet movements found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Profile Details Sidebar */}
          <div className="glass-card-static p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <User className="w-4.5 h-4.5 text-primary-light" /> Profile Information
            </h3>
            <div className="h-px bg-glass-border" />

            <div className="flex flex-col gap-4 text-xs text-text-secondary">
              <div>
                <span className="block text-[10px] text-text-muted font-bold uppercase tracking-wide">Email Address</span>
                <span className="font-semibold text-text-primary text-sm">{customer.email || "No email logged"}</span>
              </div>

              <div>
                <span className="block text-[10px] text-text-muted font-bold uppercase tracking-wide">Phone Number</span>
                <span className="font-semibold text-text-primary text-sm">{customer.phone}</span>
                {customer.altPhone && <span className="block text-[10px] text-text-muted mt-0.5">Alt: {customer.altPhone}</span>}
              </div>

              <div>
                <span className="block text-[10px] text-text-muted font-bold uppercase tracking-wide">GST Number</span>
                <span className="font-semibold text-text-primary text-sm">{customer.gstNumber || "Unregistered"}</span>
              </div>

              <div>
                <span className="block text-[10px] text-text-muted font-bold uppercase tracking-wide">Full Billing Address</span>
                <span className="font-semibold text-text-primary block leading-relaxed mt-0.5">
                  {customer.address || "Address fields incomplete."}
                </span>
              </div>

              <div>
                <span className="block text-[10px] text-text-muted font-bold uppercase tracking-wide">File Notes</span>
                <span className="block text-text-secondary leading-relaxed mt-1 italic">
                  {customer.notes || "No special notations logged."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
