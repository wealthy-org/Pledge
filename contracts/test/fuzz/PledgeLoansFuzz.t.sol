// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PledgeLoans} from "../../src/PledgeLoans.sol";
import {IPledgeLoans} from "../../src/interfaces/IPledgeLoans.sol";
import {PledgeLoansTestBase} from "../PledgeLoansTestBase.sol";
import {MockERC721} from "../mocks/MockERC721.sol";

contract PledgeLoansFuzzTest is PledgeLoansTestBase {
    PledgeLoans public pledge;
    MockERC721 public nft;

    address public owner = address(0x1);
    address public feeRecipient = address(0x2);
    address public lender = address(0x3);
    address public borrower = address(0x4);

    uint16 public constant PROTOCOL_FEE_BPS = 500;

    function setUp() public {
        vm.prank(owner);
        pledge = new PledgeLoans(owner, feeRecipient, PROTOCOL_FEE_BPS);

        nft = new MockERC721("Robinhood Genesis Pass", "RHG", "ipfs://rhg-base/");

        vm.prank(owner);
        pledge.setCollectionEnabled(address(nft), true);

        vm.deal(lender, 10_000_000 ether);
        vm.deal(borrower, 10_000_000 ether);
    }

    function testFuzz_CeilingDivisionPrecision(uint256 principalWei, uint16 termInterestBps) public pure {
        principalWei = bound(principalWei, 1 wei, 1_000_000 ether);
        termInterestBps = uint16(bound(termInterestBps, 0, 10_000));

        uint256 interestWei = (principalWei * uint256(termInterestBps) + 9999) / 10000;
        uint256 floorInterest = (principalWei * uint256(termInterestBps)) / 10000;

        assertTrue(interestWei >= floorInterest);

        if ((principalWei * uint256(termInterestBps)) % 10000 != 0) {
            assertEq(interestWei, floorInterest + 1);
        } else {
            assertEq(interestWei, floorInterest);
        }
    }

    function testFuzz_ProtocolFeeFloorDivision(
        uint256 principalWei,
        uint16 termInterestBps,
        uint16 feeBps
    ) public pure {
        principalWei = bound(principalWei, 1 wei, 1_000_000 ether);
        termInterestBps = uint16(bound(termInterestBps, 0, 10_000));
        feeBps = uint16(bound(feeBps, 0, 1000));

        uint256 interestWei = (principalWei * uint256(termInterestBps) + 9999) / 10000;
        uint256 feeWei = (interestWei * uint256(feeBps)) / 10000;

        assertTrue(feeWei <= interestWei);
    }

    function testFuzz_CreateAndAcceptOffer(
        uint256 principalWei,
        uint16 termInterestBps,
        uint8 durationSelector
    ) public {
        principalWei = bound(principalWei, 1000 wei, 5000 ether);
        termInterestBps = uint16(bound(termInterestBps, 0, 10_000));

        uint32 duration;
        uint8 durMod = durationSelector % 3;
        if (durMod == 0) duration = 7 days;
        else if (durMod == 1) duration = 14 days;
        else duration = 30 days;

        uint64 expiresAt = uint64(block.timestamp + 1 days);

        vm.prank(lender);
        uint256 offerId = pledge.createOffer{value: principalWei}(
            address(nft),
            termInterestBps,
            duration,
            expiresAt
        );

        uint256 tokenId = 1001;
        nft.mint(borrower, tokenId);

        uint256 borrowerBeforeBal = borrower.balance;

        vm.startPrank(borrower);
        nft.approve(address(pledge), tokenId);
        uint256 loanId = pledge.acceptOffer(offerId, tokenId);
        vm.stopPrank();

        assertEq(borrower.balance, borrowerBeforeBal + principalWei);
        assertEq(nft.ownerOf(tokenId), address(pledge));

        (,,,,,,, uint256 totalDueWei, uint64 dueAt, uint16 feeBpsSnapshot, LoanStatus status) = pledge.loans(loanId);
        assertEq(uint8(status), uint8(LoanStatus.Active));
        assertEq(feeBpsSnapshot, PROTOCOL_FEE_BPS);
        assertEq(dueAt, block.timestamp + duration);
        assertTrue(totalDueWei >= principalWei);
    }

    function testFuzz_RepayWithinGracePeriod(uint32 warpSeconds) public {
        uint256 principal = 10 ether;
        uint16 termInterest = 500;
        uint32 duration = 7 days;
        uint64 expiresAt = uint64(block.timestamp + 1 days);

        vm.prank(lender);
        uint256 offerId = pledge.createOffer{value: principal}(
            address(nft),
            termInterest,
            duration,
            expiresAt
        );

        uint256 tokenId = 2002;
        nft.mint(borrower, tokenId);

        vm.startPrank(borrower);
        nft.approve(address(pledge), tokenId);
        uint256 loanId = pledge.acceptOffer(offerId, tokenId);
        vm.stopPrank();

        (,,,,,,, uint256 totalDueWei,,,) = pledge.loans(loanId);

        uint256 warpTime = bound(warpSeconds, 0, duration);
        vm.warp(block.timestamp + warpTime);

        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId);

        (,,,,,,,,,, LoanStatus updatedStatus) = pledge.loans(loanId);
        assertEq(uint8(updatedStatus), uint8(LoanStatus.Repaid));
        assertEq(nft.ownerOf(tokenId), borrower);
    }
}
