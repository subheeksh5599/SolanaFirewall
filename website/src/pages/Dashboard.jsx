import { useEffect, useState, useCallback, useMemo } from "react";
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Buffer as BufPolyfill } from "buffer/";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "@solana/wallet-adapter-react-ui/styles.css";

window.Buffer = BufPolyfill;
window.global = window;

const PROGRAM_ID = new PublicKey("56hwxWZ1K1K6wCqGozkF1VTmUxSiWD1DYxm54F9U57EA");
const FIREWALL_SEED = Buffer.from("firewall-state");
const DISC_INIT = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
const DISC_PAY = Buffer.from([86, 4, 7, 7, 120, 139, 232, 139]);
const DISC_SIM = Buffer.from([100, 75, 221, 72, 168, 78, 8, 20]);

function DashboardContent() {
  const { publicKey, connected, signTransaction } = useWallet();
  const connection = useMemo(() => new Connection("https://api.devnet.solana.com", "confirmed"), []);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [stats, setStats] = useState(null);

  const [firewallPda] = useMemo(() => PublicKey.findProgramAddressSync([FIREWALL_SEED], PROGRAM_ID)[0], []);

  const refreshStats = useCallback(async () => {
    try {
      const ai = await connection.getAccountInfo(firewallPda);
      if (!ai || ai.data.length < 8) return;
      const d = ai.data;
      let o = 8 + 32 + 1 + 1;
      o += 8 + 8 + 8;
      const tp = Number(new DataView(d.buffer, d.byteOffset + o, 8).getBigUint64(0, true));
      o += 8;
      const tv = Number(new DataView(d.buffer, d.byteOffset + o, 8).getBigUint64(0, true));
      o += 8;
      const tb = Number(new DataView(d.buffer, d.byteOffset + o, 8).getBigUint64(0, true));
      o += 8;
      const ti = Number(new DataView(d.buffer, d.byteOffset + o, 8).getBigUint64(0, true));
      o += 8 + 8 + 8;
      const te = Number(new DataView(d.buffer, d.byteOffset + o, 8).getBigUint64(0, true));
      const paused = d[8 + 32] !== 0;
      setStats({ totalPayments: tp, totalVolume: tv, totalBlocked: tb, totalIntents: ti, totalExecuted: te, paused });
    } catch { }
  }, [connection, firewallPda]);

  useEffect(() => { if (connected) refreshStats(); }, [connected, refreshStats]);

  const init = async () => {
    if (!publicKey || !signTransaction) return;
    setLoading(true);
    try {
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: firewallPda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISC_INIT,
      });
      const tx = new Transaction().add(ix);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setResult(`Initialized! ${sig.slice(0, 12)}...`);
      refreshStats();
    } catch (e) { setResult(`Error: ${e.message?.slice(0, 100)}`); }
    finally { setLoading(false); }
  };

  const pay = async () => {
    if (!publicKey || !signTransaction || !recipient) return;
    setLoading(true);
    try {
      const recPub = new PublicKey(recipient);
      const amt = BigInt(Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL));
      const amtBuf = Buffer.alloc(8);
      amtBuf.writeBigUInt64LE(amt);
      const [sPda] = PublicKey.findProgramAddressSync([Buffer.from("sender-state"), publicKey.toBuffer()], PROGRAM_ID);
      const [rPda] = PublicKey.findProgramAddressSync([Buffer.from("recipient-state"), recPub.toBuffer()], PROGRAM_ID);
      const [pPda] = PublicKey.findProgramAddressSync([Buffer.from("sender-recipient"), publicKey.toBuffer(), recPub.toBuffer()], PROGRAM_ID);
      const [dPda] = PublicKey.findProgramAddressSync([Buffer.from("daily-tracker"), publicKey.toBuffer()], PROGRAM_ID);

      const ix = new TransactionInstruction({
        keys: [
          { pubkey: firewallPda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: recPub, isSigner: false, isWritable: true },
          { pubkey: sPda, isSigner: false, isWritable: true },
          { pubkey: rPda, isSigner: false, isWritable: true },
          { pubkey: pPda, isSigner: false, isWritable: true },
          { pubkey: dPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([DISC_PAY, amtBuf]),
      });
      const tx = new Transaction().add(ix);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setResult(`Sent ${amount} SOL → ${recipient.slice(0, 8)}... | ${sig.slice(0, 12)}...`);
      refreshStats();
    } catch (e) {
      const m = e.message || String(e);
      if (m.includes("6005")) setResult("BLOCKED: Exceeds max payment limit");
      else if (m.includes("6002")) setResult("BLOCKED: Sender is blocked");
      else if (m.includes("6003")) setResult("BLOCKED: Recipient blacklisted");
      else if (m.includes("6000")) setResult("BLOCKED: Firewall is paused");
      else if (m.includes("6006")) setResult("BLOCKED: Daily limit exceeded");
      else setResult(`Error: ${m.slice(0, 100)}`);
    }
    finally { setLoading(false); }
  };

  const sim = async () => {
    try {
      const recPub = new PublicKey(recipient || "11111111111111111111111111111111");
      const amt = BigInt(Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL));
      const amtBuf = Buffer.alloc(8);
      amtBuf.writeBigUInt64LE(amt);
      const sender = publicKey || PublicKey.default;
      const [sPda] = PublicKey.findProgramAddressSync([Buffer.from("sender-state"), sender.toBuffer()], PROGRAM_ID);
      const [rPda] = PublicKey.findProgramAddressSync([Buffer.from("recipient-state"), recPub.toBuffer()], PROGRAM_ID);
      const [pPda] = PublicKey.findProgramAddressSync([Buffer.from("sender-recipient"), sender.toBuffer(), recPub.toBuffer()], PROGRAM_ID);
      const [dPda] = PublicKey.findProgramAddressSync([Buffer.from("daily-tracker"), sender.toBuffer()], PROGRAM_ID);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: firewallPda, isSigner: false, isWritable: false },
          { pubkey: sender, isSigner: false, isWritable: false },
          { pubkey: recPub, isSigner: false, isWritable: false },
          { pubkey: sPda, isSigner: false, isWritable: false },
          { pubkey: rPda, isSigner: false, isWritable: false },
          { pubkey: pPda, isSigner: false, isWritable: false },
          { pubkey: dPda, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([DISC_SIM, amtBuf]),
      });
      const tx = new Transaction().add(ix);
      tx.feePayer = sender;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      const simResult = await connection.simulateTransaction(tx);
      if (simResult.value.err) setResult(`Sim: BLOCKED — ${JSON.stringify(simResult.value.err)}`);
      else setResult(`Sim: ALLOWED — ${amount} SOL would pass`);
    } catch (e) { setResult(`Sim error: ${e.message?.slice(0, 100)}`); }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-zinc-200">
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0c0c0d]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            <span className="text-purple-400">Solana</span><span className="text-white">Firewall</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/[0.06] px-3 py-1 text-[11px] text-zinc-500 font-mono">Devnet</span>
            <WalletMultiButton className="!bg-purple-500 !text-white !rounded-lg !py-2 !px-4 !text-sm !font-semibold !h-auto hover:!bg-purple-400 !transition-colors" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)] tracking-tight">Firewall Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Program: 56hwxWZ1K1K6wCqGozkF1VTmUxSiWD1DYxm54F9U57EA</p>
        </div>

        {!connected ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-xl font-semibold mb-2">Connect your wallet</h2>
            <p className="text-zinc-500 mb-8 max-w-md mx-auto">Use Phantom or Solflare on Solana Devnet to interact with the firewall.</p>
            <WalletMultiButton className="!bg-purple-500 !text-white !rounded-lg !py-3 !px-8 !font-semibold !h-auto hover:!bg-purple-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {!stats && (
              <div className="lg:col-span-3 border border-purple-500/20 bg-purple-500/[0.03] rounded-2xl p-10 text-center">
                <h3 className="text-lg font-semibold mb-2">Initialize the Firewall</h3>
                <p className="text-zinc-500 mb-6 text-sm">Create the on-chain FirewallState PDA on devnet.</p>
                <button onClick={init} disabled={loading} className="rounded-lg bg-purple-500 text-white px-8 py-3 font-semibold hover:bg-purple-400 disabled:opacity-50 transition-colors">
                  {loading ? "..." : "Initialize"}
                </button>
              </div>
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
                  <div key={s.label} className="border border-white/[0.04] bg-white/[0.01] rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold font-[family-name:var(--font-display)] tracking-tight">{s.val}</div>
                    <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="lg:col-span-2 border border-white/[0.04] bg-white/[0.01] rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Execute Payment</h3>
              <input type="text" placeholder="Recipient address" value={recipient} onChange={e => setRecipient(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm outline-none focus:border-purple-500/30 placeholder:text-zinc-600 mb-3" />
              <div className="flex gap-3 mb-3">
                <input type="number" step="0.001" placeholder="Amount in SOL" value={amount} onChange={e => setAmount(e.target.value)}
                  className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm outline-none focus:border-purple-500/30 placeholder:text-zinc-600" />
                <button onClick={pay} disabled={loading || !recipient}
                  className="rounded-lg bg-purple-500 text-white px-6 py-3 text-sm font-semibold hover:bg-purple-400 disabled:opacity-30 transition-colors shrink-0">
                  {loading ? "..." : "Send"}
                </button>
              </div>
              <div className="flex gap-1.5">
                {[0.001, 0.01, 100, 15000].map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} className="text-xs border border-white/[0.06] rounded-lg px-3 py-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-colors">{a} SOL</button>
                ))}
              </div>
            </div>

            <div className="border border-white/[0.04] bg-white/[0.01] rounded-2xl p-6 flex flex-col">
              <h3 className="font-semibold mb-4">Simulate</h3>
              <button onClick={sim} disabled={loading} className="rounded-lg border border-white/[0.06] text-white px-5 py-3 text-sm font-semibold hover:bg-white/[0.04] disabled:opacity-30 transition-colors mb-4">Check policy</button>
              {result && (
                <div className={`text-xs p-3 rounded-lg leading-relaxed font-mono ${result.includes("BLOCKED") || result.includes("Error") ? "bg-red-500/10 text-red-300" : "bg-green-500/10 text-green-300"}`}>{result}</div>
              )}
            </div>

            <div className="lg:col-span-3 border border-white/[0.04] rounded-2xl p-5">
              <p className="text-sm text-zinc-500">Try sending <span className="text-white font-semibold">15,000 SOL</span> to see the firewall block it at the Solana runtime level.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
export default function Dashboard() {
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <DashboardContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
