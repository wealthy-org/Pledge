// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PledgeLoans} from "../src/PledgeLoans.sol";
import {IPledgeLoans} from "../src/interfaces/IPledgeLoans.sol";
import {MockERC721} from "./mocks/MockERC721.sol";

contract EventEmissionTest is Test, IPledgeLoans {
    PledgeLoans public pledge;
    MockERC721 public nft;

    address public owner = address(0x1);
    address public feeRecipient = address(0x2);
    address public newFeeRecipient = address(0x20);
    address public lender = address(0x3);
    address public borrower = address(0x4);
    address public destination = address(0x5);

    uint16 public constant PROTOCOL_FEE_BPS = 500;
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

    function test_EmitOfferCreated() public {
        uint64 expiresAt = uint64(block.timestamp + 1 days);

        vm.expectEmit(true, true, true, true, address(pledge));
        emit OfferCreated(
            1,
            lender,
            address(nft),
            PRINCIPAL,
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt,
            PROTOCOL_FEE_BPS
        );

        vm.prank(lender);
        pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );
    }

    function test_EmitOfferCancelled() public {
        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.prank(lender);
        uint256 offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.expectEmit(true, true, false, true, address(pledge));
        emit OfferCancelled(offerId, lender, PRINCIPAL);

        vm.prank(lender);
        pledge.cancelOffer(offerId);
    }

    function test_EmitOfferFilledAndLoanStarted() public {
        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.prank(lender);
        uint256 offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        uint256 tokenId = 1;
        nft.mint(borrower, tokenId);

        uint256 interestWei = (PRINCIPAL * uint256(TERM_INTEREST_BPS) + 9999) / 10000;
        uint256 totalDueWei = PRINCIPAL + interestWei;
        uint64 dueAt = uint64(block.timestamp + DURATION);

        vm.startPrank(borrower);
        nft.approve(address(pledge), tokenId);

        vm.expectEmit(true, true, true, true, address(pledge));
        emit OfferFilled(offerId, 1, borrower, tokenId);

        vm.expectEmit(true, true, true, true, address(pledge));
        emit LoanStarted(
            1,
            offerId,
            borrower,
            lender,
            address(nft),
            tokenId,
            PRINCIPAL,
            interestWei,
            totalDueWei,
            dueAt,
            PROTOCOL_FEE_BPS
        );

        pledge.acceptOffer(offerId, tokenId);
        vm.stopPrank();
    }

    function test_EmitLoanRepaid() public {
        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.prank(lender);
        uint256 offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        uint256 tokenId = 1;
        nft.mint(borrower, tokenId);

        vm.startPrank(borrower);
        nft.approve(address(pledge), tokenId);
        uint256 loanId = pledge.acceptOffer(offerId, tokenId);
        vm.stopPrank();

        (,,,,,, uint256 interestWei, uint256 totalDueWei,,, ) = pledge.loans(loanId);
        uint256 protocolFee = (interestWei * uint256(PROTOCOL_FEE_BPS)) / 10000;
        uint256 lenderProceeds = totalDueWei - protocolFee;

        vm.expectEmit(true, true, true, true, address(pledge));
        emit LoanRepaid(
            loanId,
            borrower,
            lender,
            totalDueWei,
            lenderProceeds,
            protocolFee
        );

        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId);
    }

    function test_EmitLoanForeclosed() public {
        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.prank(lender);
        uint256 offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        uint256 tokenId = 1;
        nft.mint(borrower, tokenId);

        vm.startPrank(borrower);
        nft.approve(address(pledge), tokenId);
        uint256 loanId = pledge.acceptOffer(offerId, tokenId);
        vm.stopPrank();

        (,,,,,,,, uint64 dueAt,,) = pledge.loans(loanId);
        vm.warp(dueAt + 1);

        vm.expectEmit(true, true, false, true, address(pledge));
        emit LoanForeclosed(loanId, lender, destination, tokenId);

        vm.prank(lender);
        pledge.foreclose(loanId, destination);
    }

    function test_EmitProceedsWithdrawn() public {
        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.prank(lender);
        uint256 offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.prank(lender);
        pledge.cancelOffer(offerId);

        vm.expectEmit(true, false, false, true, address(pledge));
        emit ProceedsWithdrawn(lender, PRINCIPAL);

        vm.prank(lender);
        pledge.withdrawProceeds();
    }

    function test_EmitAdminEvents() public {
        vm.expectEmit(true, false, false, true, address(pledge));
        emit CollectionStatusChanged(address(nft), false);

        vm.prank(owner);
        pledge.setCollectionEnabled(address(nft), false);

        vm.expectEmit(false, false, false, true, address(pledge));
        emit FeeUpdated(PROTOCOL_FEE_BPS, 800);

        vm.prank(owner);
        pledge.setFeeBps(800);

        vm.expectEmit(true, true, false, false, address(pledge));
        emit FeeRecipientUpdated(feeRecipient, newFeeRecipient);

        vm.prank(owner);
        pledge.setFeeRecipient(newFeeRecipient);

        vm.expectEmit(false, false, false, true, address(pledge));
        emit NewActivityPaused(true);

        vm.prank(owner);
        pledge.pauseNewActivity();

        vm.expectEmit(false, false, false, true, address(pledge));
        emit NewActivityPaused(false);

        vm.prank(owner);
        pledge.unpauseNewActivity();
    }
}
