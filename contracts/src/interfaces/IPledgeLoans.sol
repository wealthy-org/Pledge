pragma solidity 0.8.24;

interface IPledgeLoans {
    enum OfferStatus {
        None,
        Open,
        Cancelled,
        Filled
    }

    enum LoanStatus {
        None,
        Active,
        Repaid,
        Foreclosed
    }

    struct Offer {
        address lender;
        address collection;
        uint256 principalWei;
        uint16 termInterestBps;
        uint32 durationSeconds;
        uint64 expiresAt;
        uint16 feeBpsSnapshot;
        OfferStatus status;
    }

    struct Loan {
        uint256 offerId;
        address borrower;
        address lender;
        address collection;
        uint256 tokenId;
        uint256 principalWei;
        uint256 interestWei;
        uint256 totalDueWei;
        uint64 dueAt;
        uint16 feeBpsSnapshot;
        LoanStatus status;
    }

    error Unauthorized();
    error CollectionNotAllowed(address collection);
    error CollectionNotEnabled(address collection);
    error CollectionBlocked(address collection);
    error InvalidERC721Contract(address collection);
    error InvalidDuration(uint32 durationSeconds);
    error InvalidInterestRate(uint16 termInterestBps);
    error InvalidPrincipal();
    error InvalidExpiration();
    error OfferNotOpen(uint256 offerId);
    error OfferExpired(uint256 offerId);
    error TokenAlreadyInCollateral(address collection, uint256 tokenId);
    error NotTokenOwner(address collection, uint256 tokenId);
    error TransferFailed();
    error LoanNotActive(uint256 loanId);
    error LoanNotDue(uint256 loanId, uint64 dueAt, uint64 currentTimestamp);
    error LoanOverdue(uint256 loanId, uint64 dueAt, uint64 currentTimestamp);
    error ExactRepaymentRequired(uint256 expected, uint256 received);
    error NoClaimableBalance();
    error NewActivityPausedError();
    error InvalidFeeRecipient();
    error InvalidFeeBps(uint16 feeBps);
    error InvalidDestination();

    event CollectionStatusChanged(address indexed collection, bool enabled);
    event CollectionBlockStatusChanged(address indexed collection, bool blocked);
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

    function getCuratedCollections() external view returns (address[] memory);
    function isCollectionCurated(address collection) external view returns (bool);
}
