// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PledgeLoans} from "../src/PledgeLoans.sol";
import {IPledgeLoans} from "../src/interfaces/IPledgeLoans.sol";

contract CreateCancelOfferTest is Test, IPledgeLoans {
    PledgeLoans public pledgeLoans;
    address public admin = address(0xAD01);
    address public feeRecipient = address(0xFEE);
    address public lender = address(0x1E4D);
    address public otherUser = address(0x9999);
    address public collection = address(0xCAFE);

    function setUp() public {
        pledgeLoans = new PledgeLoans(admin, feeRecipient, 250);

        vm.prank(admin);
        pledgeLoans.setCollectionEnabled(collection, true);

        vm.deal(lender, 100 ether);
        vm.deal(otherUser, 100 ether);
    }

    function test_CreateOfferHappyPath() public {
        uint256 principal = 1 ether;
        uint16 interestBps = 500;
        uint32 duration = 14 days;
        uint64 expiresAt = uint64(block.timestamp + 1 days);

        vm.expectEmit(true, true, true, true);
        emit OfferCreated(1, lender, collection, principal, interestBps, duration, expiresAt, 250);

        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: principal}(
            collection,
            interestBps,
            duration,
            expiresAt
        );

        assertEq(offerId, 1);
        assertEq(pledgeLoans.nextOfferId(), 2);
        assertEq(address(pledgeLoans).balance, principal);

        (
            address storedLender,
            address storedCollection,
            uint256 storedPrincipal,
            uint16 storedInterestBps,
            uint32 storedDuration,
            uint64 storedExpiresAt,
            uint16 storedFeeBps,
            OfferStatus storedStatus
        ) = pledgeLoans.offers(1);

        assertEq(storedLender, lender);
        assertEq(storedCollection, collection);
        assertEq(storedPrincipal, principal);
        assertEq(storedInterestBps, interestBps);
        assertEq(storedDuration, duration);
        assertEq(storedExpiresAt, expiresAt);
        assertEq(storedFeeBps, 250);
        assertEq(uint8(storedStatus), uint8(OfferStatus.Open));
    }

    function test_CreateOfferRevertsOnZeroPrincipal() public {
        vm.prank(lender);
        vm.expectRevert(InvalidPrincipal.selector);
        pledgeLoans.createOffer{value: 0}(
            collection,
            500,
            14 days,
            uint64(block.timestamp + 1 days)
        );
    }

    function test_CreateOfferRevertsOnDisabledCollection() public {
        address unapprovedCollection = address(0xDEAD);
        vm.prank(lender);
        vm.expectRevert(abi.encodeWithSelector(CollectionNotAllowed.selector, unapprovedCollection));
        pledgeLoans.createOffer{value: 1 ether}(
            unapprovedCollection,
            500,
            14 days,
            uint64(block.timestamp + 1 days)
        );
    }

    function test_CreateOfferRevertsOnInvalidDuration() public {
        vm.prank(lender);
        vm.expectRevert(abi.encodeWithSelector(InvalidDuration.selector, 10 days));
        pledgeLoans.createOffer{value: 1 ether}(
            collection,
            500,
            10 days,
            uint64(block.timestamp + 1 days)
        );
    }

    function test_CreateOfferRevertsOnPastOrCurrentExpiration() public {
        vm.prank(lender);
        vm.expectRevert(InvalidExpiration.selector);
        pledgeLoans.createOffer{value: 1 ether}(
            collection,
            500,
            14 days,
            uint64(block.timestamp)
        );
    }

    function test_CreateOfferRevertsOnExcessiveInterestRate() public {
        vm.prank(lender);
        vm.expectRevert(abi.encodeWithSelector(InvalidInterestRate.selector, 10_001));
        pledgeLoans.createOffer{value: 1 ether}(
            collection,
            10_001,
            14 days,
            uint64(block.timestamp + 1 days)
        );
    }

    function test_CancelOfferHappyPath() public {
        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 2 ether}(
            collection,
            500,
            7 days,
            uint64(block.timestamp + 2 days)
        );

        assertEq(pledgeLoans.claimableProceeds(lender), 0);

        vm.expectEmit(true, true, false, true);
        emit OfferCancelled(offerId, lender, 2 ether);

        vm.prank(lender);
        pledgeLoans.cancelOffer(offerId);

        (, , , , , , , OfferStatus status) = pledgeLoans.offers(offerId);
        assertEq(uint8(status), uint8(OfferStatus.Cancelled));
        assertEq(pledgeLoans.claimableProceeds(lender), 2 ether);
    }

    function test_CancelOfferRevertsIfNotLender() public {
        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 1 ether}(
            collection,
            500,
            7 days,
            uint64(block.timestamp + 2 days)
        );

        vm.prank(otherUser);
        vm.expectRevert(Unauthorized.selector);
        pledgeLoans.cancelOffer(offerId);
    }

    function test_CancelOfferRevertsIfNotOpen() public {
        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 1 ether}(
            collection,
            500,
            7 days,
            uint64(block.timestamp + 2 days)
        );

        vm.prank(lender);
        pledgeLoans.cancelOffer(offerId);

        vm.prank(lender);
        vm.expectRevert(abi.encodeWithSelector(OfferNotOpen.selector, offerId));
        pledgeLoans.cancelOffer(offerId);
    }

    function test_CancelOfferAllowedEvenIfCollectionDisabled() public {
        vm.prank(lender);
        uint256 offerId = pledgeLoans.createOffer{value: 1 ether}(
            collection,
            500,
            7 days,
            uint64(block.timestamp + 2 days)
        );

        vm.prank(admin);
        pledgeLoans.setCollectionEnabled(collection, false);

        vm.prank(lender);
        pledgeLoans.cancelOffer(offerId);

        (, , , , , , , OfferStatus status) = pledgeLoans.offers(offerId);
        assertEq(uint8(status), uint8(OfferStatus.Cancelled));
        assertEq(pledgeLoans.claimableProceeds(lender), 1 ether);
    }
}
