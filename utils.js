import { ethers } from "ethers";
import { RPC_URL, PRIVATE_KEY } from "./constants.js";

function getSigner() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(PRIVATE_KEY, provider);
}

export { getSigner };
