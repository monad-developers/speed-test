import {
    http,
    createPublicClient,
    createWalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";

import assert from "assert";

import dotenv from "dotenv";
dotenv.config();  // loads .env into this process

export const RPC_URL = process.env.RPC_URL;

assert(process.env.PRIVATE_KEY, "PRIVATE_KEY is not set");
export const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
export const ACCOUNT = privateKeyToAccount(PRIVATE_KEY);

export const PUBLIC_CLIENT = createPublicClient({
    chain: monadTestnet,
    transport: http(RPC_URL, {
        batch: true,
    }),
    cacheTime: 100,  // 100ms; default is 4s which is way too long; will give confusing results for getBlockNumber etc
})

export const WALLET_CLIENT = createWalletClient({
    chain: monadTestnet,
    account:ACCOUNT,
    transport: http(RPC_URL, {
        batch: true,
    }),
    cacheTime: 100,  // 100ms; default is 4s which is way too long; will give confusing results for getBlockNumber etc
})

export async function getNonce(): Promise<number> {
    return Number(await PUBLIC_CLIENT.getTransactionCount({
        address: ACCOUNT.address,
    }))
}

export async function deployContract(
    abi: any[], 
    bytecode: `0x${string}`
): Promise<`0x${string}`> {

  const tx_hash = await WALLET_CLIENT.deployContract({
      abi: abi,
      bytecode: bytecode,
      args: [],
  })
  console.log("deploy hash", tx_hash)

  const receipt = await PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: tx_hash,
  })
  console.log("deploy receipt", receipt)

  if (!receipt.contractAddress) throw new Error("No contract address in receipt");

  console.log("contract address", receipt.contractAddress)
  
  return receipt.contractAddress;

}