# monad speed-test

Quick examples + webapp to show Monad's throughput

## Setup

### Build contracts

```shell
$ forge build
```

### Setup `.env`

Create new private key
```
cast wallet new | grep 'Private key:' | awk '{print $3}'
```

Populate `.env`:
```
PRIVATE_KEY=
```

Also put the private key in keystore for convenience when using foundry directly
```
cast wallet import monad-deployer --private-key $(echo $PRIVATE_KEY)
```


## Background

### Counter.sol

`Counter.sol` looks like this:

```
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 public number;
    uint256[] public arr;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }

    function incrementMany(uint256 times) public {
        for (uint256 i = 0; i < times; i++) {
            increment();
        }
    }

    function pushMany(uint256 count) public {
        for (uint256 i = 0; i < count; i++) {
            arr.push(i);
        }
    }

    function freeMany(uint256 count) public {
        for (uint256 i = 0; i < count; i++) {
            arr.pop();
        }
    }
}
```

A verified deployment is at [0x0bff87e80fbbeb934b79990eaeb535e549ad078d](https://testnet.monadexplorer.com/address/0x0bff87e80fbbeb934b79990eaeb535e549ad078d). For instructions on re-deploying, see [deploy.md](deploy.md).

## Tests in your terminal

### Call incrementMany(400000) to fill 1 Monad block (150M gas)

```shell
$ npm run simple-increment -- --input=400000

> speed-test@1.0.0 simple-increment
> ts-node src/simpleIncrement.ts --input=400000

calling incrementMany 400000 times
gas needed 141.540818 M
tx hash 0x5831001c72b12b9c438de9288cf143d381cb5d798e4d0cb588226bf739b5bb7b
in block 4967765n
time taken: 1.761 s
```

See this transaction on the block explorer [here](https://testnet.monadexplorer.com/tx/0x5831001c72b12b9c438de9288cf143d381cb5d798e4d0cb588226bf739b5bb7b)


### Call incrementMany(10000) many times to fill a few Monad blocks

```shell
$ npm run batch-work -- --functionName=incrementMany --input=10000 --copies=100

> speed-test@1.0.0 batch-work
> ts-node src/batchWork.ts --functionName=incrementMany --input=10000 --copies=100

calling Counter. incrementMany with input 10000 , copies,  100
gasNeeded 3.564377 M
batching: [ 42, 42, 16 ]
tx hash 0xb441c591ee33c9931a8f48553594a77eca40667b65782e8a9e2aef9f40ef5131
tx hash 0xe96ba4194ebbf22cac5a980856efebbebbe5f224f003d57a9cf803cb371667cb
tx hash 0x9ef2ab303dae3d7fac5cb03f45e3624aac7237fa38f3dae8d7c07e4998ecfef0
tx hash 0x07f4c27f493b08c2a6caef0e022067bf12e97c265436dcf5e03ed87721129e67
tx hash 0x7f714d60b45c656b699fe3a8450e276fb1f6ac7556e5d45709ef7e40ce835aa9
tx hash 0x36b234a399b34e4202b7ed3dc3836d74ed164faabf4fb5adad7a6f15edd18910
...
tx hash 0xfaec1d39dc63e9cd6dba3ab851273d665396c05a1d4c36ae7dfba11ca06ffe40
```


## Webapp

Built with `create-next-app`

To start the server:
```
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.