"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const lines = [
  { num: "01", text: "Build it." },
  { num: "02", text: "Ship it." },
  { num: "03", text: "Find someone to sell it." },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Dark radial vignette centered on the hero text so the copy stays
          legible over whatever frame of the canvas explosion is showing. */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at center, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0) 75%)",
          }}
        />
      </div>
      {/* Subtle warm glow on top of the vignette */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(180,140,60,0.08),transparent_70%)] rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-6 w-full">
        <div className="flex flex-col items-center text-center">
          <motion.h1
            className="font-heading font-light text-display text-foreground"
            style={{
              textShadow:
                "0 0 40px rgba(0,0,0,0.9), 0 4px 18px rgba(0,0,0,0.75)",
            }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {lines.map((line, i) => (
              <motion.span
                key={i}
                className="block"
                variants={{
                  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                <span className="text-muted text-[0.3em] align-super mr-2 font-body tracking-wider">
                  {line.num}
                </span>
                {line.text}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="font-body font-light text-body text-muted max-w-[560px] mt-8 leading-relaxed"
            style={{
              textShadow: "0 0 24px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.7)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Vibr turns your skills into a product, a prompt, and finds a marketer
            who will grow it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            <Link
              href="/onboarding"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 font-body text-sm tracking-wide text-background bg-foreground rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(242,239,233,0.15)]"
            >
              <span className="relative z-10">Start building</span>
              <span className="relative z-10">&rarr;</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
