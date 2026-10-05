pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IPledgeLoans} from "../src/interfaces/IPledgeLoans.sol";

abstract contract PledgeLoansTestBase is Test, IPledgeLoans {
    function getCuratedCollections() external view virtual returns (address[] memory) {
        return new address[](0);
    }

    function isCollectionCurated(address) external view virtual returns (bool) {
        return false;
    }
}
