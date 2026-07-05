import { Connection, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("56hwxWZ1K1K6wCqGozkF1VTmUxSiWD1DYxm54F9U57EA");
const conn = new Connection("https://api.devnet.solana.com", "confirmed");

const kp = Keypair.generate();
const sig = await conn.requestAirdrop(kp.publicKey, 200000000);
await conn.confirmTransaction(sig);
console.log("Funded:", kp.publicKey.toBase58());

const wallet = new Wallet(kp);
const provider = new AnchorProvider(conn, wallet, {});
const IDL_RAW = fs.readFileSync("../target/deploy/x402_firewall.json", "utf-8");
const IDL = JSON.parse(IDL_RAW);
const program = new Program(IDL, PROGRAM_ID, provider);

const FIREWALL_SEED = Buffer.from("firewall-state");
const [firewallPda] = PublicKey.findProgramAddressSync([FIREWALL_SEED], PROGRAM_ID);

const tx = await program.methods.initialize()
  .accounts({ firewallState: firewallPda, owner: kp.publicKey, systemProgram: SystemProgram.programId })
  .signers([kp]).rpc();
console.log("Initialized! TX:", tx);
console.log("Firewall PDA:", firewallPda.toBase58());
console.log("Owner:", kp.publicKey.toBase58());
