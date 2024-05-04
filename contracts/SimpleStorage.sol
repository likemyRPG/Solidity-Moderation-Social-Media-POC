// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.19;

contract SimpleStorage {
    uint public data;

    function setData(uint _data) public {
        data = _data;
    }
}