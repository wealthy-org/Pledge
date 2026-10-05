// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PledgeLoans} from "../src/PledgeLoans.sol";
import {IPledgeLoans} from "../src/interfaces/IPledgeLoans.sol";
import {PledgeLoansTestBase} from "./PledgeLoansTestBase.sol";
import {MockERC721} from "./mocks/MockERC721.sol";

contract RepayForecloseTest is PledgeLoansTestBase {
    PledgeLoans public pledge;
    MockERC721 public nft;

    address public owner = address(0x1);
    address public feeRecipient = address(0x2);
    address public lender = address(0x3);
    address public borrower = address(0x4);
    address public thirdParty = address(0x5);
    address public destination = address(0x6);

    uint16 public constant PROTOCOL_FEE_BPS = 500;
    uint256 public constant PRINCIPAL = 2 ether;
    uint16 public constant TERM_INTEREST_BPS = 500;
    uint32 public constant DURATION = 7 days;

    uint256 public offerId;
    uint256 public loanId;
    uint256 public tokenId = 101;

    function setUp() public {
        vm.prank(owner);
        pledge = new PledgeLoans(owner, feeRecipient, PROTOCOL_FEE_BPS);

        nft = new MockERC721("Robinhood Genesis Pass", "RHG", "ipfs://rhg-base/");

        vm.prank(owner);
        pledge.setCollectionEnabled(address(nft), true);

        nft.mint(borrower, tokenId);

        vm.deal(lender, 10 ether);
        vm.deal(borrower, 10 ether);
        vm.deal(thirdParty, 10 ether);

        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.prank(lender);
        offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.startPrank(borrower);
        nft.approve(address(pledge), tokenId);
        loanId = pledge.acceptOffer(offerId, tokenId);
        vm.stopPrank();
    }

    function test_HappyPathRepay() public {
        (
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 interestWei,
            uint256 totalDueWei,
            ,
            uint16 feeBpsSnapshot,
            LoanStatus status
        ) = pledge.loans(loanId);

        assertEq(uint8(status), uint8(LoanStatus.Active));
        assertTrue(pledge.isTokenInCollateral(address(nft), tokenId));

        vm.warp(block.timestamp + 3 days);

        uint256 expectedFee = (interestWei * uint256(feeBpsSnapshot)) / 10000;
        uint256 expectedLenderAmount = totalDueWei - expectedFee;

        vm.expectEmit(true, true, true, true, address(pledge));
        emit LoanRepaid(
            loanId,
            borrower,
            lender,
            totalDueWei,
            expectedLenderAmount,
            expectedFee
        );

        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId);

        (,,,,,,,,,, LoanStatus updatedStatus) = pledge.loans(loanId);
        assertEq(uint8(updatedStatus), uint8(LoanStatus.Repaid));
        assertFalse(pledge.isTokenInCollateral(address(nft), tokenId));
        assertEq(nft.ownerOf(tokenId), borrower);
        assertEq(pledge.claimableProceeds(lender), expectedLenderAmount);
        assertEq(pledge.claimableProceeds(feeRecipient), expectedFee);
    }

    function test_RepayExactTimestamp() public {
        (,,,,,,, uint256 totalDueWei, uint64 dueAt,,) = pledge.loans(loanId);

        vm.warp(dueAt);

        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId);

        (,,,,,,,,,, LoanStatus updatedStatus) = pledge.loans(loanId);
        assertEq(uint8(updatedStatus), uint8(LoanStatus.Repaid));
        assertEq(nft.ownerOf(tokenId), borrower);
    }

    function test_RepayLateReverts() public {
        (,,,,,,, uint256 totalDueWei, uint64 dueAt,,) = pledge.loans(loanId);

        vm.warp(dueAt + 1);

        vm.prank(borrower);
        vm.expectRevert(
            abi.encodeWithSelector(
                LoanOverdue.selector,
                loanId,
                dueAt,
                uint64(dueAt + 1)
            )
        );
        pledge.repay{value: totalDueWei}(loanId);
    }

    function test_RepayAmountMismatchReverts() public {
        (,,,,,,, uint256 totalDueWei, uint64 dueAt,,) = pledge.loans(loanId);

        vm.warp(dueAt - 1);

        vm.prank(borrower);
        vm.expectRevert(
            abi.encodeWithSelector(
                ExactRepaymentRequired.selector,
                totalDueWei,
                totalDueWei - 1 wei
            )
        );
        pledge.repay{value: totalDueWei - 1 wei}(loanId);

        vm.prank(borrower);
        vm.expectRevert(
            abi.encodeWithSelector(
                ExactRepaymentRequired.selector,
                totalDueWei,
                totalDueWei + 1 wei
            )
        );
        pledge.repay{value: totalDueWei + 1 wei}(loanId);
    }

    function test_ThirdPartyCanRepayForBorrower() public {
        (,,,,,,, uint256 totalDueWei, uint64 dueAt,,) = pledge.loans(loanId);

        vm.warp(dueAt - 100);

        vm.prank(thirdParty);
        pledge.repay{value: totalDueWei}(loanId);

        (,,,,,,,,,, LoanStatus updatedStatus) = pledge.loans(loanId);
        assertEq(uint8(updatedStatus), uint8(LoanStatus.Repaid));
        assertEq(nft.ownerOf(tokenId), borrower);
    }

    function test_HappyPathForeclose() public {
        (,,,,,,,, uint64 dueAt,,) = pledge.loans(loanId);

        vm.warp(dueAt + 1);

        vm.expectEmit(true, true, false, true, address(pledge));
        emit LoanForeclosed(loanId, lender, destination, tokenId);

        vm.prank(lender);
        pledge.foreclose(loanId, destination);

        (,,,,,,,,,, LoanStatus updatedStatus) = pledge.loans(loanId);
        assertEq(uint8(updatedStatus), uint8(LoanStatus.Foreclosed));
        assertFalse(pledge.isTokenInCollateral(address(nft), tokenId));
        assertEq(nft.ownerOf(tokenId), destination);
    }

    function test_ForecloseEarlyReverts() public {
        (,,,,,,,, uint64 dueAt,,) = pledge.loans(loanId);

        vm.warp(dueAt);

        vm.prank(lender);
        vm.expectRevert(
            abi.encodeWithSelector(
                LoanNotDue.selector,
                loanId,
                dueAt,
                uint64(dueAt)
            )
        );
        pledge.foreclose(loanId, destination);
    }

    function test_UnauthorizedForecloseReverts() public {
        (,,,,,,,, uint64 dueAt,,) = pledge.loans(loanId);

        vm.warp(dueAt + 1);

        vm.prank(borrower);
        vm.expectRevert(Unauthorized.selector);
        pledge.foreclose(loanId, destination);

        vm.prank(thirdParty);
        vm.expectRevert(Unauthorized.selector);
        pledge.foreclose(loanId, destination);
    }

    function test_ForecloseInvalidDestinationReverts() public {
        (,,,,,,,, uint64 dueAt,,) = pledge.loans(loanId);

        vm.warp(dueAt + 1);

        vm.prank(lender);
        vm.expectRevert(InvalidDestination.selector);
        pledge.foreclose(loanId, address(0));
    }

    function test_RepayOrForecloseNonActiveLoanReverts() public {
        (,,,,,,, uint256 totalDueWei, uint64 dueAt,,) = pledge.loans(loanId);

        vm.warp(dueAt);
        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId);

        vm.warp(dueAt + 10);

        vm.prank(borrower);
        vm.expectRevert(abi.encodeWithSelector(LoanNotActive.selector, loanId));
        pledge.repay{value: totalDueWei}(loanId);

        vm.prank(lender);
        vm.expectRevert(abi.encodeWithSelector(LoanNotActive.selector, loanId));
        pledge.foreclose(loanId, destination);
    }
}
