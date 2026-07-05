import { motion } from "framer-motion";
import { icons } from "./assets";
import { WordsReveal } from "./shared";

export function Footer() {
  return (
    <motion.footer
      className="bg-black border-t-2 border-neutral-100/20"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      <div className="max-w-7xl mx-auto px-2 py-16 flex flex-col gap-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-4 flex items-center gap-4">
            <motion.img
              src={icons.logo}
              alt="x402 Firewall"
              className="size-12"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <span className="text-3xl font-medium text-neutral-100">
              {"x402 Firewall".split("").map((ch, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.06, ease: "easeOut" }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          </div>
          <motion.nav
            className="md:col-span-4 flex flex-col gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ staggerChildren: 0.12, delayChildren: 0.9 }}
          >
            {["Docs", "GitHub", "npm Package", "Contact"].map((l) => (
              <motion.a
                key={l}
                className="text-base font-medium text-neutral-100 cursor-pointer hover:opacity-70 transition-opacity"
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {l}
              </motion.a>
            ))}
          </motion.nav>
          <motion.nav
            className="md:col-span-4 flex flex-col gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ staggerChildren: 0.12, delayChildren: 1.5 }}
          >
            {["Twitter/X", "LinkedIn", "Discord"].map((l) => (
              <motion.a
                key={l}
                className="text-base font-medium text-neutral-100 cursor-pointer hover:opacity-70 transition-opacity"
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {l}
              </motion.a>
            ))}
          </motion.nav>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-4">
            <motion.p
              className="text-sm font-medium text-neutral-100"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 2.0, ease: "easeOut" }}
            >
              x402 Firewall — 2025
            </motion.p>
          </div>
          <div className="md:col-span-8">
            <p className="text-sm font-normal text-neutral-100 opacity-70 leading-5 max-w-[866px]">
              <WordsReveal
                text={'The x402 Payment Firewall is committed to protecting your AI agents and their funds on Solana. All policy enforcement happens on-chain — no trusted third parties, no off-chain validation that can be bypassed. Your payment policies are enforced by the Solana runtime itself. The Anchor program is open source under MIT license. Deploy on devnet or mainnet-beta with full confidence. For more details on security, audit reports, and integration guides, please refer to our documentation.'}
                step={0.02}
                delay={2.3}
                duration={0.4}
              />
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
