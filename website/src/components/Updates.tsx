import { motion } from "framer-motion";
import { assets, icons } from "./assets";
import { WordsReveal } from "./shared";

export function Updates() {
  return (
    <section className="bg-black">
      <div className="max-w-7xl mx-auto px-5 py-24 flex flex-col gap-16 relative">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="flex flex-col gap-8 max-w-2xl">
            <WordsReveal
              as="h2"
              className="text-5xl lg:text-6xl text-neutral-100 leading-tight block"
              text="x402 Firewall updates and releases"
              step={0.08}
              duration={0.6}
            />
            <WordsReveal
              as="p"
              className="text-xl lg:text-2xl opacity-60 text-neutral-100 leading-8 block"
              text="With its latest release, x402 Firewall pushes the boundaries of on-chain payment security even further, offering an array of new policy features and enhanced protection for your AI agents."
              step={0.04}
              delay={0.3}
              duration={0.5}
            />
          </div>
          <motion.a
            href="https://github.com/subheeksh5599/SolanaFirewall"
            target="_blank"
            rel="noopener"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="inline-flex shrink-0 bg-white text-black px-7 py-4 rounded-xl font-medium text-lg hover:bg-neutral-200 transition-colors"
          >
            View changelog
          </motion.a>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 relative">
          <motion.div
            className="w-full lg:w-[35%] shrink-0"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="rounded-3xl overflow-hidden bg-neutral-900">
              <img src={assets.card} alt="" className="w-full h-auto block" />
            </div>
          </motion.div>

          <div className="w-full lg:w-[65%] flex flex-col relative pb-20">
            <div className="flex justify-between items-center mb-6">
              <WordsReveal as="h3" className="text-4xl text-neutral-100 block" text="Latest Release" step={0.1} duration={0.6} />
              <img src={icons.whiteArrowUpRight} alt="" width={28} height={28} />
            </div>
            <WordsReveal
              as="p"
              className="text-xl lg:text-2xl text-neutral-100 opacity-60 leading-8 mb-6 block"
              text="Revolutionize your AI agent security with our latest Anchor program update! Introducing a full intent registration and approval flow that adds an extra layer of protection for autonomous payments."
              step={0.03}
              delay={0.2}
              duration={0.5}
            />
            <WordsReveal
              as="p"
              className="text-xl lg:text-2xl text-neutral-100 opacity-60 leading-8 mb-6 block"
              text="Packed with 20 instruction handlers, 7 account types, 10 policy checks, and 19 custom error codes — this release marks a significant milestone in on-chain payment security for Solana."
              step={0.03}
              delay={0.4}
              duration={0.5}
            />
            <WordsReveal
              as="p"
              className="text-xl lg:text-2xl text-neutral-100 opacity-40 leading-8 block"
              text="Experience enhanced policy enforcement, sender blocklists, recipient blacklists, whitelist mode, per-pair sender-recipient rules, daily spending trackers, rate limiting, emergency pause, authorized agent management, SPL token support, and comprehensive audit trail events — all enforced at the Solana runtime level!"
              step={0.025}
              delay={0.6}
              duration={0.5}
            />
            <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
