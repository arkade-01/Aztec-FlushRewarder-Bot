import { ethers } from "ethers";
import dotenv from "dotenv";
import { log } from "./logger.js"; // your file logger
import { contractABI } from "./contractABI.js";

dotenv.config();

// WebSocket provider
const provider = new ethers.WebSocketProvider(process.env.RPC_URL);

// Wallet
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract
const FLUSH_REWARDER = "0x7c9a7130379f1b5dd6e7a53af84fc0fe32267b65";
const flushRewarder = new ethers.Contract(
  FLUSH_REWARDER,
  contractABI,
  wallet
);

let sending = false;

// Bot start
log("BOT_STARTED");
console.log("BOT_STARTED");

// Listen for new blocks
provider.on("block", async (blockNumber) => {
  if (sending) return;
  sending = true;

  try {
    const fee = await provider.getFeeData();

    // Call the no-argument flushEntryQueue()
    const tx = await flushRewarder["flushEntryQueue()"]({
      gasLimit: 250_000,
      maxFeePerGas: fee.maxFeePerGas * 2n,
      maxPriorityFeePerGas: fee.maxPriorityFeePerGas * 2n
    });

    // Log both to file and console
    const message = `FLUSH_SENT | block ${blockNumber} | tx ${tx.hash}`;
    log(message);
    console.log(message);
  } catch (e) {
    const errorMsg = `ERROR | ${e.message}`;
    log(errorMsg);
    console.log(errorMsg);
  } finally {
    sending = false;
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  log("BOT_STOPPED (SIGINT)");
  console.log("BOT_STOPPED (SIGINT)");
  process.exit();
});

process.on("SIGTERM", () => {
  log("BOT_STOPPED (SIGTERM)");
  console.log("BOT_STOPPED (SIGTERM)");
  process.exit();
});
