/**
 * Cakes & Crunches — Premium Landing Page
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Cake, ShieldCheck, Zap, BarChart3, Wallet, Clock, ArrowRight } from "lucide-react";
import PageWrapper from "../../components/shared/PageWrapper";

export default function LandingPage() {
  return (
    <PageWrapper title="Welcome to Cakes & Crunches">
      <div className="min-h-screen bg-bg-primary bg-grid relative overflow-hidden flex flex-col justify-between">
        {/* Ambient background glows */}
        <div className="ambient-blob-purple top-1/4 left-1/4" />
        <div className="ambient-blob-pink bottom-1/4 right-1/4" />

        {/* Header */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Cake className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary font-display">
              Cakes & Crunches
            </span>
          </div>

          <Link to="/login" className="btn-premium text-xs font-semibold py-2 px-5 cursor-pointer">
            Access Dashboard
          </Link>
        </header>

        {/* Hero Section */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-12 py-12 z-10">
          <div className="flex-1 text-center lg:text-left flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex self-center lg:self-start items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary-light uppercase tracking-wider"
            >
              <Zap className="w-3.5 h-3.5" /> Enterprise Order Finance
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight font-display"
            >
              Bulk Order <br className="hidden md:inline" />
              <span className="gradient-text">Advance & Balance</span> <br />
              Tracking System.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-sans"
            >
              Streamline advance collection, automate payment reminders, track outstanding balances, and audit customer wallets with our premium SaaS solution built for modern confectioneries.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center lg:justify-start gap-4 mt-2"
            >
              <Link to="/login" className="btn-premium py-3 px-8 text-sm gap-2 cursor-pointer">
                Enter Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Interactive visual - Floating Glass Cards */}
          <div className="flex-1 relative w-full max-w-md lg:max-w-none flex items-center justify-center min-h-[400px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full max-w-[340px]"
            >
              {/* Card 1: Revenue Card (Floating) */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="glass-card-glow-purple p-6 flex flex-col gap-4 absolute -top-24 -left-12 w-64 z-20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary">Gross Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center text-success">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold font-display">₹1,84,500</span>
                  <span className="text-[10px] text-success font-semibold mt-1">▲ 14.2% from last month</span>
                </div>
              </motion.div>

              {/* Card 2: Wallet Card (Floating) */}
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="glass-card-glow-pink p-6 flex flex-col gap-4 absolute -bottom-12 -right-8 w-60 z-20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary">Wallet Balance</span>
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary-light">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold font-display">₹42,300</span>
                  <span className="text-[10px] text-text-muted mt-1">Pre-funded Customer Credits</span>
                </div>
              </motion.div>

              {/* Card 3: Main Order Status Card */}
              <div className="glass-card-static p-6 flex flex-col gap-5 w-full border border-glass-border shadow-float z-10 relative">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center text-warning">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary">Order ORD-2026-9A1C</span>
                    <span className="text-[10px] text-text-muted">Ananya Patel — Wedding Event</span>
                  </div>
                </div>

                <div className="h-px bg-glass-border" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary font-medium">Grand Total</span>
                    <span className="text-lg font-bold">₹45,000</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary font-medium">Payment Status</span>
                    <span className="badge badge-warning self-start mt-0.5">Partial</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] text-text-secondary">
                    <span>Advance Collected (₹15,000)</span>
                    <span>33%</span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: "33%" }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>Due Date: July 12, 2026</span>
                  <span className="text-danger font-semibold">Reminders Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-glass-border flex flex-col sm:flex-row items-center justify-between gap-4 z-10 text-xs text-text-muted">
          <span>&copy; 2026 Cakes and Crunches. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-success" /> Secure 256-bit SSL</span>
            <Link to="/login" className="hover:text-text-primary transition-colors">Staff Login</Link>
          </div>
        </footer>
      </div>
    </PageWrapper>
  );
}
