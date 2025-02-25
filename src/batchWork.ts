const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).parse()

import deploymentInfo from "../deployments/deployments.json";
import {abi as CounterAbi} from "../deployments/Counter.sol/Counter.json";

import { PUBLIC_CLIENT, WALLET_CLIENT, getNonce } from "./common";


// async function deployCounter() {
//     await deployContract(CounterAbi, CounterBytecode['object'] as `0x${string}`);
// }

const callManyTimes = async (functionName: string, input: number, copies: number) => {
    const nonce = await getNonce()

    const contractAddress = deploymentInfo.addresses["Counter"] as `0x${string}`;

    const gasNeeded = await PUBLIC_CLIENT.estimateContractGas({
        address: contractAddress as `0x${string}`,
        abi: CounterAbi,
        functionName: functionName,
        args: [input],
    })
    console.log("gasNeeded", Number(gasNeeded) / 1000000, "M")

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
            console.log("tx hash", hashes[j])
            all_hashes.push(hashes[j])
        }

        if (i < batchSizes.length - 1) {
            // sleep for 400ms (i.e. until next block)
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        if (copies == 1) {
            // wait for the last tx to be mined
            const receipt = await PUBLIC_CLIENT.waitForTransactionReceipt({
                hash: hashes[hashes.length - 1],
            })

            // console.log("tx receipt", receipt)
            console.log("in block", receipt.blockNumber, "gas used", receipt.gasUsed);
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