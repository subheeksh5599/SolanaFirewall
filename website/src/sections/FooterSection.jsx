export default function FooterSection() {
  return (
    <section className="relative bg-[#0c0c0d]">
      <div className="w-full h-20 bg-gradient-to-b from-ink to-[#0c0c0d]" />

      <div className="relative py-24">
        <div className="overflow-hidden">
          <h1 className="text-5xl md:text-7xl font-[family-name:var(--font-display)] font-bold text-center text-white py-5 tracking-tight">
            #PROTECT YOUR PAYMENTS
          </h1>
        </div>

        <div className="flex justify-center gap-5 mt-12">
          <a href="https://github.com/subheeksh5599/SolanaFirewall" target="_blank" rel="noopener noreferrer" className="border border-white/10 size-16 flex items-center justify-center rounded-full hover:bg-white/[0.04] transition-colors">
            <span className="text-white/40 hover:text-white text-sm font-semibold">GitHub</span>
          </a>
          <a href="https://solanafirewall.vercel.app/dashboard" className="border border-white/10 size-16 flex items-center justify-center rounded-full hover:bg-white/[0.04] transition-colors">
            <span className="text-white/40 hover:text-white text-sm font-semibold">App</span>
          </a>
        </div>

        <div className="mt-20 px-5 md:px-10 flex gap-10 md:flex-row flex-col justify-between text-zinc-500 text-sm">
          <div className="flex items-start md:gap-16 gap-8">
            <p className="text-white font-semibold font-[family-name:var(--font-display)] text-lg">SolanaFirewall</p>
            <div><p className="text-zinc-400">Docs</p><p>Architecture</p><p>Integration</p></div>
            <div><p className="text-zinc-400">Developers</p><p>GitHub</p><p>npm SDK</p></div>
          </div>
          <div className="md:max-w-md">
            <p>Built with Anchor framework, deployed on Solana devnet. Open-source under MIT license. Enforced at the runtime level.</p>
          </div>
        </div>

        <div className="mt-16 px-5 md:px-10 py-6 border-t border-white/[0.04] flex gap-7 md:flex-row flex-col-reverse justify-between items-center text-zinc-600 text-xs">
          <p>Built for Superteam Agentic Engineering Grants 2025</p>
          <div className="flex items-center gap-7">
            <p>Open Source</p>
            <p>MIT License</p>
          </div>
        </div>
      </div>
    </section>
  );
}
