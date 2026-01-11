import { ethers } from "ethers";
import dotenv from "dotenv";
import { log } from "./logger.js";
import { contractABI } from "./contractABI.js";

dotenv.config();

const provider = new ethers.WebSocketProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const FLUSH_REWARDER = "0x7c9a7130379f1b5dd6e7a53af84fc0fe32267b65";
const flushRewarder = new ethers.Contract(
  FLUSH_REWARDER,
  contractABI,
  wallet
);

let sending = false;
const SEND_TIMEOUT_MS = 8_000;

log("BOT_STARTED");
console.log("BOT_STARTED");

provider.on("block", async (blockNumber) => {
  if (sending) return;
  sending = true;

  const timeout = setTimeout(() => {
    log("SEND_TIMEOUT_RESET");
    console.log("SEND_TIMEOUT_RESET");
    sending = false;
  }, SEND_TIMEOUT_MS);

  try {
    const fee = await provider.getFeeData();

    if (!fee.maxFeePerGas || !fee.maxPriorityFeePerGas) {
      log("GAS_DATA_UNAVAILABLE");
      console.log("GAS_DATA_UNAVAILABLE");
      return;
    }

    log(`ATTEMPT_FLUSH | block ${blockNumber}`);
    console.log(`ATTEMPT_FLUSH | block ${blockNumber}`);

    const tx = await flushRewarder["flushEntryQueue()"]({
      gasLimit: 250_000,
      maxFeePerGas: fee.maxFeePerGas * 2n,
      maxPriorityFeePerGas: fee.maxPriorityFeePerGas * 2n
    });

    const msg = `FLUSH_SENT | block ${blockNumber} | tx ${tx.hash}`;
    log(msg);
    console.log(msg);
  } catch (e) {
    const err = `ERROR | ${e.message}`;
    log(err);
    console.log(err);
  } finally {
    clearTimeout(timeout);
    sending = false;
  }
});

// Restart bot on WS death (pm2 will restart)
provider._websocket?.on("close", () => {
  log("WS_CLOSED");
  console.log("WS_CLOSED");
  process.exit(1);
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
