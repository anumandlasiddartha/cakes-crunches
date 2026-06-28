/**
 * WalletPage — Customer wallets directory
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Wallet, Search, Coins, ArrowUpRight, Plus, Eye } from "lucide-react";

import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function WalletPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Fetch global wallet stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["walletStats"],
    queryFn: async () => {
      const res = await apiClient.get("/wallet/stats");
      return res.data.data;
    },
  });

  // Fetch customers with wallets
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customersWallets", search],
    queryFn: async () => {
      const res = await apiClient.get("/customers", { params: { search, limit: 50 } });
      return res.data.data;
    },
  });

  const stats = statsData || {};
  const customers = customersData || [];

  return (
    <PageWrapper title="Customer Wallets">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Wallet Directory</h1>
            <p className="text-xs text-text-secondary">Manage customer credit wallets and pre-payments.</p>
          </div>
        </div>

        {/* Global wallet stats */}
        {statsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Total Pre-Funded Liquidity</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary-light">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-black font-display text-text-primary">
                ₹{(stats.totalBalance || 0).toLocaleString()}
              </span>
            </div>

            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Active Wallets</span>
                <div className="p-2 rounded-xl bg-info/10 text-info">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-black font-display text-text-primary">
                {stats.totalWallets || 0}
              </span>
            </div>

            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Daily Wallet Credits</span>
                <div className="p-2 rounded-xl bg-success/10 text-success">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-black font-display text-text-primary">
                ₹{(stats.dailyCredits || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card-static p-4 flex items-center">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search customer profile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10.5 py-2"
            />
          </div>
        </div>

        {/* Wallets Directory */}
        {customersLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Details</th>
                    <th>Wallet Balance</th>
                    <th>Total Credits</th>
                    <th>Total Debits</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-glass-hover flex items-center justify-center text-text-secondary font-bold">
                            {c.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-sm">{c.name}</span>
                            <span className="text-[10px] text-text-muted">📞 {c.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="font-extrabold text-primary-light">
                        ₹{parseFloat(c.wallet?.balance || 0).toLocaleString()}
                      </td>
                      <td className="text-success font-semibold">
                        ₹{parseFloat(c.wallet?.totalCredit || 0).toLocaleString()}
                      </td>
                      <td className="text-danger font-semibold">
                        ₹{parseFloat(c.wallet?.totalDebit || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${c.wallet?.isActive !== false ? "badge-success" : "badge-neutral"}`}>
                          {c.wallet?.isActive !== false ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => navigate(`/customers/${c.id}`)}
                          className="btn-ghost py-1 px-2.5 text-xs flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Manage Wallet
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-text-muted py-12">No customer records.</td>
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

// Inline fallback icon
function TrendingUp({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 12.185-2.533L22.25 6m0 0H16.5m5.75 0v5.75" />
    </svg>
  );
}
