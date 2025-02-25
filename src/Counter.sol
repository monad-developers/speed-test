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
