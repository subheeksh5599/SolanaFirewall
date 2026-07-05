import { Program, AnchorProvider, Idl, BN, web3, Wallet } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Connection } from "@solana/web3.js";
import { EventEmitter } from "events";
import { X402Firewall } from "../target/types/x402_firewall";

export type Network = "localnet" | "devnet" | "mainnet-beta";

export const NETWORKS: Record<Network, { rpc: string; chainId: number }> = {
  localnet: { rpc: "http://localhost:8899", chainId: 0 },
  devnet: { rpc: "https://api.devnet.solana.com", chainId: 0 },
  "mainnet-beta": { rpc: "https://api.mainnet-beta.solana.com", chainId: 0 },
};

export interface FirewallConfig {
  programId?: string;
  network?: Network;
  rpcUrl?: string;
}

export interface PaymentResult {
  tx: string;
  sender: string;
  recipient: string;
  amount: number;
}

export interface SimulationResult {
  allowed: boolean;
  reason: string;
}

export interface FirewallStats {
  totalPayments: number;
  totalVolume: number;
  totalBlocked: number;
  totalIntents: number;
  totalApproved: number;
  totalRejected: number;
  totalExecuted: number;
}

export interface PolicyState {
  paused: boolean;
  whitelistEnabled: boolean;
  globalMaxPayment: number;
  globalDailyLimit: number;
  minPaymentInterval: number;
  owner: string;
}

export interface PaymentIntent {
  creator: string;
  recipient: string;
  amount: number;
  tokenMint: string | null;
  nonce: number;
  expiry: number;
  status: string;
  riskScore: number;
  reason: string;
  approvedBy: string;
  createdAt: number;
}

const FIREWALL_SEED = Buffer.from("firewall-state");
const SENDER_SEED = Buffer.from("sender-state");
const RECIPIENT_SEED = Buffer.from("recipient-state");
const DAILY_SEED = Buffer.from("daily-tracker");
const INTENT_SEED = Buffer.from("intent");
const AGENT_SEED = Buffer.from("authorized-agent");

export class X402SolanaFirewall extends EventEmitter {
  private program: Program<X402Firewall>;
  private firewallPda: PublicKey;

  constructor(
    private connection: Connection,
    private wallet: Wallet,
    private config: FirewallConfig = {}
  ) {
    super();

    const network = config.network || "devnet";
    if (!connection) {
      this.connection = new Connection(
        config.rpcUrl || NETWORKS[network].rpc,
        "confirmed"
      );
    }

    const programId = new PublicKey(
      config.programId || "AqUjqw2rxopqpdT3SFY5TV1EabcCErypkAeDCcWopwrc"
    );

    const provider = new AnchorProvider(this.connection, wallet, {});
    this.program = new Program(
      require("../target/idl/x402_firewall.json"),
      provider
    );

    [this.firewallPda] = PublicKey.findProgramAddressSync(
      [FIREWALL_SEED],
      programId
    );
  }

  static async fromBrowserWallet(
    config: FirewallConfig = {}
  ): Promise<X402SolanaFirewall> {
    const { SolanaWalletAdapter } = await import("./browser");
    const wallet = await SolanaWalletAdapter.connect();
    return new X402SolanaFirewall(
      new Connection(config.rpcUrl || NETWORKS.devnet.rpc),
      wallet,
      config
    );
  }

  // ─── Payment ──────────────────────────────────────

