/**
 * DashboardPage — Premium Enterprise Financial Dashboard
 */

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingBag, Clock, CheckCircle2,
  Coins, Scale, Wallet, Sparkles, Plus, Download,
  ArrowUpRight, AlertTriangle, Bell, UserPlus, FileText
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const navigate = useNavigate();

  // Fetch all dashboard KPI and lists
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const res = await apiClient.get("/dashboard/kpis");
      return res.data.data;
    },
  });

  // Fetch charts data
  const { data: chartData } = useQuery({
    queryKey: ["dashboardChart"],
    queryFn: async () => {
      const res = await apiClient.get("/analytics/revenue-trend");
      return res.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  const { kpis, recentOrders, upcomingDues, recentActivities } = data || {};

  const handleExportCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL || "/api"}/reports/export/csv/orders`, "_blank");
    toast.success("CSV export initiated.");
  };

  const containerVariants = {
    animate: { transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  const cards = [
    { label: "Gross Revenue", value: kpis?.totalRevenue, icon: TrendingUp, color: "text-success", bg: "bg-success/10", suffix: true },
    { label: "Today's Orders", value: kpis?.todayOrders, icon: ShoppingBag, color: "text-info", bg: "bg-info/10" },
    { label: "Pending Production", value: kpis?.pendingOrders, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Completed Orders", value: kpis?.completedOrders, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Advance Collected", value: kpis?.totalAdvance, icon: Coins, color: "text-primary-light", bg: "bg-primary/10", suffix: true },
    { label: "Pending Balance", value: kpis?.totalPendingBalance, icon: Scale, color: "text-danger", bg: "bg-danger/10", suffix: true },
    { label: "Wallet Liquidity", value: kpis?.walletBalance, icon: Wallet, color: "text-primary-light", bg: "bg-primary/10", suffix: true },
    { label: "Today's Collection", value: kpis?.todayCollection, icon: Sparkles, color: "text-success", bg: "bg-success/10", suffix: true },
  ];

  return (
    <PageWrapper title="Dashboard">
      <div className="flex flex-col gap-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Financial Summary</h1>
            <p className="text-xs text-text-secondary">Cakes & Crunches Bulk Order tracking & balance engine.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => navigate("/orders/new")}
              className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2 cursor-pointer shadow-glow"
            >
              <Plus className="w-4 h-4" /> Record Order
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="glass-card p-5 flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black font-display text-text-primary">
                  {card.suffix ? `₹${(card.value || 0).toLocaleString()}` : card.value || 0}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart + Summary Column */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="xl:col-span-2 glass-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-text-primary">Revenue Trend</h3>
                <span className="text-[10px] text-text-muted">Trailing 12-month analytics of order values & collections.</span>
              </div>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1E293B",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#F1F5F9",
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Order Value" />
                  <Area type="monotone" dataKey="collected" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" name="Collected" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions & Recent Activities */}
          <div className="glass-card p-6 flex flex-col gap-5">
            <h3 className="text-base font-bold text-text-primary">Recent Logs</h3>
            <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[280px] pr-1">
              {recentActivities?.slice(0, 5).map((act) => (
                <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                  <div className="w-6 h-6 rounded-full bg-glass-hover flex items-center justify-center text-text-secondary shrink-0 font-bold">
                    {act.user?.firstName?.[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-primary font-medium">{act.details}</span>
                    <span className="text-[10px] text-text-muted">{format(new Date(act.createdAt), "PPp")}</span>
                  </div>
                </div>
              ))}
              {(!recentActivities || recentActivities.length === 0) && (
                <div className="text-center text-xs text-text-muted py-10">No logs found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="glass-card p-6 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-text-primary">Recent Orders</h3>
              <button
                onClick={() => navigate("/orders")}
                className="text-xs text-primary-light hover:text-primary transition-colors flex items-center gap-1 font-semibold cursor-pointer"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders?.slice(0, 5).map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="cursor-pointer"
                    >
                      <td className="font-bold text-primary-light">{o.orderNumber}</td>
                      <td>{o.customer?.name}</td>
                      <td className="font-semibold">₹{(o.grandTotal || 0).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          o.status === "completed" ? "badge-success" : 
                          o.status === "in_production" ? "badge-primary" : 
                          o.status === "cancelled" ? "badge-danger" : 
                          "badge-warning"
                        }`}>{o.status.replace("_", " ")}</span>
                      </td>
                    </tr>
                  ))}
                  {(!recentOrders || recentOrders.length === 0) && (
                    <tr>
                      <td colSpan="4" className="text-center text-text-muted py-8">No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Due Dates */}
          <div className="glass-card p-6 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-text-primary">Outstanding Balances</h3>
              <button
                onClick={() => navigate("/payments/balance")}
                className="text-xs text-primary-light hover:text-primary transition-colors flex items-center gap-1 font-semibold cursor-pointer"
              >
                Collect Balance <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Due Amount</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDues?.slice(0, 5).map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="cursor-pointer"
                    >
                      <td className="font-bold text-primary-light">{o.orderNumber}</td>
                      <td>{o.customer?.name}</td>
                      <td className="font-bold text-danger">₹{(o.balanceAmount || 0).toLocaleString()}</td>
                      <td className="text-text-secondary font-medium">
                        {o.paymentDueDate ? format(new Date(o.paymentDueDate), "MMM dd, yyyy") : "N/A"}
                      </td>
                    </tr>
                  ))}
                  {(!upcomingDues || upcomingDues.length === 0) && (
                    <tr>
                      <td colSpan="4" className="text-center text-text-muted py-8">No outstanding balances.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
