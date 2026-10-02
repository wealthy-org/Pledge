// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {PledgeLoans} from "../../src/PledgeLoans.sol";
import {MockERC721} from "./MockERC721.sol";

contract MaliciousReceiver is IERC721Receiver {
    bool public rejectETH = true;

    function setRejectETH(bool reject) external {
        rejectETH = reject;
    }

    function acceptLoan(
        PledgeLoans pledgeLoans,
        MockERC721 nft,
        uint256 offerId,
        uint256 tokenId
    ) external {
        nft.approve(address(pledgeLoans), tokenId);
        pledgeLoans.acceptOffer(offerId, tokenId);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {
        if (rejectETH) {
            revert("ETH rejected");
        }
    }
}
