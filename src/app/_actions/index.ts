'use server'

import { monadTestnet } from "viem/chains";
import { addresses as ADDRESSES } from "../../../deployments/deployments.json";
import {abi as CounterAbi} from "../../../deployments/Counter.sol/Counter.json";

import { PUBLIC_CLIENT, WALLET_CLIENT, ACCOUNT, getNonce } from "../../common";


export async function getPublicKey() {
  return ACCOUNT.address
}

export async function getSenderBalance() {
  const balance =
    Number(
      await PUBLIC_CLIENT.getBalance({
        address: ACCOUNT.address,
      })
    ) /
    10 ** 18
  return balance.toFixed(3)
}

export async function getLinkToTransaction(txHash: string) {
  const txUrl = monadTestnet.blockExplorers?.default?.url + '/tx/' + txHash
  return `tx hash: <a href="${txUrl}" target="_blank">${txHash}</a>`
}


export async function callManyTimes (functionName: string, input: number, copies: number) {

  const output = []

  const nonce = await getNonce()
  const contractAddress = ADDRESSES["Counter"] as `0x${string}`;

  let gasNeeded = BigInt(0)
  try {
    gasNeeded = await PUBLIC_CLIENT.estimateContractGas({
        address: contractAddress as `0x${string}`,
        abi: CounterAbi,
        functionName: functionName,
        args: [input],
    })
    console.log("gasNeeded", Number(gasNeeded) / 1000000, "M")
  } catch (error) {
    output.push("error estimating gas: " + error)
    return output;
  }

  if (Number(gasNeeded) > 150_000_000) {
    output.push("gasNeeded for one transaction is above block gas limit (150M); please pick a smaller number")
    return output;
  }

  const numPerBlock = Math.floor(150_000_000 / Number(gasNeeded))

  const batchSizes = []
  let needed = copies
  while(needed > 0) {
      const count = Math.min(needed, numPerBlock)
      batchSizes.push(count)
      needed -= count
  }

  if (copies > 1) {
      console.log("batching:", batchSizes)
  }

  let offset = 0
  const all_hashes = []
  for( let i=0; i < batchSizes.length; i++) {
      const batchSize = batchSizes[i]
      const transactions = Array(Number(batchSize)).fill(null).map(async (_, j) => {
          return await WALLET_CLIENT.writeContract({
              address: contractAddress as `0x${string}`,
              abi: CounterAbi,
              functionName: functionName,
              args: [input],
              gas: gasNeeded,
              nonce: nonce + offset + j,
          });
      });

      offset += batchSize

      const hashes = await Promise.all(transactions);
      for( let j=0; j < batchSize; j++) {
          output.push(await getLinkToTransaction(hashes[j]))
          all_hashes.push(hashes[j])
      }

      if (i < batchSizes.length - 1) {
          // sleep for 400ms (i.e. until next block)
          await new Promise(resolve => setTimeout(resolve, 400));
      }
  }

  return output
}
