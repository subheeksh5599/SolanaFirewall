import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { X402Firewall } from "../target/types/x402_firewall";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { expect } from "chai";

describe("x402-firewall", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.X402Firewall as Program<X402Firewall>;

  const owner = Keypair.generate();
  const sender = Keypair.generate();
  const recipient = Keypair.generate();
  const maliciousSender = Keypair.generate();
  const blacklistedRecipient = Keypair.generate();
  const agent = Keypair.generate();

  let firewallStatePda: PublicKey;

  const FIREWALL_SEED = Buffer.from("firewall-state");

  before(async () => {
    // Fund all accounts
    const fundAmount = 100 * LAMPORTS_PER_SOL;
    for (const kp of [owner, sender, recipient, maliciousSender, agent]) {
      const tx = await provider.connection.requestAirdrop(
        kp.publicKey,
        fundAmount
      );
      await provider.connection.confirmTransaction(tx);
    }

    // Derive firewall state PDA
    [firewallStatePda] = PublicKey.findProgramAddressSync(
      [FIREWALL_SEED],
      program.programId
    );
  });

  // ─── Initialize ───────────────────────────────────

  it("initializes the firewall with correct defaults", async () => {
    await program.methods
      .initialize()
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const state = await program.account.firewallState.fetch(firewallStatePda);
    expect(state.owner.equals(owner.publicKey)).to.be.true;
    expect(state.paused).to.be.false;
    expect(state.whitelistEnabled).to.be.false;
    expect(state.globalMaxPayment.toNumber()).to.equal(10_000_000_000_000);
    expect(state.globalDailyLimit.toNumber()).to.equal(50_000_000_000_000);
    expect(state.totalPayments.toNumber()).to.equal(0);
  });

  // ─── Direct Payment ───────────────────────────────

  it("executes a payment within limits", async () => {
    const amount = new anchor.BN(0.5 * LAMPORTS_PER_SOL);

    await program.methods
      .executePayment(amount)
      .accounts({
        firewallState: firewallStatePda,
        sender: sender.publicKey,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    const state = await program.account.firewallState.fetch(firewallStatePda);
    expect(state.totalPayments.toNumber()).to.equal(1);
  });

  it("blocks payment exceeding max payment limit", async () => {
    // Set global max to 1 SOL
    await program.methods
      .setGlobalMaxPayment(new anchor.BN(1 * LAMPORTS_PER_SOL))
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    // Try sending 50 SOL (should fail)
    const amount = new anchor.BN(50 * LAMPORTS_PER_SOL);
    try {
      await program.methods
        .executePayment(amount)
        .accounts({
          firewallState: firewallStatePda,
          sender: sender.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([sender])
        .rpc();
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("ExceedsMaxPayment");
    }

    // Reset max back
    await program.methods
      .setGlobalMaxPayment(new anchor.BN(10_000 * LAMPORTS_PER_SOL))
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
  });

  it("blocks payment from blocked sender", async () => {
    await program.methods
      .blockSender(maliciousSender.publicKey, true)
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const amount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);
    try {
      await program.methods
        .executePayment(amount)
        .accounts({
          firewallState: firewallStatePda,
          sender: maliciousSender.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([maliciousSender])
        .rpc();
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("SenderBlocked");
    }
  });

  it("blocks payment to blacklisted recipient", async () => {
    await program.methods
      .blacklistRecipient(blacklistedRecipient.publicKey, true)
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const amount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);
    try {
      await program.methods
        .executePayment(amount)
        .accounts({
          firewallState: firewallStatePda,
          sender: sender.publicKey,
          recipient: blacklistedRecipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([sender])
        .rpc();
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("RecipientBlacklisted");
    }
  });

  it("enforces daily limit", async () => {
    // Set low daily limit
    await program.methods
      .setGlobalDailyLimit(new anchor.BN(1 * LAMPORTS_PER_SOL))
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    const tempSender = Keypair.generate();
    await provider.connection.requestAirdrop(
      tempSender.publicKey,
      100 * LAMPORTS_PER_SOL
    );

    // First 0.6 SOL should pass
    await program.methods
      .executePayment(new anchor.BN(0.6 * LAMPORTS_PER_SOL))
      .accounts({
        firewallState: firewallStatePda,
        sender: tempSender.publicKey,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([tempSender])
      .rpc();

    // Second 0.6 SOL should fail (total 1.2 > 1.0 daily limit)
    try {
      await program.methods
        .executePayment(new anchor.BN(0.6 * LAMPORTS_PER_SOL))
        .accounts({
          firewallState: firewallStatePda,
          sender: tempSender.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([tempSender])
        .rpc();
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("ExceedsDailyLimit");
    }

    // Reset limit back
    await program.methods
      .setGlobalDailyLimit(new anchor.BN(50_000 * LAMPORTS_PER_SOL))
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
  });

  // ─── Pause / Unpause ──────────────────────────────

  it("blocks all payments when paused", async () => {
    await program.methods
      .pause()
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    const amount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);
    try {
      await program.methods
        .executePayment(amount)
        .accounts({
          firewallState: firewallStatePda,
          sender: sender.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([sender])
        .rpc();
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("FirewallPaused");
    }
  });

  it("allows payments after unpause", async () => {
    await program.methods
      .unpause()
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    const amount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);
    await program.methods
      .executePayment(amount)
      .accounts({
        firewallState: firewallStatePda,
        sender: sender.publicKey,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();
  });

  // ─── Simulation ──────────────────────────────────

  it("simulate correctly predicts allowed payment", async () => {
    const [senderStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("sender-state"), sender.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.account.senderState.fetch(senderStatePda);
    } catch {
      // Sender state doesn't exist yet, not blocked - should pass
    }

    const amount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);
    const result = await program.methods
      .simulatePayment(amount)
      .accounts({
        firewallState: firewallStatePda,
        sender: sender.publicKey,
        recipient: recipient.publicKey,
      })
      .view();

    expect(result.allowed).to.be.true;
    expect(result.reason).to.equal("Payment allowed");
  });

  // ─── Intent Flow ────────────────────────────────

  it("registers intent successfully", async () => {
    const nonce = new anchor.BN(Date.now());

    const [intentPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        sender.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const validFor = new anchor.BN(3600);

    const tx = await program.methods
      .registerIntent(nonce, recipient.publicKey, new anchor.BN(0.5 * LAMPORTS_PER_SOL), null, validFor)
      .accounts({
        firewallState: firewallStatePda,
        creator: sender.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    const intent = await program.account.paymentIntent.fetch(intentPda);
    expect(intent.creator.equals(sender.publicKey)).to.be.true;
    expect(intent.recipient.equals(recipient.publicKey)).to.be.true;
    expect(intent.status).to.deep.equal({ pending: {} });
  });

  it("approves intent via authorized agent", async () => {
    // Add agent first
    await program.methods
      .addAgent(agent.publicKey)
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const nonce = new anchor.BN(Date.now() + 1);

    const validFor = new anchor.BN(3600);
    await program.methods
      .registerIntent(nonce, recipient.publicKey, new anchor.BN(0.3 * LAMPORTS_PER_SOL), null, validFor)
      .accounts({
        firewallState: firewallStatePda,
        creator: sender.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    const [intentPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        sender.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("authorized-agent"), agent.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .approveIntent(15, "Low risk")
      .accounts({
        firewallState: firewallStatePda,
        paymentIntent: intentPda,
        authorizedAgent: agentPda,
        agent: agent.publicKey,
      })
      .signers([agent])
      .rpc();

    const intent = await program.account.paymentIntent.fetch(intentPda);
    expect(intent.status).to.deep.equal({ approved: {} });
  });

  it("executes approved intent via creator", async () => {
    const nonce = new anchor.BN(Date.now() + 2);
    const amount = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
    const validFor = new anchor.BN(3600);

    await program.methods
      .registerIntent(nonce, recipient.publicKey, amount, null, validFor)
      .accounts({
        firewallState: firewallStatePda,
        creator: sender.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    const [intentPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        sender.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("authorized-agent"), agent.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .approveIntent(10, "Approved for execution")
      .accounts({
        firewallState: firewallStatePda,
        paymentIntent: intentPda,
        authorizedAgent: agentPda,
        agent: agent.publicKey,
      })
      .signers([agent])
      .rpc();

    await program.methods
      .executeIntent()
      .accounts({
        firewallState: firewallStatePda,
        paymentIntent: intentPda,
        executor: sender.publicKey,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    const intent = await program.account.paymentIntent.fetch(intentPda);
    expect(intent.status).to.deep.equal({ executed: {} });
  });

  it("blocks unapproved intent execution", async () => {
    const nonce = new anchor.BN(Date.now() + 3);
    const amount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const validFor = new anchor.BN(3600);

    await program.methods
      .registerIntent(nonce, recipient.publicKey, amount, null, validFor)
      .accounts({
        firewallState: firewallStatePda,
        creator: sender.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    const [intentPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        sender.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    try {
      await program.methods
        .executeIntent()
        .accounts({
          firewallState: firewallStatePda,
          paymentIntent: intentPda,
          executor: sender.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([sender])
        .rpc();
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("IntentNotApproved");
    }
  });

  // ─── Rate Limiting ────────────────────────────────

  it("enforces rate limit between payments", async () => {
    await program.methods
      .setMinPaymentInterval(new anchor.BN(10))
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    const tempSender = Keypair.generate();
    await provider.connection.requestAirdrop(
      tempSender.publicKey,
      10 * LAMPORTS_PER_SOL
    );

    const amount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);
    await program.methods
      .executePayment(amount)
      .accounts({
        firewallState: firewallStatePda,
        sender: tempSender.publicKey,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([tempSender])
      .rpc();

    try {
      await program.methods
        .executePayment(amount)
        .accounts({
          firewallState: firewallStatePda,
          sender: tempSender.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([tempSender])
        .rpc();
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("RateLimitExceeded");
    }

    // Reset
    await program.methods
      .setMinPaymentInterval(new anchor.BN(0))
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
  });

  // ─── Whitelist Mode ───────────────────────────────

  it("blocks unlisted recipient in whitelist mode", async () => {
    await program.methods
      .setWhitelistEnabled(true)
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    const unlistedRecipient = Keypair.generate();
    const amount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);

    try {
      await program.methods
        .executePayment(amount)
        .accounts({
          firewallState: firewallStatePda,
          sender: sender.publicKey,
          recipient: unlistedRecipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([sender])
        .rpc();
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("RecipientNotWhitelisted");
    }

    await program.methods
      .setWhitelistEnabled(false)
      .accounts({
        firewallState: firewallStatePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
  });

  // ─── Ownership ────────────────────────────────────

  it("blocks non-owner admin actions", async () => {
    try {
      await program.methods
        .pause()
        .accounts({
          firewallState: firewallStatePda,
          owner: sender.publicKey,
        })
        .signers([sender])
        .rpc();
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("UnauthorizedOwner");
    }
  });
});
