/**
 * Cakes & Crunches — Animated Sidebar Navigation
 */

import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Users, CreditCard, Wallet,
  BookOpen, Bell, BarChart3, FileText, Calendar, Settings,
  User, Shield, Activity, LogOut, ChevronLeft, Cake, Receipt,
  AlertTriangle
} from "lucide-react";

import { SidebarContext } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Orders", icon: ShoppingCart, path: "/orders" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Payments", icon: CreditCard, path: "/payments" },
  { label: "Wallet", icon: Wallet, path: "/wallet" },
  { label: "Ledger", icon: BookOpen, path: "/ledger" },
  { label: "Invoices", icon: Receipt, path: "/invoices" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Calendar", icon: Calendar, path: "/calendar" },
  { label: "Alerts", icon: AlertTriangle, path: "/alerts" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
];

const bottomItems = [
  { label: "Settings", icon: Settings, path: "/settings" },
  { label: "Profile", icon: User, path: "/profile" },
  { label: "Activity", icon: Activity, path: "/activity-logs" },
  { label: "Admin", icon: Shield, path: "/admin", roles: ["admin"] },
];

export default function Sidebar() {
  const { isOpen, toggle } = useContext(SidebarContext);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
      isActive
        ? "bg-primary/15 text-primary-light border border-primary/20"
        : "text-text-secondary hover:text-text-primary hover:bg-glass-hover"
    }`;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed md:sticky top-0 left-0 h-screen z-50 flex flex-col glass-card-static border-r border-glass-border overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ minHeight: "100vh" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-glass-border">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Cake className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="text-sm font-bold text-text-primary whitespace-nowrap">Cakes & Crunches</span>
                <span className="text-[10px] text-text-muted whitespace-nowrap">Order Management</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={toggle}
            className="ml-auto p-1.5 rounded-lg hover:bg-glass-hover text-text-muted hover:text-text-primary transition-colors hide-mobile cursor-pointer"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={linkClass} title={item.label}>
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Nav */}
        <div className="px-3 py-3 border-t border-glass-border flex flex-col gap-1">
          {bottomItems
            .filter((item) => !item.roles || item.roles.includes(user?.role?.name))
            .map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass} title={item.label}>
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
