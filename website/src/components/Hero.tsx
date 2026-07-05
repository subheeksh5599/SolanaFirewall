import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "./Header";
import { assets, icons } from "./assets";
import { StaggeredWords, CountUpInView, CountNumber, WordsReveal, TypingInput } from "./shared";

export function Hero() {
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 2100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative">
      <Header />

      <div className="relative mt-[10px] mx-[20px] rounded-2xl overflow-hidden anim-rise" style={{ backgroundColor: "#0F0D0F", animationDelay: "0ms" }}>
        <div className="relative">
          {/* Top bar */}
          <div className="flex items-center px-6 py-4">
            <div className="flex-1 flex items-center">
              <img src={icons.macDot} alt="" width={60} height={12} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 bg-emerald-400/10 rounded-full px-3 py-1 anim-rise" style={{ animationDelay: "1140ms" }}>● Active</span>
              <span className="text-xs text-neutral-400 bg-white/5 rounded-full px-3 py-1 anim-rise" style={{ animationDelay: "1200ms" }}>Devnet</span>
              <span className="text-xs text-neutral-400 bg-white/5 rounded-full px-3 py-1 anim-rise" style={{ animationDelay: "1260ms" }}>v0.1.0</span>
              <span className="text-xs text-neutral-400 bg-white/5 rounded-full px-3 py-1 anim-rise" style={{ animationDelay: "1320ms" }}>56hwxWZ...</span>
            </div>
            <div className="flex-1" />
          </div>

          {/* Hero content */}
          <div className="relative overflow-hidden mx-4 mb-0 border border-white/10 rounded-2xl flex flex-col items-center text-center pt-[64px] px-6 pb-0">
            <img src={assets.bg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover z-0" />
            <div className="absolute inset-0 bg-black/80 z-0" />
            <h1 className="relative z-10 text-[34px] leading-[38px] sm:text-7xl sm:leading-[72px] font-medium text-neutral-100 max-w-5xl tracking-tight mb-[24px] sm:mb-[32px] word-stagger">
              <StaggeredWords text="On-chain payment security for autonomous AI agents." baseDelay={300} step={54} />
            </h1>
            <p className="relative z-10 text-base sm:text-2xl opacity-60 text-neutral-100 w-[634px] max-w-full leading-snug mb-[24px] sm:mb-[30px] word-stagger">
              <StaggeredWords text="x402 Firewall — enforce spending limits, block unauthorized recipients, and protect your Solana wallets from AI agent compromise." baseDelay={900} step={33} />
            </p>
            <div className="relative z-10 w-[572px] max-w-full h-12 mb-[25px]">
              <div className="absolute inset-0 bg-neutral-900 outline outline-[1.30px] outline-white/10 rounded-xl flex items-center px-4 gap-3 anim-reveal-right" style={{ animationDelay: "1620ms", clipPath: "inset(0 100% 0 0)" }}>
                <div className="w-5 shrink-0" />
                <TypingInput placeholder="Set max payment: 10 SOL, enable whitelist..." startDelay={2040} speed={70} />
                <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg h-8 px-4 transition-colors">
                  Secure
                </button>
              </div>
              <img src={icons.search} alt="" width={20} height={20} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 anim-pop" style={{ animationDelay: "1500ms" }} />
            </div>

            {/* Dashboard preview */}
            <div
              className="w-full max-w-[1124px] h-[465px] mx-auto bg-black rounded-[20px] outline outline-[1.4px] outline-neutral-100/10 flex overflow-hidden relative z-10 anim-rise"
              style={{ animationDelay: "2100ms" }}
            >
              {/* Left sidebar */}
              <aside className="w-56 shrink-0 h-full relative bg-black">
                <motion.div
                  className="flex items-center gap-5 px-4 py-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.36, delay: 0.06, ease: "easeOut" }}
                >
                  <span className="text-sm font-medium text-neutral-100">Policies</span>
                  <span className="text-sm font-medium text-neutral-100 opacity-30">History</span>
                </motion.div>
                <div className="flex flex-col gap-4 p-4 w-[calc(100%+1rem)] -ml-4 pl-8 border-t border-white/10">
                  {[
                    <img key="d1" src={assets.dash01} alt="Max Payment" className="h-[34px] w-auto object-contain object-left ml-2" />,
                    <img key="d2" src={assets.dash02} alt="Daily Limits" className="h-[34px] w-auto object-contain object-left ml-2" />,
                    <div key="tools" className="flex items-center gap-3 h-9 px-2 text-neutral-300 text-sm">
                      <span className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m14.7 6.3 3 3"/><path d="M3 21v-3l11-11 3 3L6 21z"/></svg>
                      </span>
                      Blacklist
                    </div>,
                    <div key="cards" className="flex items-center gap-3 h-[46px] px-1 rounded-lg bg-white/[0.08] outline outline-1 outline-white/5">
                      <span className="w-9 h-9 ml-1 rounded-lg bg-blue-500 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                      </span>
                      <span className="text-sm text-neutral-100">Rate Limits</span>
                    </div>,
                    <div key="add" className="flex items-center gap-3 h-9 px-2 text-neutral-300 text-sm">
                      <span className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                      </span>
                      Add policy
                    </div>,
                  ].map((node, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ duration: 0.72, delay: 0.12 + i * 0.2, ease: "easeOut" }}
                    >
                      {node}
                    </motion.div>
                  ))}
                </div>
              </aside>

              {/* Right grid */}
              <div className="flex-1 p-5 flex flex-wrap gap-x-4 gap-y-5 content-start">
                {/* Card 1 - Beige */}
                <motion.div
                  className="w-96 h-60 relative bg-[#D0C9B9] rounded-2xl overflow-hidden p-5 flex flex-col text-[#131113]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.36, delay: 0.18, ease: "easeOut" }}
                >
                  <div className="flex justify-between relative z-10">
                    <div className="flex flex-col">
                      <span className="text-xs opacity-40 -ml-[20px] block">Transaction volume</span>
                      <span className="text-2xl font-medium mt-1 block">17 Protected</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs opacity-40 block">Block rate</span>
                      <span className="text-2xl font-medium mt-1">
                        <CountNumber to={93} duration={1200} delay={780} active={heroReady} />%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between w-full mt-3 relative z-10">
                    <span className="text-xs text-stone-950">Solana</span>
                    <span className="text-xs opacity-40">Devnet</span>
                  </div>
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none"
                    initial={{ clipPath: "inset(0 100% 0 0)" }}
                    animate={heroReady ? { clipPath: "inset(0 0% 0 0)" } : { clipPath: "inset(0 100% 0 0)" }}
                    transition={{ duration: 0.72, delay: 0.48, ease: "easeInOut" }}
                  >
                    <img src={assets.dashLine} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.015] origin-center pointer-events-none" />
                  </motion.div>
                </motion.div>

                {/* Card 2 - Pink */}
                <motion.div
                  className="w-36 h-60 relative rounded-2xl overflow-hidden flex flex-col justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.36, delay: 0.24, ease: "easeOut" }}
                >
                  <img src={assets.dashCard3Pink} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-3xl font-medium text-neutral-900">
                      <CountNumber to={8000} duration={1200} delay={360} active={heroReady} />
                    </span>
                    <motion.span
                      className="text-sm text-neutral-900/60 mt-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      transition={{ duration: 0.3, delay: 0.42, ease: "easeOut" }}
                    >
                      Transactions
                    </motion.span>
                  </div>
                </motion.div>

                {/* Card 3 */}
                <motion.div
                  className="w-72 h-60 rounded-2xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.36, delay: 0.3, ease: "easeOut" }}
                >
                  <img src={assets.dashCard3} alt="" className="w-full h-full object-cover" />
                </motion.div>

                {/* Card 4 */}
                <motion.div
                  className="w-72 h-60 rounded-2xl overflow-hidden -mt-[56px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.36, delay: 0.36, ease: "easeOut" }}
                >
                  <img src={assets.dashCard4} alt="" className="w-full h-full object-contain object-center" />
                </motion.div>

                {/* Card 5 */}
                <motion.div
                  className="w-[555px] h-60 rounded-2xl overflow-hidden -mt-[56px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.36, delay: 0.42, ease: "easeOut" }}
                >
                  <img src={assets.dashCard5} alt="" className="w-full h-full object-contain object-center" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-50" />
    </div>
  );
}
