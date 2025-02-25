const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).parse()

import { addresses as ADDRESSES } from "../deployments/deployments.json";
import {abi as CounterAbi, bytecode as CounterBytecode} from "../out/Counter.sol/Counter.json";

import { deployContract, PUBLIC_CLIENT, WALLET_CLIENT, getNonce } from "./common";


async function deployCounter() {
    await deployContract(CounterAbi, CounterBytecode['object'] as `0x${string}`);
}


// note: uses static address mapping from deployments.json
async function incrementManyTimes(input: number) {
    const contractAddress = ADDRESSES["Counter"] as `0x${string}`;

    console.log("calling incrementMany", input, "times");

    const gasNeeded = await PUBLIC_CLIENT.estimateContractGas({
        address: contractAddress,
        abi: CounterAbi,
        functionName: "incrementMany",
        args: [input],
    });

    console.log("gas needed", Number(gasNeeded) / 1_000_000, "M");

    const nonce = await getNonce();

    const before = Date.now();
    const tx = await WALLET_CLIENT.writeContract({
        address: contractAddress,
        abi: CounterAbi,
        functionName: "incrementMany",
        args: [input],
        gas: gasNeeded,
        nonce: nonce,
    });

    console.log("tx hash", tx);

    const receipt = await PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: tx,
    });

    console.log("in block", receipt.blockNumber);

    const after = Date.now();
    console.log("time taken:", (after - before) / 1000, "s");
}

async function main() {
    const input = Number(argv.input ?? 100);

    if (argv.deploy) {
        await deployCounter();
        return;
    }

    await incrementManyTimes(input);
}

main();