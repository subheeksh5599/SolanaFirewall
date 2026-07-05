import { useMemo, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("56hwxWZ1K1K6wCqGozkF1VTmUxSiWD1DYxm54F9U57EA");
const FIREWALL_SEED = Buffer.from("firewall-state");

interface FirewallStats {
  totalPayments: string;
  totalVolume: string;
  totalBlocked: string;
  totalIntents: string;
  totalExecuted: string;
  paused: boolean;
  owner: string;
}

function b58(buf: Uint8Array): string {
  // Simple base58 encoder inline
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = [0n];
  for (const byte of buf) {
    let carry = BigInt(byte);
    for (let j = 0; j < digits.length; j++) {
      carry += BigInt(digits[j]) << 8n;
      digits[j] = Number(carry % 58n);
      carry = carry / 58n;
    }
    while (carry > 0n) {
      digits.push(Number(carry % 58n));
      carry = carry / 58n;
    }
  }
  for (const byte of buf) {
    if (byte !== 0) break;
    digits.push(0);
  }
  return digits.reverse().map(d => ALPHABET[d]).join("");
}

function readU8(data: Uint8Array, offset: number): [number, number] {
  return [data[offset], offset + 1];
}
function readI64(data: Uint8Array, offset: number): [bigint, number] {
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  const lo = BigInt(view.getUint32(0, true));
  const hi = BigInt(view.getUint32(4, true));
  // Might be signed; for u64 we just use the full 8 bytes unsigned
  const val = lo | (hi << 32n);
  return [val, offset + 8];
}
function readU64(data: Uint8Array, offset: number): [bigint, number] {
  return readI64(data, offset);
}
function readBool(data: Uint8Array, offset: number): [boolean, number] {
  return [data[offset] !== 0, offset + 1];
}
function readPubkey(data: Uint8Array, offset: number): [PublicKey, number] {
  return [new PublicKey(data.slice(offset, offset + 32)), offset + 32];
}

function parseFirewallState(data: Uint8Array): FirewallStats {
  let off = 8; // skip discriminator
  const [owner, o1] = readPubkey(data, off); off = o1;
  const [paused, o2] = readBool(data, off); off = o2;
  const [, o3] = readBool(data, off); off = o3; // whitelistEnabled
  const [, o4] = readU64(data, off); off = o4; // globalMaxPayment
  const [, o5] = readU64(data, off); off = o5; // globalDailyLimit
  const [, o6] = readI64(data, off); off = o6; // minPaymentInterval
  const [totalPayments, o7] = readU64(data, off); off = o7;
  const [totalVolume, o8] = readU64(data, off); off = o8;
  const [totalBlocked, o9] = readU64(data, off); off = o9;
  const [totalIntents, o10] = readU64(data, off); off = o10;
  const [, o11] = readU64(data, off); off = o11; // totalApproved
  const [, o12] = readU64(data, off); off = o12; // totalRejected
  const [totalExecuted, o13] = readU64(data, off); off = o13;

  return {
    totalPayments: totalPayments.toString(),
    totalVolume: totalVolume.toString(),
    totalBlocked: totalBlocked.toString(),
    totalIntents: totalIntents.toString(),
    totalExecuted: totalExecuted.toString(),
    paused,
    owner: owner.toBase58(),
  };
}

export function useFirewall() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [stats, setStats] = useState<FirewallStats | null>(null);

  const [firewallPda] = useMemo(
    () => PublicKey.findProgramAddressSync([FIREWALL_SEED], PROGRAM_ID),
    []
  );

  const refreshStats = useCallback(async () => {
    try {
      const ai = await connection.getAccountInfo(firewallPda);
      if (!ai || ai.data.length < 8) return;
      setStats(parseFirewallState(ai.data));
    } catch { /* not initialized yet */ }
  }, [connection, firewallPda]);

  const init = useCallback(async () => {
    if (!publicKey || !signTransaction) throw new Error("Connect wallet first");
    setLoading(true);
    try {
      const hash = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: firewallPda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: hash,
      });
      const { Transaction } = await import("@solana/web3.js");
      const tx = new Transaction().add(ix);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setResult(`Initialized! TX: ${sig.slice(0, 16)}...`);
      await refreshStats();
    } catch (e: any) {
      setResult(`Error: ${e.message?.slice(0, 100)}`);
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, connection, firewallPda]);

  const executePayment = useCallback(async (recipient: string, amountSol: number) => {
    if (!publicKey || !signTransaction) throw new Error("Connect wallet first");
    setLoading(true);
    try {
      const hash2 = Buffer.from([86, 4, 7, 7, 120, 139, 232, 139]);
      const amountLamports = BigInt(Math.floor(amountSol * LAMPORTS_PER_SOL));
      const amountBuf = Buffer.alloc(8);
      amountBuf.writeBigUInt64LE(amountLamports);

      // PDA derivations for optional accounts
      const [senderStatePda] = PublicKey.findProgramAddressSync([Buffer.from("sender-state"), publicKey.toBuffer()], PROGRAM_ID);
      const recipientPub = new PublicKey(recipient);
      const [recipientStatePda] = PublicKey.findProgramAddressSync([Buffer.from("recipient-state"), recipientPub.toBuffer()], PROGRAM_ID);
      const [pairPda] = PublicKey.findProgramAddressSync([Buffer.from("sender-recipient"), publicKey.toBuffer(), recipientPub.toBuffer()], PROGRAM_ID);
      const [dailyPda] = PublicKey.findProgramAddressSync([Buffer.from("daily-tracker"), publicKey.toBuffer()], PROGRAM_ID);

      const ix = new TransactionInstruction({
        keys: [
          { pubkey: firewallPda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: recipientPub, isSigner: false, isWritable: true },
          { pubkey: senderStatePda, isSigner: false, isWritable: true },
          { pubkey: recipientStatePda, isSigner: false, isWritable: true },
          { pubkey: pairPda, isSigner: false, isWritable: true },
          { pubkey: dailyPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([hash2, amountBuf]),
      });
      const { Transaction } = await import("@solana/web3.js");
      const tx = new Transaction().add(ix);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setResult(`Payment sent! TX: ${sig.slice(0, 16)}...${amountSol} SOL → ${recipient.slice(0, 8)}...`);
      await refreshStats();
    } catch (e: any) {
      const msg = e.message || String(e);
      if (msg.includes("6005")) setResult("BLOCKED: Exceeds max payment limit");
      else if (msg.includes("6002")) setResult("BLOCKED: Sender is blocked");
      else if (msg.includes("6003")) setResult("BLOCKED: Recipient blacklisted");
      else if (msg.includes("6006")) setResult("BLOCKED: Daily limit exceeded");
      else if (msg.includes("6000")) setResult("BLOCKED: Firewall is paused");
      else setResult(`Error: ${msg.slice(0, 120)}`);
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, connection, firewallPda]);

  const simulate = useCallback(async (recipient: string, amountSol: number) => {
    try {
      const hash3 = Buffer.from([100, 75, 221, 72, 168, 78, 8, 20]);
      const amountLamports = BigInt(Math.floor(amountSol * LAMPORTS_PER_SOL));
      const amountBuf = Buffer.alloc(8);
      amountBuf.writeBigUInt64LE(amountLamports);
      const recipientPub = new PublicKey(recipient);
      const [senderStatePda] = PublicKey.findProgramAddressSync([Buffer.from("sender-state"), (publicKey || PublicKey.default).toBuffer()], PROGRAM_ID);
      const [recipientStatePda] = PublicKey.findProgramAddressSync([Buffer.from("recipient-state"), recipientPub.toBuffer()], PROGRAM_ID);
      const [pairPda] = PublicKey.findProgramAddressSync([Buffer.from("sender-recipient"), (publicKey || PublicKey.default).toBuffer(), recipientPub.toBuffer()], PROGRAM_ID);
      const [dailyPda] = PublicKey.findProgramAddressSync([Buffer.from("daily-tracker"), (publicKey || PublicKey.default).toBuffer()], PROGRAM_ID);

      const accounts = [
        { pubkey: firewallPda, isSigner: false, isWritable: false },
        { pubkey: publicKey || PublicKey.default, isSigner: false, isWritable: false },
        { pubkey: recipientPub, isSigner: false, isWritable: false },
        { pubkey: senderStatePda, isSigner: false, isWritable: false },
        { pubkey: recipientStatePda, isSigner: false, isWritable: false },
        { pubkey: pairPda, isSigner: false, isWritable: false },
        { pubkey: dailyPda, isSigner: false, isWritable: false },
      ];

      const { TransactionInstruction } = await import("@solana/web3.js");
      const ix = new TransactionInstruction({ keys: accounts, programId: PROGRAM_ID, data: Buffer.concat([hash3, amountBuf]) });
      const { Transaction } = await import("@solana/web3.js");

      // Simulation via simulated transaction
      const tx = new Transaction().add(ix);
      tx.feePayer = publicKey || PublicKey.default;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;

      const sim = await connection.simulateTransaction(tx, []);
      if (sim.value.err) {
        setResult(`Simulation: BLOCKED — ${JSON.stringify(sim.value.err)}`);
      } else {
        setResult(`Simulation: ALLOWED — ${amountSol} SOL would pass policy checks`);
      }
    } catch (e: any) {
      setResult(`Sim error: ${e.message?.slice(0, 100)}`);
    }
  }, [publicKey, connection, firewallPda]);

  return { init, executePayment, simulate, refreshStats, stats, loading, result, firewallPda };
}
