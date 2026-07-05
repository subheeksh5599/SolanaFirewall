import { useRef } from "react";
import { motion, useInView as useInViewFM } from "framer-motion";
import { icons } from "./assets";
import { CountNumber } from "./shared";

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewFM(ref, { once: true, margin: "-100px" });

  const cursorKeyframes = {
    opacity: [0, 1, 1, 1, 1],
    x: [100, -125, 35, 115, 115],
    y: [100, -10, -10, 40, 40],
  };
  const cursorTransition = {
    duration: 2.6,
    delay: 0.9,
    times: [0, 0.25, 0.6, 0.85, 1],
    ease: "easeInOut" as const,
  };

  return (
    <section ref={ref} className="bg-black py-24">
      <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-12">
        <motion.div
          className="flex flex-col items-center text-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0 }}
        >
          <span className="text-6xl text-neutral-100">
            <CountNumber to={47} start={inView} />%
          </span>
          <p className="text-2xl text-neutral-100 opacity-40 max-w-[250px]">
            of AI agent exploits blocked by on-chain firewalls
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center text-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <span className="text-6xl text-neutral-100">
            <CountNumber to={63} start={inView} />%
          </span>
          <p className="text-2xl text-neutral-100 opacity-40 max-w-[340px]">
            of top AI startups adopt x402 secure payment standards
          </p>
        </motion.div>

        <motion.div
          className="relative bg-neutral-900 rounded-3xl p-10 w-full max-w-[570px] overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
        >
          <p className="text-4xl text-white leading-snug">
            We secure{" "}
            <span className="relative inline-block align-baseline px-2 py-1">
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-white rounded-sm origin-left"
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.91, delay: 1.55, ease: "linear" }}
                style={{ transformOrigin: "left center" }}
              />
              <span className="relative font-medium text-white">AI agent</span>
              <motion.span
                aria-hidden
                className="absolute inset-0 px-2 py-1 font-medium text-stone-950 whitespace-nowrap"
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={inView ? { clipPath: "inset(0 0% 0 0)" } : { clipPath: "inset(0 100% 0 0)" }}
                transition={{ duration: 0.91, delay: 1.55, ease: "linear" }}
              >
                AI agent
              </motion.span>
            </span>{" "}
            payments on Solana
          </p>
          <motion.div
            className="absolute pointer-events-none"
            style={{ top: "40%", left: "55%" }}
            initial={{ opacity: 0, x: 100, y: 100 }}
            animate={inView ? cursorKeyframes : { opacity: 0, x: 100, y: 100 }}
            transition={cursorTransition}
          >
            <img src={icons.blueArrow} alt="" width={28} height={28} />
            <span className="absolute top-[22px] left-[18px] whitespace-nowrap bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-tr-md rounded-bl-md rounded-br-md">
              Secure
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
