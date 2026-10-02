// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PledgeLoans} from "../src/PledgeLoans.sol";
import {IPledgeLoans} from "../src/interfaces/IPledgeLoans.sol";
import {MockERC721} from "./mocks/MockERC721.sol";
import {ReentrancyAttacker} from "./mocks/ReentrancyAttacker.sol";
import {MaliciousReceiver} from "./mocks/MaliciousReceiver.sol";

contract WithdrawProceedsTest is Test, IPledgeLoans {
    PledgeLoans public pledge;
    MockERC721 public nft;

    address public owner = address(0x1);
    address public feeRecipient = address(0x2);
    address public lender = address(0x3);
    address public borrower = address(0x4);

    uint16 public constant PROTOCOL_FEE_BPS = 1000;
    uint256 public constant PRINCIPAL = 2 ether;
    uint16 public constant TERM_INTEREST_BPS = 500;
    uint32 public constant DURATION = 7 days;

    function setUp() public {
        vm.prank(owner);
        pledge = new PledgeLoans(owner, feeRecipient, PROTOCOL_FEE_BPS);

        nft = new MockERC721("Robinhood Genesis Pass", "RHG", "ipfs://rhg-base/");

        vm.prank(owner);
        pledge.setCollectionEnabled(address(nft), true);

        vm.deal(lender, 20 ether);
        vm.deal(borrower, 20 ether);
    }

    function _createAndRepayLoan(uint256 tokenId) internal returns (uint256 totalDueWei, uint256 lenderAmount, uint256 feeWei) {
        nft.mint(borrower, tokenId);

        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.prank(lender);
        uint256 offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.startPrank(borrower);
        nft.approve(address(pledge), tokenId);
        uint256 loanId = pledge.acceptOffer(offerId, tokenId);
        vm.stopPrank();

        (,,,,,, uint256 interestWei, uint256 dueWei,,, ) = pledge.loans(loanId);
        totalDueWei = dueWei;
        feeWei = (interestWei * uint256(PROTOCOL_FEE_BPS)) / 10000;
        lenderAmount = totalDueWei - feeWei;

        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId);
    }

    function test_HappyPathWithdraw() public {
        (, uint256 lenderAmount, uint256 feeWei) = _createAndRepayLoan(1);

        assertEq(pledge.claimableProceeds(lender), lenderAmount);
        assertEq(pledge.claimableProceeds(feeRecipient), feeWei);

        uint256 lenderInitialBal = lender.balance;

        vm.expectEmit(true, false, false, true, address(pledge));
        emit ProceedsWithdrawn(lender, lenderAmount);

        vm.prank(lender);
        pledge.withdrawProceeds();

        assertEq(pledge.claimableProceeds(lender), 0);
        assertEq(lender.balance, lenderInitialBal + lenderAmount);
    }

    function test_ZeroBalanceReverts() public {
        assertEq(pledge.claimableProceeds(lender), 0);

        vm.prank(lender);
        vm.expectRevert(NoClaimableBalance.selector);
        pledge.withdrawProceeds();
    }

    function test_MultipleLoansAccumulation() public {
        uint256 totalExpectedLender = 0;
        uint256 totalExpectedFee = 0;

        for (uint256 i = 1; i <= 3; i++) {
            (, uint256 lenderAmount, uint256 feeWei) = _createAndRepayLoan(i);
            totalExpectedLender += lenderAmount;
            totalExpectedFee += feeWei;
        }

        assertEq(pledge.claimableProceeds(lender), totalExpectedLender);
        assertEq(pledge.claimableProceeds(feeRecipient), totalExpectedFee);

        uint256 feeRecipientInitialBal = feeRecipient.balance;

        vm.expectEmit(true, false, false, true, address(pledge));
        emit ProceedsWithdrawn(feeRecipient, totalExpectedFee);

        vm.prank(feeRecipient);
        pledge.withdrawProceeds();

        assertEq(pledge.claimableProceeds(feeRecipient), 0);
        assertEq(feeRecipient.balance, feeRecipientInitialBal + totalExpectedFee);

        uint256 lenderInitialBal = lender.balance;
        vm.prank(lender);
        pledge.withdrawProceeds();

        assertEq(pledge.claimableProceeds(lender), 0);
        assertEq(lender.balance, lenderInitialBal + totalExpectedLender);
    }

    function test_ReentrancySafety() public {
        ReentrancyAttacker attacker = new ReentrancyAttacker(address(pledge));
        nft.mint(borrower, 999);

        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.deal(address(attacker), 10 ether);

        vm.prank(address(attacker));
        uint256 offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.startPrank(borrower);
        nft.approve(address(pledge), 999);
        uint256 loanId = pledge.acceptOffer(offerId, 999);
        vm.stopPrank();

        (,,,,,,, uint256 totalDueWei,,,) = pledge.loans(loanId);
        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId);

        uint256 attackerProceeds = pledge.claimableProceeds(address(attacker));
        assertTrue(attackerProceeds > 0);

        vm.prank(address(attacker));
        vm.expectRevert();
        pledge.withdrawProceeds();
    }

    function test_UnpayableReceiverRevertsOnWithdraw() public {
        MaliciousReceiver unpayableContract = new MaliciousReceiver();
        nft.mint(borrower, 888);

        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.deal(address(unpayableContract), 10 ether);

        vm.prank(address(unpayableContract));
        uint256 offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.startPrank(borrower);
        nft.approve(address(pledge), 888);
        uint256 loanId = pledge.acceptOffer(offerId, 888);
        vm.stopPrank();

        (,,,,,,, uint256 totalDueWei,,,) = pledge.loans(loanId);
        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId);

        vm.prank(address(unpayableContract));
        vm.expectRevert(TransferFailed.selector);
        pledge.withdrawProceeds();
    }
}
