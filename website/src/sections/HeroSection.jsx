import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";

export default function HeroSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,#1a0d2e_0%,#0c0c0d_60%,#060608_100%)]" />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(#9945FF 1px, transparent 1px), linear-gradient(90deg, #9945FF 1px, transparent 1px)",
        backgroundSize: "64px 64px"
      }} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/[0.06] px-4 py-1.5 font-mono text-xs text-purple-400"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
          Live on Solana Devnet
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-5xl font-extrabold tracking-tight sm:text-7xl font-[family-name:var(--font-display)]"
        >
          <span className="text-white">Protect Your AI</span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Agent Payments</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400"
        >
          On-chain policy enforcement for autonomous AI agent payments.
          Spending limits, blocklists, rate limiting, and intent-based approval — enforced at the Solana runtime level.
          If your agent gets compromised, the blockchain itself blocks the drain.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <Link to="/dashboard" className="rounded-xl bg-purple-500 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-purple-400">
            Launch Dashboard
          </Link>
          <a href="https://github.com/subheeksh5599/SolanaFirewall" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/10 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-white/[0.06]">
            GitHub
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          {[
            { value: "25", label: "Instructions" },
            { value: "10", label: "Policy Checks" },
            { value: "0.5s", label: "Solana Finality" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-mono text-3xl font-bold text-purple-400">{stat.value}</div>
              <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
