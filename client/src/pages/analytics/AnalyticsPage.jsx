/**
 * AnalyticsPage — High fidelity data charts
 */

import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BarChart3, TrendingUp, PieChart as PieIcon, Users } from "lucide-react";

import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const COLORS = ["#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#64748B", "#EF4444"];

export default function AnalyticsPage() {
  // Fetch Revenue Trend
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ["trendData"],
    queryFn: async () => {
      const res = await apiClient.get("/analytics/revenue-trend");
      return res.data.data;
    },
  });

  // Fetch Order status distribution
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["statusData"],
    queryFn: async () => {
      const res = await apiClient.get("/analytics/order-distribution");
      return res.data.data;
    },
  });

  // Fetch Top Customers
  const { data: topCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ["topCustomers"],
    queryFn: async () => {
      const res = await apiClient.get("/analytics/top-customers");
      return res.data.data;
    },
  });

  // Fetch Collection Rate
  const { data: collectionRate, isLoading: rateLoading } = useQuery({
    queryKey: ["collectionRate"],
    queryFn: async () => {
      const res = await apiClient.get("/analytics/collection-rate");
      return res.data.data;
    },
  });

  const isLoading = trendLoading || statusLoading || customersLoading || rateLoading;

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <PageWrapper title="Analytics">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Business Intelligence</h1>
          <p className="text-xs text-text-secondary">Analytical trends on orders logged, revenue cycles, and collections.</p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Area Chart */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary-light" /> gross receipts & collections
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
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
                  <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="rgba(124, 58, 237, 0.1)" name="Gross Value" />
                  <Area type="monotone" dataKey="collected" stroke="#10B981" strokeWidth={2} fill="rgba(16, 185, 129, 0.1)" name="Receipts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collection efficiency */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-primary-light" /> Collection Rate Efficiency (%)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collectionRate}>
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
                  <Bar dataKey="rate" fill="#EC4899" radius={[4, 4, 0, 0]} name="Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order status Pie Chart */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-primary-light" /> Order Status Distribution
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {statusData?.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top customer spending */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary-light" /> Top Customer Value (Gross Spent)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" />
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{
                      background: "#1E293B",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#F1F5F9",
                    }}
                  />
                  <Bar dataKey="totalSpent" fill="#10B981" radius={[0, 4, 4, 0]} name="Spent Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
