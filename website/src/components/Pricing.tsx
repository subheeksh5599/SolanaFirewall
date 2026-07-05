import { motion } from "framer-motion";
import { icons } from "./assets";
import { WordsReveal } from "./shared";

const plans = [
  {
    price: "Free",
    description: "Deploy on devnet and start protecting your AI agent payments with basic policy controls.",
    features: [
      { label: "Up to 5 Firewall Deployments" },
      { label: "Standard policy checks" },
      { label: "SOL payment protection" },
      { label: "Intent Registration", dim: true },
    ],
    cta: "Deploy on Devnet",
    ctaClass: "bg-neutral-900 text-white",
  },
  {
    price: "Custom",
    description: "Production-grade deployment with advanced policy configuration and priority support.",
    features: [
      { label: "Unlimited Deployments" },
      { label: "Advanced policy engine" },
      { label: "SOL + SPL token protection" },
      { label: "Intent Registration Flow" },
    ],
    cta: "Contact Us",
    ctaClass: "bg-transparent text-stone-950 border border-stone-950/50",
  },
];

export function Pricing() {
  const item = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="bg-black p-5">
      <div className="rounded-3xl px-8 py-12 sm:px-20 sm:py-20 max-w-7xl mx-auto" style={{ backgroundColor: "#D8D0BC" }}>
        <WordsReveal
          as="h2"
          className="text-5xl lg:text-6xl text-stone-950 text-center mb-20 block"
          text="Plans and Pricing"
          step={0.1}
          duration={0.6}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {plans.map((plan) => (
            <motion.div
              key={plan.price}
              className="flex flex-col"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ staggerChildren: 0.12, delayChildren: 0.2 }}
            >
              <motion.div className="flex items-baseline gap-3" variants={item} transition={{ duration: 0.55, ease: "easeOut" }}>
                <span className="text-4xl font-medium text-stone-950">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-2xl text-stone-950/50">/ Per Month</span>}
              </motion.div>
              <motion.p className="text-2xl text-stone-950 mt-6" variants={item} transition={{ duration: 0.55, ease: "easeOut" }}>
                {plan.description}
              </motion.p>
              <motion.div className="border-t border-black/10 my-8" variants={item} transition={{ duration: 0.5, ease: "easeOut" }} />
              <div className="flex flex-col gap-6">
                {plan.features.map((f) => (
                  <motion.div key={f.label} className="flex items-center gap-5" variants={item} transition={{ duration: 0.55, ease: "easeOut" }}>
                    <div className={`size-6 bg-stone-950 rounded-full flex justify-center items-center shrink-0 ${f.dim ? "opacity-20" : ""}`}>
                      <img src={icons.checkMark} alt="" width={20} height={20} />
                    </div>
                    <span className="text-lg text-stone-950">{f.label}</span>
                  </motion.div>
                ))}
              </div>
              <motion.button
                className={`w-full py-4 rounded-xl font-medium mt-10 ${plan.ctaClass}`}
                variants={item}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-24 border-t border-black/10 pt-12 flex flex-wrap justify-center items-center gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ staggerChildren: 0.15, delayChildren: 0.1 }}
        >
          {[
            <span key="t" className="text-3xl font-medium text-stone-950">Powered by</span>,
            <div key="bar" className="w-64 h-3 bg-stone-400/40 rounded-full relative overflow-hidden">
              <div className="w-16 h-full bg-stone-950 rounded-full" />
            </div>,
            <div key="logos" className="px-6 py-2 bg-stone-200/60 rounded-xl flex gap-10 items-center">
              <img src={icons.figma} alt="Solana" className="h-8 w-auto" />
              <img src={icons.logo2} alt="Anchor" className="h-8 w-auto" />
              <img src={icons.logo3} alt="Rust" className="h-8 w-auto" />
            </div>,
          ].map((child, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              {child}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
