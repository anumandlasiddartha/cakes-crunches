/**
 * BulkOrderEntry — Premium multi-section order entry form
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Cake, Plus, Trash2, ArrowLeft, Loader2, Save,
  Search, User, ShoppingBag, Calendar, CreditCard, Notebook
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import toast from "react-hot-toast";

const orderSchema = z.object({
  customerId: z.number({ required_error: "Please select a customer." }).int().positive(),
  eventType: z.string().min(1, "Event type is required."),
  eventDate: z.string().min(1, "Event date is required."),
  eventVenue: z.string().optional(),
  deliveryAddress: z.string().optional(),
  priority: z.string().default("normal"),
  discountAmount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  paymentDueDate: z.string().min(1, "Payment due date is required."),
  items: z.array(z.object({
    itemName: z.string().min(1, "Item name is required."),
    quantity: z.number().int().min(1, "Quantity must be at least 1."),
    unitPrice: z.number().nonnegative("Unit price cannot be negative."),
    weight: z.string().optional(),
    flavor: z.string().optional(),
    customization: z.string().optional(),
    notes: z.string().optional(),
  })).min(1, "Add at least one item."),
});

export default function BulkOrderEntry() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form setup
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      priority: "normal",
      discountAmount: 0,
      taxAmount: 0,
      items: [{ itemName: "", quantity: 1, unitPrice: 0, weight: "", flavor: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Watch fields for calculations
  const items = watch("items") || [];
  const discountAmount = watch("discountAmount") || 0;
  const taxAmount = watch("taxAmount") || 0;

  // Real-time calculation
  const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  const grandTotal = Math.max(0, subtotal - parseFloat(discountAmount) + parseFloat(taxAmount));

  // Fetch customers for selection
  const { data: customerData } = useQuery({
    queryKey: ["customersSearch", customerSearch],
    queryFn: async () => {
      if (!customerSearch) return [];
      const res = await apiClient.get("/customers", { params: { search: customerSearch, limit: 10 } });
      return res.data.data;
    },
    enabled: customerSearch.length > 1,
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await apiClient.post("/orders", data);
      if (res.data.success) {
        toast.success("Bulk order recorded successfully!");
        navigate(`/orders/${res.data.data.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper title="New Bulk Order">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="btn-secondary p-2.5 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Record Bulk Order</h1>
            <p className="text-xs text-text-secondary">Initiate a new bulk order & advance collection schedule.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Section 1: Customer Details */}
          <div className="glass-card-static p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary-light font-bold text-sm">
              <User className="w-4.5 h-4.5" /> Customer Details
            </div>
            <div className="h-px bg-glass-border" />

            {selectedCustomer ? (
              <div className="flex justify-between items-center p-4 bg-bg-secondary/40 border border-glass-border rounded-xl">
                <div className="flex flex-col">
                  <span className="font-bold text-text-primary">{selectedCustomer.name}</span>
                  <span className="text-xs text-text-secondary">📞 {selectedCustomer.phone} | ✉️ {selectedCustomer.email || "N/A"}</span>
                  <span className="text-xs text-text-muted">📍 {selectedCustomer.city || "N/A"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedCustomer(null); setValue("customerId", undefined); }}
                  className="btn-secondary py-1.5 px-3 text-xs text-danger border-danger/20 hover:bg-danger/5 cursor-pointer"
                >
                  Change Customer
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="label">Search Customer</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search by name, phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="input pl-10.5"
                  />
                </div>
                {customerData && customerData.length > 0 && (
                  <div className="glass-card-static mt-1 border border-glass-border divide-y divide-glass-border overflow-hidden">
                    {customerData.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setValue("customerId", c.id);
                          setCustomerSearch("");
                        }}
                        className="p-3 hover:bg-glass-hover cursor-pointer transition-colors text-xs flex justify-between items-center"
                      >
                        <span className="font-semibold text-text-primary">{c.name} ({c.phone})</span>
                        <span className="text-text-muted">{c.city || "N/A"}</span>
                      </div>
                    ))}
                  </div>
                )}
                {errors.customerId && (
                  <span className="text-[11px] text-danger font-medium mt-0.5">{errors.customerId.message}</span>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Items Details */}
          <div className="glass-card-static p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary-light font-bold text-sm">
                <ShoppingBag className="w-4.5 h-4.5" /> Order Items
              </div>
              <button
                type="button"
                onClick={() => append({ itemName: "", quantity: 1, unitPrice: 0, weight: "", flavor: "" })}
                className="btn-secondary py-1.5 px-3 text-xs gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="h-px bg-glass-border" />

            <div className="flex flex-col gap-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-bg-secondary/20 border border-glass-border rounded-xl relative">
                  <div className="md:col-span-4 flex flex-col gap-1">
                    <label className="label">Item Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Wedding Cake"
                      className="input py-2"
                      {...register(`items.${idx}.itemName`)}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="label">Qty *</label>
                    <input
                      type="number"
                      placeholder="1"
                      className="input py-2"
                      {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="label">Price (₹) *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input py-2"
                      {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="label">Flavor / Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 kg / Velvet"
                      className="input py-2"
                      {...register(`items.${idx}.flavor`)}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end justify-end">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="btn-danger p-2 rounded-lg cursor-pointer h-10 w-10 flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Event & Schedule Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card-static p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-primary-light font-bold text-sm">
                <Calendar className="w-4.5 h-4.5" /> Event & Logistics
              </div>
              <div className="h-px bg-glass-border" />

              <div className="flex flex-col gap-3">
                <div>
                  <label className="label">Event Type *</label>
                  <input
                    type="text"
                    placeholder="e.g. Wedding, Anniversary"
                    className="input"
                    {...register("eventType")}
                  />
                  {errors.eventType && (
                    <span className="text-[11px] text-danger font-medium mt-0.5">{errors.eventType.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Event Date *</label>
                    <input
                      type="date"
                      className="input cursor-pointer"
                      {...register("eventDate")}
                    />
                    {errors.eventDate && (
                      <span className="text-[11px] text-danger font-medium mt-0.5">{errors.eventDate.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select className="input cursor-pointer" {...register("priority")}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Event Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Plaza Hall"
                    className="input"
                    {...register("eventVenue")}
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary section */}
            <div className="glass-card-static p-6 flex flex-col gap-4 justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-primary-light font-bold text-sm">
                  <CreditCard className="w-4.5 h-4.5" /> Financial Calculations
                </div>
                <div className="h-px bg-glass-border" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Discount (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input"
                      {...register("discountAmount", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="label">Tax (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input"
                      {...register("taxAmount", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Payment Due Date *</label>
                  <input
                    type="date"
                    className="input cursor-pointer"
                    {...register("paymentDueDate")}
                  />
                  {errors.paymentDueDate && (
                    <span className="text-[11px] text-danger font-medium mt-0.5">{errors.paymentDueDate.message}</span>
                  )}
                </div>
              </div>

              {/* Calculations Footer */}
              <div className="flex flex-col gap-2 p-4 bg-bg-secondary/40 border border-glass-border rounded-xl mt-4">
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Discount:</span>
                  <span className="text-danger">- ₹{discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Tax Amount:</span>
                  <span>+ ₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="h-px bg-glass-border my-1" />
                <div className="flex justify-between text-sm font-extrabold text-text-primary">
                  <span>Grand Total:</span>
                  <span className="text-primary-light">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="glass-card-static p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary-light font-bold text-sm">
              <Notebook className="w-4.5 h-4.5" /> Notes & Instructions
            </div>
            <div className="h-px bg-glass-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Customer Specifications</label>
                <textarea
                  placeholder="Design details, messages on cake..."
                  rows="3"
                  className="input"
                  {...register("notes")}
                />
              </div>
              <div>
                <label className="label">Internal Notes (Private)</label>
                <textarea
                  placeholder="Production scheduling, specific chef notes..."
                  rows="3"
                  className="input"
                  {...register("internalNotes")}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="btn-secondary py-3 px-6 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-3 px-8 text-sm font-bold flex items-center gap-2 cursor-pointer shadow-glow"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" /> Saving Order...
                </>
              ) : (
                <>
                  <Save className="w-4.5 h-4.5" /> Record Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
