"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function Closing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-background/70 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(180,140,60,0.06),transparent_70%)] blur-3xl" />
      </div>

      <div ref={ref} className="text-center px-6">
        <motion.h2
          className="font-heading font-light text-display text-foreground"
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Your next product
          <br />
          <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/40 bg-clip-text text-transparent">
            is waiting.
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <Link
            href="/onboarding"
            className="group relative inline-flex items-center gap-2 px-10 py-4 font-body text-sm tracking-wide text-background bg-foreground rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(242,239,233,0.15)]"
          >
            <span className="relative z-10">Start building</span>
            <span className="relative z-10">&rarr;</span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
