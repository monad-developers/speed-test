const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).parse()

import { addresses as ADDRESSES } from "../deployments/deployments.json";
import {abi as CounterAbi, bytecode as CounterBytecode} from "../deployments/Counter.sol/Counter.json";

import { deployContract, PUBLIC_CLIENT, WALLET_CLIENT, getNonce } from "./common";


async function deployCounter() {
    await deployContract(CounterAbi, CounterBytecode['object'] as `0x${string}`);
}

const callManyTimes = async (functionName: string, input: number, copies: number) => {
    const nonce = await getNonce()

    const contractAddress = ADDRESSES["Counter"] as `0x${string}`;

    const gasNeeded = await PUBLIC_CLIENT.estimateContractGas({
        address: contractAddress as `0x${string}`,
        abi: CounterAbi,
        functionName: functionName,
        args: [input],
    })
    console.log("gasNeeded", Number(gasNeeded) / 1000000, "M")

    const numPerBlock = Math.floor(150_000_000 / Number(gasNeeded))

    let batchSizes = []
    let needed = copies
    while(needed > 0) {
        let count = Math.min(needed, numPerBlock)
        batchSizes.push(count)
        needed -= count
    }

    if (copies > 1) {
        console.log("batching:", batchSizes)
    }

    let offset = 0
    let all_hashes = []
    for( let i=0; i < batchSizes.length; i++) {
        let batchSize = batchSizes[i]
        let transactions = Array(Number(batchSize)).fill(null).map(async (_, j) => {
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

        let hashes = await Promise.all(transactions);
        for( let j=0; j < batchSize; j++) {
            console.log("tx hash", hashes[j])
            all_hashes.push(hashes[j])
        }

        if (i < batchSizes.length - 1) {
            // sleep for 400ms (i.e. until next block)
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        if (copies == 1) {
            // wait for the last tx to be mined
            let receipt = await PUBLIC_CLIENT.waitForTransactionReceipt({
                hash: hashes[hashes.length - 1],
            })

            console.log("tx receipt", receipt)
        }
    }
}

async function main() {
    const functionName = argv.function ?? "incrementMany";
    const input = argv.input ?? 100;
    const copies = argv.copies ?? 1;

    console.log("calling Counter.", functionName, "with input", input, ", copies, ", copies)

    await callManyTimes(functionName, input, copies)
}

main();