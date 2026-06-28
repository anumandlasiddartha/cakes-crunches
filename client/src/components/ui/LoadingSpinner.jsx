/**
 * Loading Spinner — Full-screen premium loading animation
 */
import { motion } from "framer-motion";
import { Cake } from "lucide-react";

export default function LoadingSpinner({ fullScreen = false }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <div className="w-12 h-12 rounded-full border-2 border-glass-border border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Cake className="w-5 h-5 text-primary-light" />
        </div>
      </motion.div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-text-muted font-medium"
      >
        Loading...
      </motion.span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-bg-primary flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      {spinner}
    </div>
  );
}
