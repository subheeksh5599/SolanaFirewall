import { Connection, PublicKey, SystemProgram, Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";
import { createHash } from "crypto";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("56hwxWZ1K1K6wCqGozkF1VTmUxSiWD1DYxm54F9U57EA");
const conn = new Connection("https://api.devnet.solana.com", "confirmed");
const raw = JSON.parse(fs.readFileSync(process.env.HOME + "/.config/solana/id.json", "utf-8"));
const kp = Keypair.fromSecretKey(Uint8Array.from(raw));
console.log("Pubkey:", kp.publicKey.toBase58());

const FIREWALL_SEED = Buffer.from("firewall-state");
const [firewallPda] = PublicKey.findProgramAddressSync([FIREWALL_SEED], PROGRAM_ID);

const ai = await conn.getAccountInfo(firewallPda);
if (ai && ai.data.length > 0) {
  console.log("Already initialized at", firewallPda.toBase58());
  process.exit(0);
}

const hash = createHash("sha256").update("global:initialize").digest();
const discriminator = hash.slice(0, 8);

const ix = new TransactionInstruction({
  keys: [
    { pubkey: firewallPda, isSigner: false, isWritable: true },
    { pubkey: kp.publicKey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  programId: PROGRAM_ID,
  data: Buffer.from(discriminator),
});

const tx = new Transaction().add(ix);
tx.feePayer = kp.publicKey;
tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash;
tx.sign(kp);

const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: true });
console.log("TX:", sig);
await new Promise(r => setTimeout(r, 6000));
const status = await conn.getSignatureStatuses([sig]);
console.log("Status:", JSON.stringify(status?.value[0]));
const ai2 = await conn.getAccountInfo(firewallPda);
if (ai2) console.log("Firewall initialized! PDA:", firewallPda.toBase58(), "Size:", ai2.data.length);
else console.log("Init might have failed");
