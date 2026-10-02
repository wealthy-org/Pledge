// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {PledgeLoans} from "../src/PledgeLoans.sol";

contract DeployMainnet is Script {
    function run() external returns (address pledgeLoansAddress) {
        uint256 deployerPrivateKey = vm.envOr("MAINNET_DEPLOYER_KEY", vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0)));
        address deployer = deployerPrivateKey != 0 ? vm.addr(deployerPrivateKey) : msg.sender;

        address feeRecipient = vm.envOr("MAINNET_FEE_RECIPIENT", vm.envOr("PROTOCOL_FEE_RECIPIENT", deployer));
        uint16 initialFeeBps = uint16(vm.envOr("MAINNET_FEE_BPS", vm.envOr("INITIAL_PROTOCOL_FEE_BPS", uint256(500))));
        address multisigOwner = vm.envOr("MAINNET_MULTISIG_OWNER", deployer);

        address rhg = vm.envOr("MAINNET_RHG_COLLECTION", address(0x4444444444444444444444444444444444444444));
        address sfr = vm.envOr("MAINNET_SFR_COLLECTION", address(0x5555555555555555555555555555555555555555));
        address ngp = vm.envOr("MAINNET_NGP_COLLECTION", address(0x6666666666666666666666666666666666666666));

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        PledgeLoans pledge = new PledgeLoans(deployer, feeRecipient, initialFeeBps);

        pledge.setCollectionEnabled(rhg, true);
        pledge.setCollectionEnabled(sfr, true);
        pledge.setCollectionEnabled(ngp, true);

        if (multisigOwner != deployer && multisigOwner != address(0)) {
            pledge.transferOwnership(multisigOwner);
        }

        vm.stopBroadcast();

        pledgeLoansAddress = address(pledge);

        console2.log("PledgeLoans Mainnet deployed at:", pledgeLoansAddress);
        console2.log("Initial Fee BPS:", initialFeeBps);
        console2.log("Fee Recipient:", feeRecipient);
        console2.log("Pending Owner:", multisigOwner);
    }
}
