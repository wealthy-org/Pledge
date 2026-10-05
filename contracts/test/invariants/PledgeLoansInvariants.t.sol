// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {PledgeLoans} from "../../src/PledgeLoans.sol";
import {IPledgeLoans} from "../../src/interfaces/IPledgeLoans.sol";
import {PledgeLoansTestBase} from "../PledgeLoansTestBase.sol";
import {MockERC721} from "../mocks/MockERC721.sol";
import {PledgeLoansHandler} from "./PledgeLoansHandler.sol";

contract PledgeLoansInvariantsTest is StdInvariant, PledgeLoansTestBase {
    PledgeLoans public pledge;
    MockERC721 public nft;
    PledgeLoansHandler public handler;

    address public owner = address(0x1);
    address public feeRecipient = address(0x2);
    uint16 public constant PROTOCOL_FEE_BPS = 500;

    function setUp() public {
        vm.prank(owner);
        pledge = new PledgeLoans(owner, feeRecipient, PROTOCOL_FEE_BPS);

        nft = new MockERC721("Robinhood Genesis Pass", "RHG", "ipfs://rhg-base/");

        vm.prank(owner);
        pledge.setCollectionEnabled(address(nft), true);

        handler = new PledgeLoansHandler(pledge, nft, owner, feeRecipient);

        targetContract(address(handler));
    }

    function invariant_EscrowSolvency() public view {
        uint256 expectedBalance = handler.ghost_openOffersPrincipal() + handler.totalClaimableAcrossActors();
        assertEq(address(pledge).balance, expectedBalance);
    }

    function invariant_CollateralIntegrity() public view {
        assertEq(nft.balanceOf(address(pledge)), handler.ghost_activeCollateralCount());
    }

    function invariant_FeeParametersWithinBounds() public view {
        assertTrue(pledge.protocolFeeBps() <= pledge.MAX_PROTOCOL_FEE_BPS());
        assertTrue(pledge.protocolFeeRecipient() != address(0));
    }
}
