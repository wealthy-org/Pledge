// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PledgeLoans} from "../src/PledgeLoans.sol";
import {IPledgeLoans} from "../src/interfaces/IPledgeLoans.sol";
import {PledgeLoansTestBase} from "./PledgeLoansTestBase.sol";
import {MockERC721} from "./mocks/MockERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AdminControlsTest is PledgeLoansTestBase {
    PledgeLoans public pledge;
    MockERC721 public nft;

    address public owner = address(0x1);
    address public newOwner = address(0x10);
    address public feeRecipient = address(0x2);
    address public newFeeRecipient = address(0x20);
    address public lender = address(0x3);
    address public borrower = address(0x4);
    address public destination = address(0x5);
    address public stranger = address(0x9);

    uint16 public constant INITIAL_FEE_BPS = 200;
    uint256 public constant PRINCIPAL = 1 ether;
    uint16 public constant TERM_INTEREST_BPS = 500;
    uint32 public constant DURATION = 7 days;

    function setUp() public {
        vm.prank(owner);
        pledge = new PledgeLoans(owner, feeRecipient, INITIAL_FEE_BPS);

        nft = new MockERC721("Robinhood Genesis Pass", "RHG", "ipfs://rhg-base/");

        vm.prank(owner);
        pledge.setCollectionEnabled(address(nft), true);

        vm.deal(lender, 20 ether);
        vm.deal(borrower, 20 ether);
    }

    function test_SetCollectionEnabledAndDisabled() public {
        nft.mint(borrower, 1);
        uint64 expiresAt = uint64(block.timestamp + 1 days);

        vm.prank(lender);
        uint256 offerId = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.startPrank(borrower);
        nft.approve(address(pledge), 1);
        uint256 loanId = pledge.acceptOffer(offerId, 1);
        vm.stopPrank();

        vm.expectEmit(true, false, false, true, address(pledge));
        emit CollectionStatusChanged(address(nft), false);

        vm.prank(owner);
        pledge.setCollectionEnabled(address(nft), false);

        assertFalse(pledge.enabledCollections(address(nft)));

        vm.prank(lender);
        vm.expectRevert(
            abi.encodeWithSelector(CollectionBlocked.selector, address(nft))
        );
        pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        (,,,,,,, uint256 totalDueWei,,,) = pledge.loans(loanId);
        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId);

        (,,,,,,,,,, LoanStatus updatedStatus) = pledge.loans(loanId);
        assertEq(uint8(updatedStatus), uint8(LoanStatus.Repaid));
        assertEq(nft.ownerOf(1), borrower);
    }

    function test_CuratedCollectionsEnumerableLifecycle() public {
        address[] memory initialCurated = pledge.getCuratedCollections();
        assertEq(initialCurated.length, 1);
        assertEq(initialCurated[0], address(nft));
        assertTrue(pledge.isCollectionCurated(address(nft)));

        MockERC721 nft2 = new MockERC721("Sherwood Forest Rangers", "SFR", "ipfs://sfr/");
        MockERC721 nft3 = new MockERC721("Nottingham Guild Pledges", "NGP", "ipfs://ngp/");

        vm.startPrank(owner);
        pledge.setCollectionEnabled(address(nft2), true);
        pledge.setCollectionEnabled(address(nft3), true);
        vm.stopPrank();

        address[] memory threeList = pledge.getCuratedCollections();
        assertEq(threeList.length, 3);
        assertEq(threeList[0], address(nft));
        assertEq(threeList[1], address(nft2));
        assertEq(threeList[2], address(nft3));
        assertTrue(pledge.isCollectionCurated(address(nft2)));
        assertTrue(pledge.isCollectionCurated(address(nft3)));

        vm.prank(owner);
        pledge.setCollectionEnabled(address(nft2), true);
        assertEq(pledge.getCuratedCollections().length, 3);

        vm.prank(owner);
        pledge.setCollectionEnabled(address(nft2), false);
        assertFalse(pledge.isCollectionCurated(address(nft2)));

        address[] memory twoList = pledge.getCuratedCollections();
        assertEq(twoList.length, 2);
        assertEq(twoList[0], address(nft));
        assertEq(twoList[1], address(nft3));

        vm.prank(owner);
        pledge.setCollectionBlocked(address(nft3), true);
        assertFalse(pledge.isCollectionCurated(address(nft3)));

        address[] memory oneList = pledge.getCuratedCollections();
        assertEq(oneList.length, 1);
        assertEq(oneList[0], address(nft));

        vm.prank(owner);
        pledge.setCollectionBlocked(address(nft), true);
        assertFalse(pledge.isCollectionCurated(address(nft)));
        assertEq(pledge.getCuratedCollections().length, 0);

        vm.prank(owner);
        pledge.setCollectionBlocked(address(nft3), false);
        assertTrue(pledge.isCollectionCurated(address(nft3)));
        address[] memory restored = pledge.getCuratedCollections();
        assertEq(restored.length, 1);
        assertEq(restored[0], address(nft3));
    }

    function test_FeeUpdateSnapshotIsolation() public {
        uint64 expiresAt = uint64(block.timestamp + 1 days);

        vm.prank(lender);
        uint256 offerId1 = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        (,,,,,, uint16 feeSnapshot1,) = pledge.offers(offerId1);
        assertEq(feeSnapshot1, INITIAL_FEE_BPS);

        vm.expectEmit(false, false, false, true, address(pledge));
        emit FeeUpdated(INITIAL_FEE_BPS, 500);

        vm.prank(owner);
        pledge.setFeeBps(500);

        assertEq(pledge.protocolFeeBps(), 500);

        vm.prank(lender);
        uint256 offerId2 = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        (,,,,,, uint16 feeSnapshot2,) = pledge.offers(offerId2);
        assertEq(feeSnapshot2, 500);

        nft.mint(borrower, 1);
        vm.startPrank(borrower);
        nft.approve(address(pledge), 1);
        uint256 loanId1 = pledge.acceptOffer(offerId1, 1);
        vm.stopPrank();

        (,,,,,,,,, uint16 loanFeeSnapshot1,) = pledge.loans(loanId1);
        assertEq(loanFeeSnapshot1, INITIAL_FEE_BPS);
    }

    function test_FeeValidationReverts() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(InvalidFeeBps.selector, 1001));
        pledge.setFeeBps(1001);

        vm.expectEmit(true, true, false, false, address(pledge));
        emit FeeRecipientUpdated(feeRecipient, newFeeRecipient);

        vm.prank(owner);
        pledge.setFeeRecipient(newFeeRecipient);
        assertEq(pledge.protocolFeeRecipient(), newFeeRecipient);

        vm.prank(owner);
        vm.expectRevert(InvalidFeeRecipient.selector);
        pledge.setFeeRecipient(address(0));
    }

    function test_PauseScopeValidation() public {
        nft.mint(borrower, 1);
        nft.mint(borrower, 2);
        uint64 expiresAt = uint64(block.timestamp + 1 days);

        vm.prank(lender);
        uint256 offerId1 = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.startPrank(borrower);
        nft.approve(address(pledge), 1);
        uint256 loanId1 = pledge.acceptOffer(offerId1, 1);
        vm.stopPrank();

        vm.prank(lender);
        uint256 offerId2 = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.expectEmit(false, false, false, true, address(pledge));
        emit NewActivityPaused(true);

        vm.prank(owner);
        pledge.pauseNewActivity();
        assertTrue(pledge.newActivityPaused());

        vm.prank(lender);
        vm.expectRevert(NewActivityPausedError.selector);
        pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );

        vm.startPrank(borrower);
        nft.approve(address(pledge), 2);
        vm.expectRevert(NewActivityPausedError.selector);
        pledge.acceptOffer(offerId2, 2);
        vm.stopPrank();

        vm.prank(lender);
        pledge.cancelOffer(offerId2);

        (,,,,,,, uint256 totalDueWei,,,) = pledge.loans(loanId1);
        vm.prank(borrower);
        pledge.repay{value: totalDueWei}(loanId1);

        vm.prank(lender);
        pledge.withdrawProceeds();

        vm.expectEmit(false, false, false, true, address(pledge));
        emit NewActivityPaused(false);

        vm.prank(owner);
        pledge.unpauseNewActivity();
        assertFalse(pledge.newActivityPaused());

        vm.prank(lender);
        uint256 offerId3 = pledge.createOffer{value: PRINCIPAL}(
            address(nft),
            TERM_INTEREST_BPS,
            DURATION,
            expiresAt
        );
        assertTrue(offerId3 > 0);
    }

    function test_UnauthorizedAdminCallsRevert() public {
        vm.startPrank(stranger);

        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                stranger
            )
        );
        pledge.setCollectionEnabled(address(nft), false);

        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                stranger
            )
        );
        pledge.setFeeBps(300);

        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                stranger
            )
        );
        pledge.setFeeRecipient(stranger);

        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                stranger
            )
        );
        pledge.pauseNewActivity();

        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                stranger
            )
        );
        pledge.unpauseNewActivity();

        vm.stopPrank();
    }

    function test_TwoStepOwnershipTransfer() public {
        vm.prank(owner);
        pledge.transferOwnership(newOwner);

        assertEq(pledge.owner(), owner);
        assertEq(pledge.pendingOwner(), newOwner);

        vm.prank(newOwner);
        pledge.acceptOwnership();

        assertEq(pledge.owner(), newOwner);
        assertEq(pledge.pendingOwner(), address(0));
    }
}
