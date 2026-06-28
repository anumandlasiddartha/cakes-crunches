/**
 * OrderDetail — Complete order detailed view with financial & status updates
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft, Calendar, MapPin, Receipt, Clock, User,
  Coins, CreditCard, ChevronRight, FileText, CheckCircle2,
  AlertTriangle, History, Wallet, Sparkles, Printer
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("items");

  // Fetch Order details
  const { data: orderData, isLoading, refetch } = useQuery({
    queryKey: ["orderDetail", id],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!orderData) return <div className="text-center py-20 text-danger font-bold">Order not found.</div>;

  const handleUpdateStatus = async (newStatus) => {
    Swal.fire({
      title: "Update Order Status?",
      text: `Are you sure you want to mark this order as ${newStatus.replace("_", " ")}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#7C3AED",
      cancelButtonColor: "#334155",
      confirmButtonText: "Yes, Update",
      background: "#1E293B",
      color: "#F1F5F9",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiClient.patch(`/orders/${id}/status`, { status: newStatus, notes: `Marked as ${newStatus}` });
          toast.success("Order status updated.");
          refetch();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update status.");
        }
      }
    });
  };

  const handleRecordPayment = async (type) => {
    const defaultAmount = type === "advance" 
      ? Math.max(0, parseFloat(orderData.grandTotal) * 0.3 - parseFloat(orderData.advanceAmount))
      : parseFloat(orderData.balanceAmount);

    Swal.fire({
      title: `Record ${type === "advance" ? "Advance" : "Balance"} Payment`,
      html: `
        <div class="flex flex-col text-left gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Amount (₹)</label>
            <input id="swal-amount" type="number" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm" value="${defaultAmount}">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Payment Method</label>
            <select id="swal-method" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="wallet">Customer Wallet</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Reference Number / Notes</label>
            <input id="swal-ref" type="text" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm" placeholder="Txn ID, Cheque #, etc.">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Record Transaction",
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#334155",
      background: "#1E293B",
      color: "#F1F5F9",
      preConfirm: () => {
        return {
          amount: document.getElementById("swal-amount").value,
          paymentMethod: document.getElementById("swal-method").value,
          referenceNumber: document.getElementById("swal-ref").value,
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { amount, paymentMethod, referenceNumber } = result.value;
        if (!amount || parseFloat(amount) <= 0) {
          toast.error("Please enter a valid amount.");
          return;
        }

        try {
          const url = type === "advance" ? "/payments/advance" : "/payments/balance";
          await apiClient.post(url, {
            bulkOrderId: orderData.id,
            amount: parseFloat(amount),
            paymentMethod,
            referenceNumber,
            notes: `Recorded ${type} payment via order panel.`,
          });
          toast.success("Payment recorded successfully!");
          refetch();
        } catch (error) {
          toast.error(error.response?.data?.message || "Payment recording failed.");
        }
      }
    });
  };

  const handleGenerateInvoice = async () => {
    try {
      const res = await apiClient.post(`/invoices/generate/${orderData.id}`);
      if (res.data.success) {
        toast.success("Invoice generated successfully!");
        refetch();
      }
    } catch (error) {
      toast.error("Failed to generate invoice.");
    }
  };

  const isAdvanceCollected = parseFloat(orderData.advanceAmount) > 0;
  const isFullyPaid = parseFloat(orderData.balanceAmount) <= 0;

  return (
    <PageWrapper title={`Order ${orderData.orderNumber}`}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="btn-secondary p-2.5 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-text-primary font-display">{orderData.orderNumber}</h1>
                <span className={`badge ${
                  orderData.status === "completed" ? "badge-success" : 
                  orderData.status === "in_production" ? "badge-primary" : 
                  "badge-warning"
                }`}>{orderData.status.replace("_", " ")}</span>
              </div>
              <p className="text-xs text-text-secondary">Logged on {format(new Date(orderData.createdAt), "PPP")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Sheet
            </button>

            {orderData.invoices?.length === 0 ? (
              <button
                onClick={handleGenerateInvoice}
                className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4" /> Generate Invoice
              </button>
            ) : (
              <button
                onClick={() => navigate(`/invoices`)}
                className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> View Invoice
              </button>
            )}
          </div>
        </div>

        {/* Workflow Timeline Status Bar */}
        <div className="glass-card-static p-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-glass-border">
          <div className="flex flex-col text-center md:text-left gap-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Workflow Progression</span>
            <span className="text-sm font-bold text-text-primary">Current Stage: <span className="text-primary-light capitalize">{orderData.status.replace("_", " ")}</span></span>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {orderData.status === "pending" && (
              <button
                onClick={() => handleUpdateStatus("confirmed")}
                className="btn-primary py-2 px-4 text-xs font-semibold cursor-pointer shadow-glow"
              >
                Confirm Order
              </button>
            )}
            {orderData.status === "confirmed" && (
              <button
                onClick={() => {
                  if (!isAdvanceCollected) {
                    toast.error("Please record an advance payment before starting production.");
                    return;
                  }
                  handleUpdateStatus("in_production");
                }}
                className="btn-primary py-2 px-4 text-xs font-semibold cursor-pointer shadow-glow"
              >
                Start Production
              </button>
            )}
            {orderData.status === "in_production" && (
              <button
                onClick={() => handleUpdateStatus("ready")}
                className="btn-primary py-2 px-4 text-xs font-semibold cursor-pointer shadow-glow"
              >
                Mark Ready for Dispatch
              </button>
            )}
            {orderData.status === "ready" && (
              <button
                onClick={() => handleUpdateStatus("delivered")}
                className="btn-primary py-2 px-4 text-xs font-semibold cursor-pointer shadow-glow"
              >
                Dispatch / Out for Delivery
              </button>
            )}
            {orderData.status === "delivered" && (
              <button
                onClick={() => {
                  if (!isFullyPaid) {
                    toast.error("Please collect the remaining balance before marking as completed.");
                    return;
                  }
                  handleUpdateStatus("completed");
                }}
                className="btn-success py-2 px-4 text-xs font-semibold cursor-pointer"
              >
                Complete Order
              </button>
            )}
            {orderData.status !== "completed" && orderData.status !== "cancelled" && (
              <button
                onClick={() => handleUpdateStatus("cancelled")}
                className="btn-danger py-2 px-4 text-xs font-semibold cursor-pointer"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Customer & Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card-static p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
                  <User className="w-4.5 h-4.5 text-primary-light" /> Customer File
                </div>
                <div className="h-px bg-glass-border" />
                <div className="flex flex-col gap-2.5 text-xs text-text-secondary">
                  <div>
                    <span className="block font-bold text-text-primary text-sm">{orderData.customer?.name}</span>
                    <span>📞 {orderData.customer?.phone}</span>
                  </div>
                  {orderData.customer?.email && <div>✉️ {orderData.customer?.email}</div>}
                  <div>📍 {orderData.customer?.city}, {orderData.customer?.address}</div>
                </div>
              </div>

              <div className="glass-card-static p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
                  <Calendar className="w-4.5 h-4.5 text-primary-light" /> Event Logistics
                </div>
                <div className="h-px bg-glass-border" />
                <div className="flex flex-col gap-2 text-xs text-text-secondary">
                  <div className="flex justify-between">
                    <span>Event Type:</span>
                    <span className="font-bold text-text-primary">{orderData.eventType || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Event Date:</span>
                    <span className="font-semibold text-text-primary">
                      {orderData.eventDate ? format(new Date(orderData.eventDate), "PPP") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Address:</span>
                    <span className="font-medium text-text-primary text-right max-w-[180px] truncate">
                      {orderData.deliveryAddress || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs (Items, Payments, History) */}
            <div className="glass-card-static p-6 flex flex-col gap-4">
              <div className="flex border-b border-glass-border gap-2">
                <button
                  onClick={() => setActiveTab("items")}
                  className={`pb-2.5 px-4 text-xs font-bold cursor-pointer transition-colors border-b-2 ${
                    activeTab === "items" ? "border-primary text-primary-light" : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  Order Items
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`pb-2.5 px-4 text-xs font-bold cursor-pointer transition-colors border-b-2 ${
                    activeTab === "payments" ? "border-primary text-primary-light" : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  Transactions ({orderData.advancePayments?.length + orderData.balancePayments?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`pb-2.5 px-4 text-xs font-bold cursor-pointer transition-colors border-b-2 ${
                    activeTab === "history" ? "border-primary text-primary-light" : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  Workflow History
                </button>
              </div>

              {/* Items List */}
              {activeTab === "items" && (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th>Specs / Flavor</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th className="text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.orderItems?.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className="font-bold text-text-primary">{item.itemName}</span>
                            {item.description && <span className="block text-[10px] text-text-muted">{item.description}</span>}
                          </td>
                          <td className="text-xs text-text-secondary">{item.flavor || "N/A"}</td>
                          <td>{item.quantity}</td>
                          <td>₹{parseFloat(item.unitPrice).toLocaleString()}</td>
                          <td className="text-right font-bold">₹{parseFloat(item.totalPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === "payments" && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-extrabold uppercase text-text-muted tracking-wider">Collected Payments</h4>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Method</th>
                          <th>Ref #</th>
                          <th className="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderData.advancePayments?.map((ap) => (
                          <tr key={`ap-${ap.id}`}>
                            <td>{format(new Date(ap.receivedDate || ap.createdAt), "MMM dd, yyyy")}</td>
                            <td><span className="badge badge-primary">Advance</span></td>
                            <td className="uppercase text-xs">{ap.paymentMethod}</td>
                            <td>{ap.referenceNumber || "N/A"}</td>
                            <td className="text-right font-bold text-success">₹{parseFloat(ap.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                        {orderData.balancePayments?.map((bp) => (
                          <tr key={`bp-${bp.id}`}>
                            <td>{format(new Date(bp.paidDate || bp.createdAt), "MMM dd, yyyy")}</td>
                            <td><span className="badge badge-success">Balance</span></td>
                            <td className="uppercase text-xs">{bp.paymentMethod}</td>
                            <td>{bp.referenceNumber || "N/A"}</td>
                            <td className="text-right font-bold text-success">₹{parseFloat(bp.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                        {orderData.advancePayments?.length === 0 && orderData.balancePayments?.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center text-text-muted py-6">No payments recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="flex flex-col gap-4 py-2">
                  <div className="relative pl-6 border-l border-glass-border flex flex-col gap-6">
                    {orderData.orderHistory?.map((hist) => (
                      <div key={hist.id} className="relative">
                        <div className="absolute -left-9.5 top-1.5 w-7 h-7 rounded-full bg-bg-secondary border border-glass-border flex items-center justify-center text-text-muted">
                          <History className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-text-primary">
                            Status changed to <span className="text-primary-light capitalize">{hist.toStatus.replace("_", " ")}</span>
                          </span>
                          <span className="text-text-muted mt-0.5">{hist.notes || "No details provided"}</span>
                          <span className="text-[10px] text-text-muted mt-1">{format(new Date(hist.createdAt), "PPp")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Financial Details */}
          <div className="flex flex-col gap-6">
            <div className="glass-card-static p-6 flex flex-col gap-5">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-primary-light" /> Billing Overview
              </h3>
              <div className="h-px bg-glass-border" />

              <div className="flex flex-col gap-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal:</span>
                  <span className="font-medium text-text-primary">₹{parseFloat(orderData.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Discount:</span>
                  <span className="font-medium text-danger">- ₹{parseFloat(orderData.discountAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">GST (Tax):</span>
                  <span className="font-medium text-text-primary">+ ₹{parseFloat(orderData.taxAmount).toLocaleString()}</span>
                </div>
                <div className="h-px bg-glass-border my-1" />
                <div className="flex justify-between text-sm font-black">
                  <span className="text-text-primary">Grand Total:</span>
                  <span className="text-text-primary">₹{parseFloat(orderData.grandTotal).toLocaleString()}</span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between text-[11px] font-semibold text-text-secondary">
                  <span>Collected: ₹{parseFloat(orderData.paidAmount).toLocaleString()}</span>
                  <span>{((parseFloat(orderData.paidAmount) / parseFloat(orderData.grandTotal)) * 100 || 0).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{ width: `${(parseFloat(orderData.paidAmount) / parseFloat(orderData.grandTotal)) * 100 || 0}%` }}
                  />
                </div>
              </div>

              {/* Financial Breakdowns */}
              <div className="grid grid-cols-2 gap-3 mt-1.5 text-center">
                <div className="p-3 bg-bg-secondary/40 border border-glass-border rounded-xl flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Advance</span>
                  <span className="text-xs font-extrabold text-success mt-1">₹{parseFloat(orderData.advanceAmount).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-bg-secondary/40 border border-glass-border rounded-xl flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Outstanding</span>
                  <span className={`text-xs font-extrabold mt-1 ${parseFloat(orderData.balanceAmount) > 0 ? "text-danger" : "text-success"}`}>
                    ₹{parseFloat(orderData.balanceAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Due Date alert */}
              {parseFloat(orderData.balanceAmount) > 0 && (
                <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger font-medium mt-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold">Balance Outstanding</span>
                    <span>Due on {orderData.paymentDueDate ? format(new Date(orderData.paymentDueDate), "PPP") : "N/A"}</span>
                  </div>
                </div>
              )}

              {/* Payment Actions */}
              <div className="flex flex-col gap-2 mt-2">
                {!isAdvanceCollected && (
                  <button
                    onClick={() => handleRecordPayment("advance")}
                    className="btn-primary py-2.5 text-xs font-bold cursor-pointer w-full flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-4 h-4" /> Collect Advance
                  </button>
                )}
                {!isFullyPaid && (
                  <button
                    onClick={() => handleRecordPayment("balance")}
                    className="btn-primary py-2.5 text-xs font-bold cursor-pointer w-full flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" /> Collect Balance
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
