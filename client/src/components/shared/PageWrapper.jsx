/**
 * Page Wrapper — Framer Motion page transition wrapper
 */
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function PageWrapper({ title, children }) {
  return (
    <>
      {title && (
        <Helmet>
          <title>{title} — Cakes & Crunches</title>
        </Helmet>
      )}
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </>
  );
}
