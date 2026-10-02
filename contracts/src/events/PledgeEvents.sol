// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface PledgeEvents {
    event CollectionStatusChanged(address indexed collection, bool enabled);
    event OfferCreated(
        uint256 indexed offerId,
        address indexed lender,
        address indexed collection,
        uint256 principalWei,
        uint16 termInterestBps,
        uint32 durationSeconds,
        uint64 expiresAt,
        uint16 feeBpsSnapshot
    );
    event OfferCancelled(uint256 indexed offerId, address indexed lender, uint256 refundWei);
    event OfferFilled(
        uint256 indexed offerId,
        uint256 indexed loanId,
        address indexed borrower,
        uint256 tokenId
    );
    event LoanStarted(
        uint256 indexed loanId,
        uint256 indexed offerId,
        address indexed borrower,
        address lender,
        address collection,
        uint256 tokenId,
        uint256 principalWei,
        uint256 interestWei,
        uint256 totalDueWei,
        uint64 dueAt,
        uint16 feeBpsSnapshot
    );
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed lender,
        uint256 totalRepaidWei,
        uint256 lenderProceedsWei,
        uint256 protocolFeeWei
    );
    event LoanForeclosed(
        uint256 indexed loanId,
        address indexed lender,
        address destination,
        uint256 tokenId
    );
    event ProceedsWithdrawn(address indexed recipient, uint256 amountWei);
    event FeeUpdated(uint16 oldFeeBps, uint16 newFeeBps);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event NewActivityPaused(bool isPaused);
}
