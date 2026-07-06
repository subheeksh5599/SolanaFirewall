import { motion } from "framer-motion";

const cards = [
  { title: "Max Payment Caps", desc: "Limit how much an agent can spend in a single transaction. If it exceeds the cap, the Solana runtime reverts." },
  { title: "Daily Spending Limits", desc: "Track cumulative spending per wallet per day. Agent hits the limit → blocked until next day." },
  { title: "Blocklists & Whitelists", desc: "Ban specific senders or recipients. Optional whitelist mode: only approved addresses can receive funds." },
  { title: "Rate Limiting", desc: "Enforce minimum intervals between payments. No rapid draining by a compromised agent." },
  { title: "Intent Flow", desc: "Agent proposes payment → authorized approver reviews risk → executes through firewall. Like 2FA for spending." },
  { title: "Emergency Pause", desc: "One-click global freeze. All payments blocked until admin resumes. No panic — just pause." },
];

export default function BenefitSection() {
  return (
    <section className="relative py-32 px-6 bg-ink">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-display)] font-bold tracking-tight text-white mb-4">
            How It Protects Your Agents
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto text-lg">
            Every payment goes through policy checks before funds move. The blockchain itself enforces the rules.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 hover:bg-white/[0.03] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400 text-sm font-mono font-bold">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="text-white font-semibold mb-2">{c.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
