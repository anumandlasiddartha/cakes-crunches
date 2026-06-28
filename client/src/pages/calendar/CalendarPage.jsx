/**
 * CalendarPage — Interactive calendar showing order events & payment deadlines
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import { format } from "date-fns";
import {
  Calendar as CalIcon, Clock, Scale, Coins, ChevronRight, Eye
} from "lucide-react";
import apiClient from "../../api/client";
import PageWrapper from "../../components/shared/PageWrapper";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import "react-calendar/dist/Calendar.css";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch active orders (with eventDate or paymentDueDate)
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["ordersCalendar"],
    queryFn: async () => {
      const res = await apiClient.get("/orders", { params: { limit: 100 } });
      return res.data.data;
    },
  });

  const orders = ordersData || [];

  // Filter orders related to the currently clicked date
  const filteredOrders = orders.filter((o) => {
    if (!o.eventDate && !o.paymentDueDate) return false;
    const clickDateStr = selectedDate.toISOString().slice(0, 10);
    const eventDateStr = o.eventDate ? new Date(o.eventDate).toISOString().slice(0, 10) : "";
    const dueDateStr = o.paymentDueDate ? new Date(o.paymentDueDate).toISOString().slice(0, 10) : "";
    return clickDateStr === eventDateStr || clickDateStr === dueDateStr;
  });

  // Function to place markers on dates with orders or due dates
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;

    const dateStr = date.toISOString().slice(0, 10);
    const hasEvent = orders.some((o) => o.eventDate && new Date(o.eventDate).toISOString().slice(0, 10) === dateStr);
    const hasDue = orders.some((o) => o.paymentDueDate && new Date(o.paymentDueDate).toISOString().slice(0, 10) === dateStr);

    if (!hasEvent && !hasDue) return null;

    return (
      <div className="flex justify-center gap-1 mt-1">
        {hasEvent && <div className="w-1.5 h-1.5 rounded-full bg-primary-light" title="Event Scheduled" />}
        {hasDue && <div className="w-1.5 h-1.5 rounded-full bg-danger" title="Payment Due" />}
      </div>
    );
  };

  return (
    <PageWrapper title="Calendar">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-enter">
        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Operational Calendar</h1>
          <p className="text-xs text-text-secondary">Review confectionery preparation slots and payment due dates.</p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Calendar widget */}
            <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-center items-center">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileContent={tileContent}
                className="w-full border-0 bg-transparent font-sans"
              />
            </div>

            {/* Sidebar list of scheduled items */}
            <div className="glass-card p-6 flex flex-col gap-5 min-h-[380px]">
              <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
                <CalIcon className="w-4.5 h-4.5 text-primary-light" />
                <span>Events for {format(selectedDate, "MMM dd, yyyy")}</span>
              </div>
              <div className="h-px bg-glass-border" />

              <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[320px] pr-1">
                {filteredOrders.map((o) => {
                  const isEventToday = o.eventDate && new Date(o.eventDate).toISOString().slice(0, 10) === selectedDate.toISOString().slice(0, 10);
                  const isDueToday = o.paymentDueDate && new Date(o.paymentDueDate).toISOString().slice(0, 10) === selectedDate.toISOString().slice(0, 10);

                  return (
                    <div
                      key={o.id}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="p-3 bg-bg-secondary/40 border border-glass-border rounded-xl flex items-center justify-between hover:border-primary-light/45 transition-colors cursor-pointer group"
                    >
                      <div className="flex flex-col gap-1.5 text-xs">
                        <span className="font-bold text-text-primary group-hover:text-primary-light transition-colors">
                          {o.orderNumber}
                        </span>
                        <span className="text-text-secondary">{o.customer?.name} — {o.eventType}</span>
                        <div className="flex items-center gap-2">
                          {isEventToday && (
                            <span className="badge badge-primary flex items-center gap-0.5 text-[9px]">
                              <Clock className="w-2.5 h-2.5" /> Event Day
                            </span>
                          )}
                          {isDueToday && (
                            <span className="badge badge-danger flex items-center gap-0.5 text-[9px]">
                              <Scale className="w-2.5 h-2.5" /> Balance Due
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary-light group-hover:translate-x-0.5 transition-all" />
                    </div>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <div className="text-center text-xs text-text-muted py-16 flex flex-col gap-2 justify-center items-center">
                    <CalIcon className="w-8 h-8 text-text-muted opacity-40" />
                    No operational schedules logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
