// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC721} from "./mocks/MockERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

contract MockERC721Test is Test {
    MockERC721 public nft;
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);

    function setUp() public {
        nft = new MockERC721("Robinhood Genesis Pass", "RHG", "https://api.pledge.xyz/metadata/rhg");
    }

    function test_MockERC721Metadata() public view {
        assertEq(nft.name(), "Robinhood Genesis Pass");
        assertEq(nft.symbol(), "RHG");
    }

    function test_MockERC721SupportsInterface() public view {
        bytes4 erc721InterfaceId = type(IERC721).interfaceId;
        bytes4 erc721MetadataInterfaceId = type(IERC721Metadata).interfaceId;

        assertTrue(nft.supportsInterface(erc721InterfaceId));
        assertTrue(nft.supportsInterface(erc721MetadataInterfaceId));
    }

    function test_MockERC721MintAndTransfer() public {
        nft.mint(alice, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.balanceOf(alice), 1);

        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);
        assertEq(nft.ownerOf(1), bob);
        assertEq(nft.balanceOf(alice), 0);
        assertEq(nft.balanceOf(bob), 1);
    }

    function test_MockERC721ApproveAndTransferFrom() public {
        nft.mint(alice, 42);

        vm.prank(alice);
        nft.approve(bob, 42);
        assertEq(nft.getApproved(42), bob);

        vm.prank(bob);
        nft.transferFrom(alice, bob, 42);
        assertEq(nft.ownerOf(42), bob);
    }

    function test_MockERC721TokenURI() public {
        nft.mint(alice, 7);
        assertEq(nft.tokenURI(7), "https://api.pledge.xyz/metadata/rhg/7.json");
    }
}
