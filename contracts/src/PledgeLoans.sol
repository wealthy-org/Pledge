pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IPledgeLoans} from "./interfaces/IPledgeLoans.sol";

contract PledgeLoans is IPledgeLoans, Ownable2Step, ReentrancyGuard, IERC721Receiver {
    bytes4 private constant ERC721_INTERFACE_ID = 0x80ac58cd;

    uint16 public constant MAX_TERM_INTEREST_BPS = 10_000;
    uint16 public constant MAX_PROTOCOL_FEE_BPS = 1_000;

    uint32 public constant DURATION_7_DAYS = 7 days;
    uint32 public constant DURATION_14_DAYS = 14 days;
    uint32 public constant DURATION_30_DAYS = 30 days;

    uint16 public protocolFeeBps;
    address public protocolFeeRecipient;
    bool public newActivityPaused;

    uint256 public nextOfferId;
    uint256 public nextLoanId;

    mapping(uint256 => Offer) public offers;
    mapping(uint256 => Loan) public loans;
    mapping(address => bool) public enabledCollections;
    mapping(address => bool) public disabledCollections;
    mapping(address => uint256) public claimableProceeds;
    mapping(address => mapping(uint256 => bool)) public isTokenInCollateral;

    constructor(
        address initialOwner,
        address initialFeeRecipient,
        uint16 initialFeeBps
    ) Ownable(initialOwner) {
        if (initialFeeRecipient == address(0)) {
            revert InvalidFeeRecipient();
        }
        if (initialFeeBps > MAX_PROTOCOL_FEE_BPS) {
            revert InvalidFeeBps(initialFeeBps);
        }

        protocolFeeRecipient = initialFeeRecipient;
        protocolFeeBps = initialFeeBps;
        nextOfferId = 1;
        nextLoanId = 1;
    }

    function _validateERC721Collection(address collection) internal view {
        if (collection.code.length == 0) {
            revert InvalidERC721Contract(collection);
        }
        if (disabledCollections[collection]) {
            revert CollectionBlocked(collection);
        }
        try IERC165(collection).supportsInterface(ERC721_INTERFACE_ID) returns (bool supported) {
            if (!supported) {
                revert InvalidERC721Contract(collection);
            }
        } catch {
            revert InvalidERC721Contract(collection);
        }
    }

    function setCollectionBlocked(address collection, bool blocked) external onlyOwner {
        disabledCollections[collection] = blocked;
        enabledCollections[collection] = !blocked;
        emit CollectionBlockStatusChanged(collection, blocked);
    }

    function setCollectionEnabled(address collection, bool enabled) external onlyOwner {
        disabledCollections[collection] = !enabled;
        enabledCollections[collection] = enabled;
        emit CollectionStatusChanged(collection, enabled);
    }

    function setFeeBps(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_PROTOCOL_FEE_BPS) {
            revert InvalidFeeBps(newFeeBps);
        }
        uint16 oldFee = protocolFeeBps;
        protocolFeeBps = newFeeBps;
        emit FeeUpdated(oldFee, newFeeBps);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) {
            revert InvalidFeeRecipient();
        }
        address oldRecipient = protocolFeeRecipient;
        protocolFeeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function pauseNewActivity() external onlyOwner {
        newActivityPaused = true;
        emit NewActivityPaused(true);
    }

    function unpauseNewActivity() external onlyOwner {
        newActivityPaused = false;
        emit NewActivityPaused(false);
    }

    function createOffer(
        address collection,
        uint16 termInterestBps,
        uint32 durationSeconds,
        uint64 expiresAt
    ) external payable nonReentrant returns (uint256 offerId) {
        if (newActivityPaused) {
            revert NewActivityPausedError();
        }
        if (msg.value == 0) {
            revert InvalidPrincipal();
        }
        _validateERC721Collection(collection);
        if (termInterestBps > MAX_TERM_INTEREST_BPS) {
            revert InvalidInterestRate(termInterestBps);
        }
        if (
            durationSeconds != DURATION_7_DAYS &&
            durationSeconds != DURATION_14_DAYS &&
            durationSeconds != DURATION_30_DAYS
        ) {
            revert InvalidDuration(durationSeconds);
        }
        if (expiresAt <= block.timestamp) {
            revert InvalidExpiration();
        }

        offerId = nextOfferId++;
        offers[offerId] = Offer({
            lender: msg.sender,
            collection: collection,
            principalWei: msg.value,
            termInterestBps: termInterestBps,
            durationSeconds: durationSeconds,
            expiresAt: expiresAt,
            feeBpsSnapshot: protocolFeeBps,
            status: OfferStatus.Open
        });

        emit OfferCreated(
            offerId,
            msg.sender,
            collection,
            msg.value,
            termInterestBps,
            durationSeconds,
            expiresAt,
            protocolFeeBps
        );
    }

    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        if (offer.status != OfferStatus.Open) {
            revert OfferNotOpen(offerId);
        }
        if (offer.lender != msg.sender) {
            revert Unauthorized();
        }

        offer.status = OfferStatus.Cancelled;
        claimableProceeds[offer.lender] += offer.principalWei;

        emit OfferCancelled(offerId, offer.lender, offer.principalWei);
    }

    function acceptOffer(uint256 offerId, uint256 tokenId)
        external
        nonReentrant
        returns (uint256 loanId)
    {
        if (newActivityPaused) {
            revert NewActivityPausedError();
        }

        Offer storage offer = offers[offerId];
        if (offer.status != OfferStatus.Open) {
            revert OfferNotOpen(offerId);
        }
        if (block.timestamp >= offer.expiresAt) {
            revert OfferExpired(offerId);
        }
        _validateERC721Collection(offer.collection);
        if (isTokenInCollateral[offer.collection][tokenId]) {
            revert TokenAlreadyInCollateral(offer.collection, tokenId);
        }

        IERC721 nft = IERC721(offer.collection);
        if (nft.ownerOf(tokenId) != msg.sender) {
            revert NotTokenOwner(offer.collection, tokenId);
        }

        offer.status = OfferStatus.Filled;
        loanId = nextLoanId++;

        uint256 interestWei = (offer.principalWei * offer.termInterestBps + 9999) / 10000;
        uint256 totalDueWei = offer.principalWei + interestWei;
        uint64 dueAt = uint64(block.timestamp + offer.durationSeconds);

        loans[loanId] = Loan({
            offerId: offerId,
            borrower: msg.sender,
            lender: offer.lender,
            collection: offer.collection,
            tokenId: tokenId,
            principalWei: offer.principalWei,
            interestWei: interestWei,
            totalDueWei: totalDueWei,
            dueAt: dueAt,
            feeBpsSnapshot: offer.feeBpsSnapshot,
            status: LoanStatus.Active
        });

        isTokenInCollateral[offer.collection][tokenId] = true;

        emit OfferFilled(offerId, loanId, msg.sender, tokenId);
        emit LoanStarted(
            loanId,
            offerId,
            msg.sender,
            offer.lender,
            offer.collection,
            tokenId,
            offer.principalWei,
            interestWei,
            totalDueWei,
            dueAt,
            offer.feeBpsSnapshot
        );

        nft.transferFrom(msg.sender, address(this), tokenId);

        (bool sent, ) = payable(msg.sender).call{value: offer.principalWei}("");
        if (!sent) {
            revert TransferFailed();
        }
    }

    function repay(uint256 loanId) external payable nonReentrant {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.Active) {
            revert LoanNotActive(loanId);
        }
        if (block.timestamp > loan.dueAt) {
            revert LoanOverdue(loanId, loan.dueAt, uint64(block.timestamp));
        }
        if (msg.value != loan.totalDueWei) {
            revert ExactRepaymentRequired(loan.totalDueWei, msg.value);
        }

        loan.status = LoanStatus.Repaid;
        isTokenInCollateral[loan.collection][loan.tokenId] = false;

        uint256 feeWei = (loan.interestWei * uint256(loan.feeBpsSnapshot)) / 10000;
        uint256 lenderAmount = loan.totalDueWei - feeWei;

        claimableProceeds[protocolFeeRecipient] += feeWei;
        claimableProceeds[loan.lender] += lenderAmount;

        emit LoanRepaid(
            loanId,
            loan.borrower,
            loan.lender,
            loan.totalDueWei,
            lenderAmount,
            feeWei
        );

        IERC721(loan.collection).transferFrom(address(this), loan.borrower, loan.tokenId);
    }

    function foreclose(uint256 loanId, address destination) external nonReentrant {
        Loan storage loan = loans[loanId];
        if (loan.lender != msg.sender) {
            revert Unauthorized();
        }
        if (loan.status != LoanStatus.Active) {
            revert LoanNotActive(loanId);
        }
        if (block.timestamp <= loan.dueAt) {
            revert LoanNotDue(loanId, loan.dueAt, uint64(block.timestamp));
        }
        if (destination == address(0)) {
            revert InvalidDestination();
        }

        loan.status = LoanStatus.Foreclosed;
        isTokenInCollateral[loan.collection][loan.tokenId] = false;

        emit LoanForeclosed(loanId, loan.lender, destination, loan.tokenId);

        IERC721(loan.collection).transferFrom(address(this), destination, loan.tokenId);
    }

    function withdrawProceeds() external nonReentrant {
        uint256 amount = claimableProceeds[msg.sender];
        if (amount == 0) {
            revert NoClaimableBalance();
        }

        claimableProceeds[msg.sender] = 0;

        emit ProceedsWithdrawn(msg.sender, amount);

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
