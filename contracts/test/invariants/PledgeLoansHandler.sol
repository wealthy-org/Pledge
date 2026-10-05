// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PledgeLoans} from "../../src/PledgeLoans.sol";
import {IPledgeLoans} from "../../src/interfaces/IPledgeLoans.sol";
import {PledgeLoansTestBase} from "../PledgeLoansTestBase.sol";
import {MockERC721} from "../mocks/MockERC721.sol";

contract PledgeLoansHandler is PledgeLoansTestBase {
    PledgeLoans public pledge;
    MockERC721 public nft;

    address public owner;
    address public feeRecipient;

    address[] public actors;
    address internal currentActor;

    uint256 public ghost_openOffersPrincipal;
    uint256 public ghost_activeCollateralCount;

    uint256[] public openOfferIds;
    uint256[] public activeLoanIds;
    uint256 public nextTokenId = 1;

    constructor(
        PledgeLoans _pledge,
        MockERC721 _nft,
        address _owner,
        address _feeRecipient
    ) {
        pledge = _pledge;
        nft = _nft;
        owner = _owner;
        feeRecipient = _feeRecipient;

        actors.push(address(0x111));
        actors.push(address(0x222));
        actors.push(address(0x333));
        actors.push(address(0x444));

        for (uint256 i = 0; i < actors.length; i++) {
            vm.deal(actors[i], 1_000_000 ether);
        }
    }

    modifier useActor(uint256 actorIndexSeed) {
        currentActor = actors[actorIndexSeed % actors.length];
        vm.startPrank(currentActor);
        _;
        vm.stopPrank();
    }

    function createOffer(
        uint256 actorSeed,
        uint256 principalSeed,
        uint16 interestSeed,
        uint8 durationIndexSeed,
        uint32 expirationDeltaSeed
    ) public useActor(actorSeed) {
        if (pledge.newActivityPaused()) return;

        uint256 principal = bound(principalSeed, 1000 wei, 100 ether);
        uint16 termInterestBps = uint16(bound(interestSeed, 0, 10_000));

        uint32 duration;
        uint8 durMod = uint8(durationIndexSeed % 3);
        if (durMod == 0) duration = 7 days;
        else if (durMod == 1) duration = 14 days;
        else duration = 30 days;

        uint64 expiresAt = uint64(block.timestamp + bound(expirationDeltaSeed, 1 hours, 30 days));

        uint256 offerId = pledge.createOffer{value: principal}(
            address(nft),
            termInterestBps,
            duration,
            expiresAt
        );

        ghost_openOffersPrincipal += principal;
        openOfferIds.push(offerId);
    }

    function cancelOffer(uint256 offerIndexSeed) public {
        if (openOfferIds.length == 0) return;
        uint256 index = offerIndexSeed % openOfferIds.length;
        uint256 offerId = openOfferIds[index];

        (address lender,, uint256 principalWei,,,,, OfferStatus status) = pledge.offers(offerId);
        if (status != OfferStatus.Open) return;

        vm.prank(lender);
        pledge.cancelOffer(offerId);

        ghost_openOffersPrincipal -= principalWei;
        _removeOpenOffer(index);
    }

    function acceptOffer(uint256 actorSeed, uint256 offerIndexSeed) public useActor(actorSeed) {
        if (pledge.newActivityPaused()) return;
        if (openOfferIds.length == 0) return;

        uint256 index = offerIndexSeed % openOfferIds.length;
        uint256 offerId = openOfferIds[index];

        (,, uint256 principalWei,,, uint64 expiresAt,, OfferStatus status) = pledge.offers(offerId);
        if (status != OfferStatus.Open) return;
        if (block.timestamp >= expiresAt) return;

        uint256 tokenId = nextTokenId++;
        nft.mint(currentActor, tokenId);
        nft.approve(address(pledge), tokenId);

        uint256 loanId = pledge.acceptOffer(offerId, tokenId);

        ghost_openOffersPrincipal -= principalWei;
        ghost_activeCollateralCount++;
        activeLoanIds.push(loanId);
        _removeOpenOffer(index);
    }

    function repay(uint256 actorSeed, uint256 loanIndexSeed) public useActor(actorSeed) {
        if (activeLoanIds.length == 0) return;

        uint256 index = loanIndexSeed % activeLoanIds.length;
        uint256 loanId = activeLoanIds[index];

        (,,,,,,, uint256 totalDueWei, uint64 dueAt,, LoanStatus status) = pledge.loans(loanId);
        if (status != LoanStatus.Active) return;
        if (block.timestamp > dueAt) return;

        pledge.repay{value: totalDueWei}(loanId);

        ghost_activeCollateralCount--;
        _removeActiveLoan(index);
    }

    function foreclose(uint256 loanIndexSeed, uint256 destSeed) public {
        if (activeLoanIds.length == 0) return;

        uint256 index = loanIndexSeed % activeLoanIds.length;
        uint256 loanId = activeLoanIds[index];

        (,, address lender,,,,,, uint64 dueAt,, LoanStatus status) = pledge.loans(loanId);
        if (status != LoanStatus.Active) return;
        if (block.timestamp <= dueAt) return;

        address destination = actors[destSeed % actors.length];

        vm.prank(lender);
        pledge.foreclose(loanId, destination);

        ghost_activeCollateralCount--;
        _removeActiveLoan(index);
    }

    function withdrawProceeds(uint256 actorSeed) public useActor(actorSeed) {
        uint256 claimable = pledge.claimableProceeds(currentActor);
        if (claimable == 0) return;

        pledge.withdrawProceeds();
    }

    function withdrawFeeRecipient() public {
        uint256 claimable = pledge.claimableProceeds(feeRecipient);
        if (claimable == 0) return;

        vm.prank(feeRecipient);
        pledge.withdrawProceeds();
    }

    function warpTime(uint256 secondsSeed) public {
        uint256 jump = bound(secondsSeed, 1 hours, 14 days);
        vm.warp(block.timestamp + jump);
    }

    function _removeOpenOffer(uint256 index) internal {
        openOfferIds[index] = openOfferIds[openOfferIds.length - 1];
        openOfferIds.pop();
    }

    function _removeActiveLoan(uint256 index) internal {
        activeLoanIds[index] = activeLoanIds[activeLoanIds.length - 1];
        activeLoanIds.pop();
    }

    function totalClaimableAcrossActors() public view returns (uint256 total) {
        for (uint256 i = 0; i < actors.length; i++) {
            total += pledge.claimableProceeds(actors[i]);
        }
        total += pledge.claimableProceeds(feeRecipient);
        total += pledge.claimableProceeds(owner);
    }
}
