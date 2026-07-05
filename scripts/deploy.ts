import * as anchor from "@coral-xyz/anchor";
import { X402Firewall } from "../target/types/x402_firewall";
import { PublicKey, SystemProgram, Connection, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const FIREWALL_SEED = Buffer.from("firewall-state");
const DAILY_TRACKER_SEED = Buffer.from("daily-tracker");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Load wallet from keygen
  const keyPath = path.join(process.env.HOME || "/root", ".config/solana/id.json");
  let wallet: Keypair;
  if (fs.existsSync(keyPath)) {
    const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(keyPath, "utf-8")));
    wallet = Keypair.fromSecretKey(secretKey);
  } else {
    wallet = Keypair.generate();
    console.log("Generated new wallet:", wallet.publicKey.toBase58());
  }

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`Wallet: ${wallet.publicKey.toBase58()} (${balance / 1e9} SOL)`);

  if (balance < 0.1 * 1e9) {
    console.log("Requesting airdrop...");
    const sig = await connection.requestAirdrop(wallet.publicKey, 2 * 1e9);
    await connection.confirmTransaction(sig);
    console.log("Airdrop received");
  }

  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {});
  anchor.setProvider(provider);

  const program = anchor.workspace.X402Firewall as anchor.Program<X402Firewall>;

  // Derive firewall state PDA
  const [firewallStatePda] = PublicKey.findProgramAddressSync([FIREWALL_SEED], program.programId);

  // Check if already initialized
  try {
    const state = await program.account.firewallState.fetch(firewallStatePda);
    console.log("Firewall already initialized");
    console.log(`  Owner: ${state.owner.toBase58()}`);
    console.log(`  Paused: ${state.paused}`);
    console.log(`  Max Payment: ${state.globalMaxPayment.toNumber() / 1e9} SOL`);
    console.log(`  Daily Limit: ${state.globalDailyLimit.toNumber() / 1e9} SOL`);
  } catch {
    console.log("Initializing firewall...");
    await program.methods
      .initialize()
      .accounts({
        firewallState: firewallStatePda,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log("Firewall initialized successfully!");
    console.log(`  Owner: ${wallet.publicKey.toBase58()}`);
    console.log(`  Max Payment: 10,000 SOL`);
    console.log(`  Daily Limit: 50,000 SOL`);
  }
}

main().catch(console.error);