  async pay(recipient: PublicKey, lamports: number): Promise<PaymentResult> {
    const tx = await this.program.methods
      .executePayment(new BN(lamports))
      .accounts({
        firewallState: this.firewallPda,
        sender: this.wallet.publicKey,
        recipient,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return {
      tx,
      sender: this.wallet.publicKey.toBase58(),
      recipient: recipient.toBase58(),
      amount: lamports,
    };
  }

  // ─── Simulation ───────────────────────────────────

  async simulate(
    sender: PublicKey,
    recipient: PublicKey,
    lamports: number
  ): Promise<SimulationResult> {
    const result = await this.program.methods
      .simulatePayment(new BN(lamports))
      .accounts({
        firewallState: this.firewallPda,
        sender,
        recipient,
      })
      .view();

    return {
      allowed: result.allowed,
      reason: result.reason,
    };
  }

  // ─── Intent Flow ──────────────────────────────────

  async registerIntent(
    recipient: PublicKey,
    lamports: number,
    validForSeconds: number = 3600,
    tokenMint?: PublicKey
  ): Promise<{ intentPda: PublicKey; tx: string }> {
    const nonce = new BN(Date.now());

    const [intentPda] = PublicKey.findProgramAddressSync(
      [INTENT_SEED, this.wallet.publicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const tx = await this.program.methods
      .registerIntent(
        nonce,
        recipient,
        new BN(lamports),
        tokenMint || null,
        new BN(validForSeconds)
      )
      .accounts({
        firewallState: this.firewallPda,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { intentPda, tx };
  }

  async approveIntent(
    intentPda: PublicKey,
    riskScore: number,
    reason: string
  ): Promise<string> {
    const [agentPda] = PublicKey.findProgramAddressSync(
      [AGENT_SEED, this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    return this.program.methods
      .approveIntent(riskScore, reason)
      .accounts({
        firewallState: this.firewallPda,
        paymentIntent: intentPda,
        authorizedAgent: agentPda,
        agent: this.wallet.publicKey,
      })
      .rpc();
  }

  async rejectIntent(
    intentPda: PublicKey,
    riskScore: number,
    reason: string
  ): Promise<string> {
    const [agentPda] = PublicKey.findProgramAddressSync(
      [AGENT_SEED, this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    return this.program.methods
      .rejectIntent(riskScore, reason)
      .accounts({
        firewallState: this.firewallPda,
        paymentIntent: intentPda,
        authorizedAgent: agentPda,
        agent: this.wallet.publicKey,
      })
      .rpc();
  }

  async executeIntent(intentPda: PublicKey, recipient: PublicKey): Promise<PaymentResult> {
    const intent = await this.getIntent(intentPda);
    if (!intent) throw new Error("Intent not found");

    const tx = await this.program.methods
      .executeIntent()
      .accounts({
        firewallState: this.firewallPda,
        paymentIntent: intentPda,
        executor: this.wallet.publicKey,
        recipient,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return {
      tx,
      sender: intent.creator,
      recipient: intent.recipient,
      amount: intent.amount,
    };
  }

  // ─── Reads ────────────────────────────────────────

  async getIntent(intentPda: PublicKey): Promise<PaymentIntent | null> {
    try {
      const data = await this.program.account.paymentIntent.fetch(intentPda);
      const status = Object.keys(data.status)[0] || "unknown";
      return {
        creator: data.creator.toBase58(),
        recipient: data.recipient.toBase58(),
        amount: data.amount.toNumber(),
        tokenMint: data.tokenMint ? data.tokenMint.toBase58() : null,
        nonce: data.nonce.toNumber(),
        expiry: data.expiry.toNumber(),
        status,
        riskScore: data.riskScore,
        reason: data.reason,
        approvedBy: data.approvedBy.toBase58(),
        createdAt: data.createdAt.toNumber(),
      };
    } catch {
      return null;
    }
  }

  async getStats(): Promise<FirewallStats> {
    const state = await this.program.account.firewallState.fetch(this.firewallPda);
    return {
      totalPayments: state.totalPayments.toNumber(),
      totalVolume: state.totalVolume.toNumber(),
      totalBlocked: state.totalBlocked.toNumber(),
      totalIntents: state.totalIntents.toNumber(),
      totalApproved: state.totalApproved.toNumber(),
      totalRejected: state.totalRejected.toNumber(),
      totalExecuted: state.totalExecuted.toNumber(),
    };
  }

  async getPolicyState(): Promise<PolicyState> {
    const state = await this.program.account.firewallState.fetch(this.firewallPda);
    return {
      paused: state.paused,
      whitelistEnabled: state.whitelistEnabled,
      globalMaxPayment: state.globalMaxPayment.toNumber(),
      globalDailyLimit: state.globalDailyLimit.toNumber(),
      minPaymentInterval: state.minPaymentInterval.toNumber(),
      owner: state.owner.toBase58(),
    };
  }

  async getDailyRemaining(sender: PublicKey): Promise<number> {
    const [dailyPda] = PublicKey.findProgramAddressSync(
      [DAILY_SEED, sender.toBuffer()],
      this.program.programId
    );

    try {
      const daily = await this.program.account.dailyTracker.fetch(dailyPda);
      const state = await this.program.account.firewallState.fetch(this.firewallPda);
      const spent = daily.totalSpent.toNumber();
      const limit = state.globalDailyLimit.toNumber();
      return Math.max(0, limit - spent);
    } catch {
      return this.getPolicyState().then((p) => p.globalDailyLimit);
    }
  }

  async isPaused(): Promise<boolean> {
    const state = await this.program.account.firewallState.fetch(this.firewallPda);
    return state.paused;
  }

  // ─── Admin ────────────────────────────────────────

  async pause(): Promise<string> {
    return this.program.methods
      .pause()
      .accounts({
        firewallState: this.firewallPda,
        owner: this.wallet.publicKey,
      })
      .rpc();
  }

  async unpause(): Promise<string> {
    return this.program.methods
      .unpause()
      .accounts({
        firewallState: this.firewallPda,
        owner: this.wallet.publicKey,
      })
      .rpc();
  }

  async setGlobalMaxPayment(lamports: number): Promise<string> {
    return this.program.methods
      .setGlobalMaxPayment(new BN(lamports))
      .accounts({
        firewallState: this.firewallPda,
        owner: this.wallet.publicKey,
      })
      .rpc();
  }

  async blockSender(sender: PublicKey, blocked: boolean): Promise<string> {
    return this.program.methods
      .blockSender(sender, blocked)
      .accounts({
        firewallState: this.firewallPda,
        owner: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async blacklistRecipient(
    recipient: PublicKey,
    blacklisted: boolean
  ): Promise<string> {
    return this.program.methods
      .blacklistRecipient(recipient, blacklisted)
      .accounts({
        firewallState: this.firewallPda,
        owner: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async addAgent(agent: PublicKey): Promise<string> {
    return this.program.methods
      .addAgent(agent)
      .accounts({
        firewallState: this.firewallPda,
        owner: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }
}

// Export everything
export { PublicKey, SystemProgram, Connection, BN };
