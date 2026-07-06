import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { useFirewall } from "../hooks/useFirewall";
import { SolanaWalletProvider } from "../components/WalletProvider";
import { motion } from "framer-motion";

function AppContent() {
  const { publicKey, connected } = useWallet();
  const { init, executePayment, simulate, refreshStats, stats, loading, result, firewallPda } = useFirewall();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0.01");

  useEffect(() => { if (connected) refreshStats(); }, [connected]);

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-[family-name:var(--font-display)]">
      <header className="flex items-center justify-between px-5 sm:px-8 pt-6 pb-4 border-b border-white/10">
        <a href="/" className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity">SolanaFirewall</a>
        <WalletMultiButton className="!bg-white !text-black !rounded-lg !py-2.5 !px-5 !text-sm !font-medium !h-auto hover:!bg-neutral-200 !transition-colors" />
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl font-medium mb-1">Firewall Dashboard</h1>
          <p className="text-neutral-500 text-sm">Solana Devnet · 56hwxWZ1K1K6wCqGozkF1VTmUxSiWD1DYxm54F9U57EA</p>
        </motion.div>

        {!connected ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-12 rounded-2xl border border-white/10 p-16 text-center">
            <div className="text-5xl mb-5">🔐</div>
            <h2 className="text-2xl font-medium mb-2">Connect your wallet</h2>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto">Use Phantom or Solflare on Solana Devnet to interact with the firewall.</p>
            <WalletMultiButton className="!bg-white !text-black !rounded-xl !py-3 !px-8 !font-medium !h-auto hover:!bg-neutral-200" />
          </motion.div>
        ) : (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {!stats && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-10 text-center">
                <h3 className="text-xl font-medium mb-2">Initialize the Firewall</h3>
                <p className="text-neutral-500 mb-6 text-sm max-w-md mx-auto">Create the on-chain FirewallState PDA on devnet. One-time setup.</p>
                <button onClick={init} disabled={loading}
                  className="bg-blue-500 text-white rounded-xl px-8 py-3 font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors">
                  {loading ? "Initializing..." : "Initialize"}
                </button>
              </motion.div>
            )}

            {stats && (
              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Payments", val: stats.totalPayments },
                  { label: "Blocked", val: stats.totalBlocked },
                  { label: "Intents", val: stats.totalIntents },
                  { label: "Executed", val: stats.totalExecuted },
                  { label: "Status", val: stats.paused ? "Paused" : "Active" },
                ].map(s => (
                  <div key={s.label} className="border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-semibold tracking-tight">{s.val}</div>
                    <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="lg:col-span-2 border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-medium mb-5">Execute Payment</h3>
              <input type="text" placeholder="Recipient address" value={recipient} onChange={e => setRecipient(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-white/30 placeholder:text-neutral-600 mb-3" />
              <div className="flex gap-3 mb-3">
                <input type="number" step="0.001" placeholder="Amount in SOL" value={amount} onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-white/30 placeholder:text-neutral-600" />
                <button onClick={() => executePayment(recipient, parseFloat(amount))} disabled={loading || !recipient}
                  className="bg-white text-black rounded-xl px-6 py-3 text-sm font-medium hover:bg-neutral-200 disabled:opacity-30 transition-colors shrink-0">
                  {loading ? "..." : "Send"}
                </button>
              </div>
              <div className="flex gap-1.5">
                {[0.001, 0.01, 100, 15000].map(a => (
                  <button key={a} onClick={() => setAmount(String(a))}
                    className="text-xs bg-white/5 rounded-lg px-3 py-1.5 text-neutral-500 hover:text-white hover:bg-white/10 transition-colors">
                    {a} SOL
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-white/10 rounded-2xl p-6 flex flex-col">
              <h3 className="text-base font-medium mb-4">Simulate</h3>
              <button onClick={() => simulate(recipient || "11111111111111111111111111111111", parseFloat(amount))} disabled={loading}
                className="bg-white/5 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-white/10 disabled:opacity-30 transition-colors mb-4">
                Check policy
              </button>
              {result && (
                <div className={`text-xs p-3 rounded-lg leading-relaxed ${result.includes("BLOCKED") || result.includes("Error") ? "bg-red-500/10 text-red-300" : "bg-green-500/10 text-green-300"}`}>
                  {result}
                </div>
              )}
            </div>

            <div className="lg:col-span-3 border border-white/10 rounded-2xl p-5">
              <p className="text-sm text-neutral-400">
                The firewall enforces policies on-chain. Try <span className="text-white">15,000 SOL</span> to see it blocked by the Solana runtime.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AppPage() {
  return (
    <SolanaWalletProvider>
      <AppContent />
    </SolanaWalletProvider>
  );
}
