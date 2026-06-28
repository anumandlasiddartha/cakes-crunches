/**
 * CustomersPage — Complete customer directory with quick creation
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search, Plus, Eye, User, Phone, Mail, MapPin, ChevronLeft,
  ChevronRight, Sparkles, Loader2, Save, X
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  email: z.string().email("Valid email is required.").or(z.literal("")),
  city: z.string().optional(),
  address: z.string().optional(),
});

export default function CustomersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const limit = 10;

  // Fetch Customers
  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, search],
    queryFn: async () => {
      const res = await apiClient.get("/customers", {
        params: { page, limit, search },
      });
      return res.data;
    },
  });

  const customers = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  // Create customer form
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", email: "", city: "", address: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (customerData) => {
      // Empty email cleanup
      if (customerData.email === "") delete customerData.email;
      const res = await apiClient.post("/customers", customerData);
      return res.data;
    },
    onSuccess: () => {
      toast.success("New customer profile created!");
      queryClient.invalidateQueries(["customers"]);
      setShowAddModal(false);
      reset();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create customer.");
    },
  });

  const onSubmit = (formData) => {
    createMutation.mutate(formData);
  };

  return (
    <PageWrapper title="Customers">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Customer Directory</h1>
            <p className="text-xs text-text-secondary">Register new profiles and monitor order volumes.</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2 cursor-pointer shadow-glow"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card-static p-4 flex items-center">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, phone, city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10.5 py-2"
            />
          </div>
        </div>

        {/* Directory grid/table */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Details</th>
                    <th>Location</th>
                    <th>Wallet Balance</th>
                    <th>Orders Placed</th>
                    <th>Total Spent</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-glass-hover flex items-center justify-center text-text-secondary shrink-0 font-bold">
                            {c.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-sm">{c.name}</span>
                            <span className="text-[10px] text-text-muted">📞 {c.phone} {c.email && `| ✉️ ${c.email}`}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {c.city ? (
                          <span className="flex items-center gap-1 text-xs text-text-secondary">
                            <MapPin className="w-3.5 h-3.5" /> {c.city}
                          </span>
                        ) : "N/A"}
                      </td>
                      <td className="font-bold text-primary-light">
                        ₹{parseFloat(c.wallet?.balance || 0).toLocaleString()}
                      </td>
                      <td>{c.totalOrders}</td>
                      <td className="font-bold text-success">
                        ₹{parseFloat(c.totalSpent || 0).toLocaleString()}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => navigate(`/customers/${c.id}`)}
                          className="btn-ghost py-1 px-2.5 text-xs flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View File
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

        {/* Quick Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-card p-6 flex flex-col gap-5 relative animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-primary-light" /> Register Customer
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-glass-hover text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              <div className="h-px bg-glass-border" />

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                  <label className="label">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ananya Patel"
                    className={`input ${errors.name ? "input-error" : ""}`}
                    disabled={createMutation.isPending}
                    {...register("name")}
                  />
                  {errors.name && (
                    <span className="text-[11px] text-danger font-medium mt-0.5">{errors.name.message}</span>
                  )}
                </div>

                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9812345001"
                    className={`input ${errors.phone ? "input-error" : ""}`}
                    disabled={createMutation.isPending}
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <span className="text-[11px] text-danger font-medium mt-0.5">{errors.phone.message}</span>
                  )}
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. name@email.com"
                    className={`input ${errors.email ? "input-error" : ""}`}
                    disabled={createMutation.isPending}
                    {...register("email")}
                  />
                  {errors.email && (
                    <span className="text-[11px] text-danger font-medium mt-0.5">{errors.email.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      className="input"
                      disabled={createMutation.isPending}
                      {...register("city")}
                    />
                  </div>
                  <div>
                    <label className="label">Address Details</label>
                    <input
                      type="text"
                      placeholder="Street address..."
                      className="input"
                      disabled={createMutation.isPending}
                      {...register("address")}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary py-2 px-4 text-xs cursor-pointer"
                    disabled={createMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer shadow-glow"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Registering...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Save Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
