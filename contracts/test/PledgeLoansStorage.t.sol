// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PledgeLoans} from "../src/PledgeLoans.sol";
import {IPledgeLoans} from "../src/interfaces/IPledgeLoans.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract PledgeLoansStorageTest is Test {
    PledgeLoans public pledgeLoans;
    address public admin = address(0xAD01);
    address public feeRecipient = address(0xFEE);
    address public nonAdmin = address(0x9999);

    function setUp() public {
        pledgeLoans = new PledgeLoans(admin, feeRecipient, 250);
    }

    function test_InitialStateAndConstants() public view {
        assertEq(pledgeLoans.owner(), admin);
        assertEq(pledgeLoans.protocolFeeRecipient(), feeRecipient);
        assertEq(pledgeLoans.protocolFeeBps(), 250);
        assertEq(pledgeLoans.nextOfferId(), 1);
        assertEq(pledgeLoans.nextLoanId(), 1);
        assertFalse(pledgeLoans.newActivityPaused());

        assertEq(pledgeLoans.MAX_TERM_INTEREST_BPS(), 10_000);
        assertEq(pledgeLoans.MAX_PROTOCOL_FEE_BPS(), 1_000);
    }

    function test_InitialClaimableBalancesAreZero() public view {
        assertEq(pledgeLoans.claimableProceeds(admin), 0);
        assertEq(pledgeLoans.claimableProceeds(feeRecipient), 0);
        assertEq(pledgeLoans.claimableProceeds(nonAdmin), 0);
    }

    function test_IERC721ReceiverImplemented() public view {
        bytes4 expectedSelector = IERC721Receiver.onERC721Received.selector;
        bytes4 returnedSelector = pledgeLoans.onERC721Received(address(0), address(0), 1, "");
        assertEq(returnedSelector, expectedSelector);
    }

    function test_ConstructorRevertsOnInvalidFeeRecipient() public {
        vm.expectRevert(IPledgeLoans.InvalidFeeRecipient.selector);
        new PledgeLoans(admin, address(0), 250);
    }

    function test_ConstructorRevertsOnExcessiveFeeBps() public {
        vm.expectRevert(abi.encodeWithSelector(IPledgeLoans.InvalidFeeBps.selector, 1001));
        new PledgeLoans(admin, feeRecipient, 1001);
    }
}
