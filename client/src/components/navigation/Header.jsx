/**
 * Header — Top navigation bar with search, notifications, and user menu
 */

import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, Moon, Sun, Menu, Plus, User,
  LogOut, Settings, ChevronDown
} from "lucide-react";

import { SidebarContext } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Header() {
  const { toggle } = useContext(SidebarContext);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 glass-card-static border-b border-glass-border px-4 md:px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button onClick={toggle} className="md:hidden p-2 rounded-lg hover:bg-glass-hover cursor-pointer">
          <Menu className="w-5 h-5 text-text-secondary" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Add */}
          <button
            onClick={() => navigate("/orders/new")}
            className="btn-primary py-2 px-3 text-xs gap-1.5 cursor-pointer hidden sm:flex"
          >
            <Plus className="w-4 h-4" /> New Order
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-glass-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate("/notifications")}
            className="p-2.5 rounded-xl hover:bg-glass-hover text-text-secondary hover:text-text-primary transition-colors relative cursor-pointer"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-glass-hover transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-text-primary">{user?.firstName} {user?.lastName}</span>
                <span className="text-[10px] text-text-muted capitalize">{user?.role?.name || "Staff"}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden md:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 glass-card-static border border-glass-border p-2 z-50"
                  >
                    <button
                      onClick={() => { navigate("/profile"); setShowUserMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-glass-hover transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button
                      onClick={() => { navigate("/settings"); setShowUserMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-glass-hover transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <div className="h-px bg-glass-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
