// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {PledgeLoans} from "../../src/PledgeLoans.sol";

contract ReentrancyAttacker {
    PledgeLoans public target;
    uint256 public attackCount;

    constructor(address _target) {
        target = PledgeLoans(_target);
    }

    receive() external payable {
        if (attackCount < 3) {
            attackCount++;
            target.withdrawProceeds();
        }
    }
}
