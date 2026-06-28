/**
 * Dashboard Layout — Sidebar + Header + Content area
 */
import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { SidebarContext } from "../context/SidebarContext";
import Sidebar from "../components/navigation/Sidebar";
import Header from "../components/navigation/Header";

export default function DashboardLayout() {
  const { isOpen } = useContext(SidebarContext);

  return (
    <div className="min-h-screen bg-bg-primary bg-dots flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
