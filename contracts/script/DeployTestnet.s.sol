pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {PledgeLoans} from "../src/PledgeLoans.sol";
import {MockERC721} from "../test/mocks/MockERC721.sol";

contract DeployTestnet is Script {
    function run() external returns (address pledgeLoansAddress, address[] memory nftAddresses) {
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0));
        address deployer = deployerPrivateKey != 0 ? vm.addr(deployerPrivateKey) : msg.sender;

        address feeRecipient = vm.envOr("PROTOCOL_FEE_RECIPIENT", deployer);
        uint16 initialFeeBps = uint16(vm.envOr("INITIAL_PROTOCOL_FEE_BPS", uint256(200)));

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        MockERC721 rhg = new MockERC721("Robinhood Genesis Pass", "RHG", "ipfs://bafybeihrhgpass/");
        MockERC721 sfr = new MockERC721("Sherwood Forest Rangers", "SFR", "ipfs://bafybeishrfpass/");
        MockERC721 ngp = new MockERC721("Nottingham Guild Pledges", "NGP", "ipfs://bafybeingppass/");

        PledgeLoans pledge = new PledgeLoans(deployer, feeRecipient, initialFeeBps);

        pledge.setCollectionEnabled(address(rhg), true);
        pledge.setCollectionEnabled(address(sfr), true);
        pledge.setCollectionEnabled(address(ngp), true);

        vm.stopBroadcast();

        pledgeLoansAddress = address(pledge);

        nftAddresses = new address[](3);
        nftAddresses[0] = address(rhg);
        nftAddresses[1] = address(sfr);
        nftAddresses[2] = address(ngp);

        console2.log("PledgeLoans deployed at:", pledgeLoansAddress);
        console2.log("RHG deployed at:", address(rhg));
        console2.log("SFR deployed at:", address(sfr));
        console2.log("NGP deployed at:", address(ngp));
    }
}
