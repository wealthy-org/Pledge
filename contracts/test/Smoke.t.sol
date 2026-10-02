// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MockGuard is ReentrancyGuard, Ownable {
    uint256 public counter;

    constructor() Ownable(msg.sender) {}

    function increment() external nonReentrant {
        counter += 1;
    }
}

contract SmokeTest is Test {
    MockGuard public mock;

    function setUp() public {
        mock = new MockGuard();
    }

    function test_SmokeDeploymentAndState() public view {
        assertEq(mock.counter(), 0);
        assertEq(mock.owner(), address(this));
    }

    function test_SmokeIncrement() public {
        mock.increment();
        assertEq(mock.counter(), 1);
    }
}
