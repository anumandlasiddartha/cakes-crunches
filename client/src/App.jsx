/**
 * Cakes & Crunches — Root Application Component
 *
 * All routes with lazy-loaded pages and animated transitions.
 */

import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout from "./layouts/AuthLayout";
import LandingLayout from "./layouts/LandingLayout";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";

/* Lazy-loaded pages */
const LandingPage = lazy(() => import("./pages/landing/LandingPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const OrdersPage = lazy(() => import("./pages/orders/OrdersPage"));
const BulkOrderEntry = lazy(() => import("./pages/orders/BulkOrderEntry"));
const OrderDetail = lazy(() => import("./pages/orders/OrderDetail"));
const CustomersPage = lazy(() => import("./pages/customers/CustomersPage"));
const CustomerDetail = lazy(() => import("./pages/customers/CustomerDetail"));
const PaymentsPage = lazy(() => import("./pages/payments/PaymentsPage"));
const AdvanceCollectionPage = lazy(() => import("./pages/payments/AdvanceCollectionPage"));
const BalanceDuePage = lazy(() => import("./pages/payments/BalanceDuePage"));
const WalletPage = lazy(() => import("./pages/wallet/WalletPage"));
const LedgerPage = lazy(() => import("./pages/wallet/LedgerPage"));
const InvoicesPage = lazy(() => import("./pages/invoices/InvoicesPage"));
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));
const CalendarPage = lazy(() => import("./pages/calendar/CalendarPage"));
const AlertsPage = lazy(() => import("./pages/alerts/AlertsPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const ActivityLogsPage = lazy(() => import("./pages/activity/ActivityLogsPage"));
const AdminPanelPage = lazy(() => import("./pages/admin/AdminPanelPage"));

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route element={<LandingLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          {/* Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected Dashboard */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/new" element={<BulkOrderEntry />} />
              <Route path="/orders/:id" element={<OrderDetail />} />

              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />

              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/payments/advance" element={<AdvanceCollectionPage />} />
              <Route path="/payments/balance" element={<BalanceDuePage />} />

              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/ledger" element={<LedgerPage />} />

              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />

              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/activity-logs" element={<ActivityLogsPage />} />

              <Route path="/admin" element={<AdminPanelPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default App;
