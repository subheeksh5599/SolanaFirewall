import { motion } from "framer-motion";
import { assets, icons } from "./assets";
import { WordsReveal, ToolIcon, Typewriter } from "./shared";

export function MadForDev() {
  return (
    <section className="bg-black">
      <div className="max-w-7xl mx-auto px-5 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="flex flex-col gap-8">
          <WordsReveal
            as="h2"
            className="text-5xl lg:text-6xl leading-tight text-white"
            text="Built for developers by security engineers"
            step={0.08}
            duration={0.6}
          />
          <WordsReveal
            as="p"
            className="text-2xl opacity-60 text-neutral-100 max-w-[500px]"
            text="Anchor provides all you need to build, deploy and launch secure payment infrastructure for AI agents on Solana."
            step={0.05}
            delay={0.3}
            duration={0.5}
          />
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
          >
            <button className="bg-white text-black px-7 py-4 rounded-xl font-medium hover:bg-neutral-200 transition-colors">
              Read Docs
            </button>
            <button className="bg-white/10 text-white px-7 py-4 rounded-xl font-medium hover:bg-white/20 transition-colors">
              View on GitHub
            </button>
          </motion.div>
        </div>

        <motion.div
          className="rounded-3xl border border-white/10 overflow-hidden flex flex-col"
          style={{ backgroundColor: "#0F0D0F" }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          <div className="flex justify-between items-center px-5 py-4">
            <img src={icons.macDot} alt="" width={60} height={12} />
            <motion.div
              className="flex gap-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ staggerChildren: 0.15, delayChildren: 0.5 }}
            >
              {[icons.whiteCursor, icons.copy, icons.plus].map((src, i) => (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <ToolIcon src={src} />
                </motion.div>
              ))}
            </motion.div>
            <motion.button
              className="bg-white text-black text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
            >
              Export config
            </motion.button>
          </div>

          <div className="mx-[20px] mb-[20px] relative rounded-2xl overflow-hidden">
            <img src={assets.bg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/80" />
            <div className="relative p-10">
              <div className="flex justify-between items-start gap-4">
                <WordsReveal
                  as="h3"
                  className="text-5xl text-white max-w-[400px] leading-tight"
                  text="Policy and code together"
                  step={0.08}
                  delay={0.5}
                  duration={0.6}
                />
                <motion.button
                  className="size-10 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: 1.1, ease: "easeOut" }}
                >
                  <img src={icons.copy} alt="" width={16} height={16} />
                </motion.button>
              </div>
              <Typewriter
                className="mt-12 text-xl opacity-60 text-neutral-100 leading-relaxed whitespace-pre-wrap font-mono"
                delay={1.2}
                speed={18}
                text={`pub fn execute_payment(
    ctx: Context<ExecutePayment>,
    amount: u64
) -> Result<()> {
    // Policy enforced on-chain
    policy::evaluate(
        &firewall,
        &sender,
        &recipient,
        amount
    )?;
    // Transfer via CPI
    system_program::transfer(...)
}`}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
