// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MockERC721 is ERC721 {
    using Strings for uint256;

    string private _customBaseURI;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) ERC721(name_, symbol_) {
        _customBaseURI = baseURI_;
    }

    function mint(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
    }

    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }

    function setBaseURI(string memory newBaseURI) external {
        _customBaseURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _customBaseURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseURI();
        if (bytes(base).length == 0) {
            return "";
        }
        return string(abi.encodePacked(base, "/", tokenId.toString(), ".json"));
    }
}
