// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PledgeLoans} from "../src/PledgeLoans.sol";
import {IPledgeLoans} from "../src/interfaces/IPledgeLoans.sol";
import {MockERC721} from "./mocks/MockERC721.sol";
import {MaliciousReceiver} from "./mocks/MaliciousReceiver.sol";

contract AcceptOfferTest is Test, IPledgeLoans {
    PledgeLoans public pledgeLoans;
    MockERC721 public nft;
    MaliciousReceiver public malicious;

    address public admin = address(0xAD01);
    address public feeRecipient = address(0xFEE);
    address public lender = address(0x1E4D);
    address public borrower = address(0xB0B);

    function setUp() public {
        pledgeLoans = new PledgeLoans(admin, feeRecipient, 250);
        nft = new MockERC721("Robinhood Genesis Pass", "RHG", "https://api.pledge.xyz/rhg");
        malicious = new MaliciousReceiver();

        vm.prank(admin);
        pledgeLoans.setCollectionEnabled(address(nft), true);

        vm.deal(lender, 100 ether);
        vm.deal(borrower, 10 ether);

        nft.mint(borrower, 1);
        nft.mint(borrower, 2);
    }

    function test_AcceptOfferHappyPath() public {
        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 2 ether}(
            address(nft),
            500,
            14 days,
            uint64(block.timestamp + 2 days)
        );

        vm.startPrank(borrower);
        nft.approve(address(pledgeLoans), 1);

        uint256 borrowerPreBalance = borrower.balance;

        vm.expectEmit(true, true, true, true);
        emit OfferFilled(offerId, 1, borrower, 1);

        uint256 expectedInterest = (uint256(2 ether) * 500 + 9999) / 10000;
        uint256 expectedTotalDue = 2 ether + expectedInterest;
        uint64 expectedDueAt = uint64(block.timestamp + 14 days);

        vm.expectEmit(true, true, true, true);
        emit LoanStarted(
            1,
            offerId,
            borrower,
            lender,
            address(nft),
            1,
            2 ether,
            expectedInterest,
            expectedTotalDue,
            expectedDueAt,
            250
        );

        uint256 loanId = pledgeLoans.acceptOffer(offerId, 1);
        vm.stopPrank();

        assertEq(loanId, 1);
        assertEq(pledgeLoans.nextLoanId(), 2);
        assertEq(borrower.balance, borrowerPreBalance + 2 ether);
        assertEq(nft.ownerOf(1), address(pledgeLoans));
        assertTrue(pledgeLoans.isTokenInCollateral(address(nft), 1));

        (
            uint256 storedOfferId,
            address storedBorrower,
            address storedLender,
            address storedCollection,
            uint256 storedTokenId,
            uint256 storedPrincipal,
            uint256 storedInterest,
            uint256 storedTotalDue,
            uint64 storedDueAt,
            uint16 storedFeeBps,
            LoanStatus storedStatus
        ) = pledgeLoans.loans(1);

        assertEq(storedOfferId, offerId);
        assertEq(storedBorrower, borrower);
        assertEq(storedLender, lender);
        assertEq(storedCollection, address(nft));
        assertEq(storedTokenId, 1);
        assertEq(storedPrincipal, 2 ether);
        assertEq(storedInterest, expectedInterest);
        assertEq(storedTotalDue, expectedTotalDue);
        assertEq(storedDueAt, expectedDueAt);
        assertEq(storedFeeBps, 250);
        assertEq(uint8(storedStatus), uint8(LoanStatus.Active));

        (, , , , , , , OfferStatus offerStatus) = pledgeLoans.offers(offerId);
        assertEq(uint8(offerStatus), uint8(OfferStatus.Filled));
    }

    function test_DoubleFillPreventionReverts() public {
        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 1 ether}(
            address(nft),
            500,
            7 days,
            uint64(block.timestamp + 1 days)
        );

        vm.startPrank(borrower);
        nft.approve(address(pledgeLoans), 1);
        pledgeLoans.acceptOffer(offerId, 1);

        nft.approve(address(pledgeLoans), 2);
        vm.expectRevert(abi.encodeWithSelector(OfferNotOpen.selector, offerId));
        pledgeLoans.acceptOffer(offerId, 2);
        vm.stopPrank();
    }

    function test_DoubleCollateralPreventionReverts() public {
        vm.prank(lender);
        uint256 offer1 = pledgeLoans.createOffer{value: 1 ether}(
            address(nft),
            500,
            7 days,
            uint64(block.timestamp + 1 days)
        );

        vm.prank(lender);
        uint256 offer2 = pledgeLoans.createOffer{value: 1 ether}(
            address(nft),
            500,
            7 days,
            uint64(block.timestamp + 1 days)
        );

        vm.startPrank(borrower);
        nft.approve(address(pledgeLoans), 1);
        pledgeLoans.acceptOffer(offer1, 1);

        vm.expectRevert(abi.encodeWithSelector(TokenAlreadyInCollateral.selector, address(nft), 1));
        pledgeLoans.acceptOffer(offer2, 1);
        vm.stopPrank();
    }

    function test_AtomicRollbackOnETHFail() public {
        nft.mint(address(malicious), 99);

        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 1 ether}(
            address(nft),
            500,
            7 days,
            uint64(block.timestamp + 1 days)
        );

        vm.expectRevert(TransferFailed.selector);
        malicious.acceptLoan(pledgeLoans, nft, offerId, 99);

        assertEq(nft.ownerOf(99), address(malicious));
        assertFalse(pledgeLoans.isTokenInCollateral(address(nft), 99));

        (, , , , , , , OfferStatus offerStatus) = pledgeLoans.offers(offerId);
        assertEq(uint8(offerStatus), uint8(OfferStatus.Open));
    }

    function test_ExpiredOfferReverts() public {
        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 1 ether}(
            address(nft),
            500,
            7 days,
            uint64(block.timestamp + 1 days)
        );

        vm.warp(block.timestamp + 1 days + 1 seconds);

        vm.startPrank(borrower);
        nft.approve(address(pledgeLoans), 1);
        vm.expectRevert(abi.encodeWithSelector(OfferExpired.selector, offerId));
        pledgeLoans.acceptOffer(offerId, 1);
        vm.stopPrank();
    }

    function test_CeilingDivisionInterestCalculation() public {
        uint256 principal = 10001;
        uint16 interestBps = 100;

        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: principal}(
            address(nft),
            interestBps,
            7 days,
            uint64(block.timestamp + 1 days)
        );

        vm.startPrank(borrower);
        nft.approve(address(pledgeLoans), 1);
        uint256 loanId = pledgeLoans.acceptOffer(offerId, 1);
        vm.stopPrank();

        (, , , , , , uint256 interestWei, , , , ) = pledgeLoans.loans(loanId);
        uint256 expectedCeil = (uint256(10001) * 100 + 9999) / 10000;
        assertEq(interestWei, expectedCeil);
        assertEq(interestWei, 101);
    }

    function test_NotTokenOwnerReverts() public {
        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 1 ether}(
            address(nft),
            500,
            7 days,
            uint64(block.timestamp + 1 days)
        );

        vm.prank(lender);
        vm.expectRevert(abi.encodeWithSelector(NotTokenOwner.selector, address(nft), 1));
        pledgeLoans.acceptOffer(offerId, 1);
    }

    function test_AcceptOfferRevertsOnDisabledCollection() public {
        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 1 ether}(
            address(nft),
            500,
            7 days,
            uint64(block.timestamp + 1 days)
        );

        vm.prank(admin);
        pledgeLoans.setCollectionEnabled(address(nft), false);

        vm.startPrank(borrower);
        nft.approve(address(pledgeLoans), 1);
        vm.expectRevert(abi.encodeWithSelector(CollectionNotAllowed.selector, address(nft)));
        pledgeLoans.acceptOffer(offerId, 1);
        vm.stopPrank();
    }
}
