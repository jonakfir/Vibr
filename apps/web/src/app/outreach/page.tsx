"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";
import { GhostButton } from "@/components/ui/ghost-button";

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const outreachSteps = [
  {
    num: "01",
    title: "Pick a match",
    desc: "Select a marketer or journalist from your AI-generated results.",
  },
  {
    num: "02",
    title: "AI writes the email",
    desc: "Vibr reads their recent posts and crafts a message that references their actual work.",
  },
  {
    num: "03",
    title: "Review and send",
    desc: "Edit the draft if you want, then send it straight from the app.",
  },
];

export default function OutreachPage() {
  return (
    <main className="bg-background min-h-screen">
      <Nav />

      {/* Hero */}
      <Section className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="font-heading font-light text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] text-foreground mb-6">
          Cold Emails That
          <br />
          Don&apos;t Sound Cold
        </h1>
        <p className="font-body text-base text-muted max-w-xl mx-auto leading-relaxed">
          Vibr reads your prospect&apos;s latest posts, articles, and activity,
          then writes a personalized email that references their real work. No
          templates. No &ldquo;I hope this finds you well.&rdquo;
        </p>
        <div className="mt-10">
          <GhostButton href="/login">Write your first email</GhostButton>
        </div>
      </Section>

      {/* Mockup: email preview */}
      <Section className="max-w-3xl mx-auto px-6 pb-28">
        <motion.div
          className="bg-[#111] border border-[#222] rounded-[4px] overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.08)]"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="px-6 py-3 border-b border-[#222]">
            <p className="text-xs text-muted">
              To: sarah.chen@techcrunch.com
            </p>
            <p className="text-sm text-foreground mt-1 font-medium">
              Your DevTools coverage + a new AI code review tool
            </p>
          </div>
          <div className="px-6 py-4 space-y-3">
            <p className="text-sm text-muted">Hi Sarah,</p>
            <p className="text-sm text-muted">
              I noticed your recent piece on developer productivity
              tools&nbsp;&mdash; specifically the section on AI-assisted code
              review...
            </p>
            <p className="text-sm text-muted">
              We just launched CodeReview Bot, which does exactly what you
              described as the &ldquo;missing piece&rdquo;...
            </p>
            <p className="text-sm text-muted">
              Would love 15 minutes to show you a demo. No pressure.
            </p>
            <p className="text-sm text-foreground mt-4">&mdash; Jon</p>
          </div>
        </motion.div>
      </Section>

      {/* The Outreach Flow */}
      <Section className="max-w-4xl mx-auto px-6 pb-28">
        <h2 className="font-heading font-light text-[clamp(1.8rem,3.5vw,2.8rem)] text-foreground mb-14 text-center">
          The Outreach Flow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {outreachSteps.map((s, i) => (
            <motion.div
              key={s.num}
              className="bg-[#111] border border-[#222] rounded-[4px] p-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: i * 0.15,
              }}
              whileHover={{ scale: 1.02 }}
            >
              <span className="font-heading text-5xl text-foreground/10">
                {s.num}
              </span>
              <h3 className="font-heading text-xl text-foreground mt-4 mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Why It Works — generic vs personalized */}
      <Section className="max-w-4xl mx-auto px-6 pb-28">
        <h2 className="font-heading font-light text-[clamp(1.8rem,3.5vw,2.8rem)] text-foreground mb-14 text-center">
          Why It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Generic email */}
          <motion.div
            className="bg-[#111] border border-[#222] rounded-[4px] p-6 opacity-60"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 0.6, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs text-muted uppercase tracking-wider mb-4">
              Generic template
            </p>
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Hi &#123;name&#125;,
              </p>
              <p className="text-sm text-muted">
                I wanted to reach out because I think you&apos;d be interested
                in our product. We help companies grow faster with AI. Would you
                be open to a quick call?
              </p>
              <p className="text-sm text-muted">&mdash; Sent to 500 people</p>
            </div>
          </motion.div>

          {/* Vibr email */}
          <motion.div
            className="bg-[#111] border border-[#7C3AED]/30 rounded-[4px] p-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs text-[#7C3AED] uppercase tracking-wider mb-4">
              Vibr-generated
            </p>
            <div className="space-y-3">
              <p className="text-sm text-muted">Hi Sarah,</p>
              <p className="text-sm text-muted">
                Your recent breakdown of developer productivity tools caught my
                eye&nbsp;&mdash; especially the bit about AI code review being
                the &ldquo;missing piece.&rdquo; We just shipped something that
                does exactly that...
              </p>
              <p className="text-sm text-foreground">
                &mdash; Sent to 1 person who matters
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <h2 className="font-heading font-light text-[clamp(1.8rem,3.5vw,2.8rem)] text-foreground mb-6">
          Write Emails People Actually Read
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto mb-10 leading-relaxed">
          Every email Vibr writes is built from real context. That&apos;s why
          they get replies.
        </p>
        <GhostButton href="/login">Try it now</GhostButton>
      </Section>

      {/* Explore more */}
      <Section className="max-w-4xl mx-auto px-6 pb-32">
        <div className="border-t border-[#222] pt-12">
          <p className="text-xs text-muted uppercase tracking-wider mb-6 text-center">
            Explore more
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <GhostButton href="/find-marketers">Find Marketers</GhostButton>
            <GhostButton href="/ideas">Startup Idea Generator</GhostButton>
            <GhostButton href="/local-ide">Local AI IDE</GhostButton>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}
