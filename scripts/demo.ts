import * as anchor from "@coral-xyz/anchor";
import { X402Firewall } from "../target/types/x402_firewall";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const FIREWALL_SEED = Buffer.from("firewall-state");

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  x402 Payment Firewall — Solana Demo");
  console.log("═══════════════════════════════════════════\n");

  const connection = new Connection("http://localhost:8899", "confirmed");
  const programId = new PublicKey("AqUjqw2rxopqpdT3SFY5TV1EabcCErypkAeDCcWopwrc");

  const owner = Keypair.generate();
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  const mallory = Keypair.generate();

  // Fund accounts
  for (const kp of [owner, alice, bob, mallory]) {
    const sig = await connection.requestAirdrop(kp.publicKey, 100 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
  }

  const wallet = new anchor.Wallet(owner);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);
  const program = anchor.workspace.X402Firewall as anchor.Program<X402Firewall>;

  const [firewallPda] = PublicKey.findProgramAddressSync([FIREWALL_SEED], program.programId);

  // ── Init ────────────────────────────────────────
  console.log("1. Initializing firewall...");
  await program.methods.initialize().accounts({
    firewallState: firewallPda,
    owner: owner.publicKey,
    systemProgram: SystemProgram.programId,
  }).signers([owner]).rpc();
  console.log("   ✅ Firewall initialized\n");

  // ── Demo 1: Normal Payment ──────────────────────
  console.log("2. Demo: Normal payment (0.01 SOL)...");
  await program.methods.executePayment(new anchor.BN(0.01 * LAMPORTS_PER_SOL)).accounts({
    firewallState: firewallPda,
    sender: alice.publicKey,
    recipient: bob.publicKey,
    systemProgram: SystemProgram.programId,
  }).signers([alice]).rpc();
  console.log("   ✅ Payment executed\n");

  // ── Demo 2: Simulate ────────────────────────────
  console.log("3. Demo: Simulate payment (0.02 SOL)...");
  const sim = await program.methods.simulatePayment(new anchor.BN(0.02 * LAMPORTS_PER_SOL)).accounts({
    firewallState: firewallPda,
    sender: alice.publicKey,
    recipient: bob.publicKey,
  }).view();
  console.log(`   Result: ${sim.allowed ? "ALLOWED" : "BLOCKED"} — ${sim.reason}\n`);

  // ── Demo 3: Blocked Payment ─────────────────────
  console.log("4. Demo: Try sending 50000 SOL (exceeds max)...");
  try {
    await program.methods.executePayment(new anchor.BN(50000 * LAMPORTS_PER_SOL)).accounts({
      firewallState: firewallPda,
      sender: alice.publicKey,
      recipient: bob.publicKey,
      systemProgram: SystemProgram.programId,
    }).signers([alice]).rpc();
    console.log("   ⚠️  Unexpected: payment went through\n");
  } catch (e: any) {
    console.log("   ❌ BLOCKED — Exceeds max payment limit\n");
  }

  // ── Demo 4: Blocked Sender ──────────────────────
  console.log("5. Demo: Block sender + try payment...");
  await program.methods.blockSender(mallory.publicKey, true).accounts({
    firewallState: firewallPda,
    owner: owner.publicKey,
    systemProgram: SystemProgram.programId,
  }).signers([owner]).rpc();

  try {
    await program.methods.executePayment(new anchor.BN(0.01 * LAMPORTS_PER_SOL)).accounts({
      firewallState: firewallPda,
      sender: mallory.publicKey,
      recipient: bob.publicKey,
      systemProgram: SystemProgram.programId,
    }).signers([mallory]).rpc();
    console.log("   ⚠️  Unexpected: blocked sender paid\n");
  } catch (e: any) {
    console.log("   ❌ BLOCKED — Sender is blocked\n");
  }

  // ── Demo 5: Pause ───────────────────────────────
  console.log("6. Demo: Pause + try payment...");
  await program.methods.pause().accounts({
    firewallState: firewallPda,
    owner: owner.publicKey,
  }).signers([owner]).rpc();

  try {
    await program.methods.executePayment(new anchor.BN(0.01 * LAMPORTS_PER_SOL)).accounts({
      firewallState: firewallPda,
      sender: alice.publicKey,
      recipient: bob.publicKey,
      systemProgram: SystemProgram.programId,
    }).signers([alice]).rpc();
    console.log("   ⚠️  Unexpected: payment during pause\n");
  } catch (e: any) {
    console.log("   ❌ BLOCKED — Firewall is paused\n");
  }

  await program.methods.unpause().accounts({
    firewallState: firewallPda,
    owner: owner.publicKey,
  }).signers([owner]).rpc();
  console.log("   ✅ Unpaused\n");

  // ── Demo 6: Intent Flow ─────────────────────────
  console.log("7. Demo: Full intent flow...");
  const agent = Keypair.generate();
  await connection.requestAirdrop(agent.publicKey, 10 * LAMPORTS_PER_SOL);

  await program.methods.addAgent(agent.publicKey).accounts({
    firewallState: firewallPda,
    owner: owner.publicKey,
    systemProgram: SystemProgram.programId,
  }).signers([owner]).rpc();

  const nonce = new anchor.BN(Date.now());
  await program.methods.registerIntent(
    nonce,
    bob.publicKey,
    new anchor.BN(0.05 * LAMPORTS_PER_SOL),
    null,
    new anchor.BN(3600),
  ).accounts({
    firewallState: firewallPda,
    creator: alice.publicKey,
    systemProgram: SystemProgram.programId,
  }).signers([alice]).rpc();

  const [intentPda] = PublicKey.findProgramAddressSync([
    Buffer.from("intent"),
    alice.publicKey.toBuffer(),
    nonce.toArrayLike(Buffer, "le", 8),
  ], program.programId);
  console.log(`   Intent registered: ${intentPda.toBase58()}\n`);

  console.log("8. Demo: Agent approves intent...");
  const [agentPda] = PublicKey.findProgramAddressSync([
    Buffer.from("authorized-agent"),
    agent.publicKey.toBuffer(),
  ], program.programId);

  await program.methods.approveIntent(10, "Low risk payment").accounts({
    firewallState: firewallPda,
    paymentIntent: intentPda,
    authorizedAgent: agentPda,
    agent: agent.publicKey,
  }).signers([agent]).rpc();
  console.log("   ✅ Intent approved\n");

  console.log("9. Demo: Execute approved intent...");
  await program.methods.executeIntent().accounts({
    firewallState: firewallPda,
    paymentIntent: intentPda,
    executor: alice.publicKey,
    recipient: bob.publicKey,
    systemProgram: SystemProgram.programId,
  }).signers([alice]).rpc();
  console.log("   ✅ Intent executed\n");

  // ── Stats ────────────────────────────────────────
  const stats = await program.account.firewallState.fetch(firewallPda);
  console.log("═══════════════════════════════════════════");
  console.log("  Final Firewall Stats");
  console.log("═══════════════════════════════════════════");
  console.log(`  Total Payments: ${stats.totalPayments}`);
  console.log(`  Total Blocked:  ${stats.totalBlocked}`);
  console.log(`  Total Intents:  ${stats.totalIntents}`);
  console.log(`  Total Executed: ${stats.totalExecuted}`);
  console.log(`  Total Volume:   ${stats.totalVolume.toNumber() / 1e9} SOL`);
  console.log("═══════════════════════════════════════════\n");
  console.log("Demo complete! 🎉");
}

main().catch(console.error);
