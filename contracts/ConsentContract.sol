// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

contract ConsentContract {
    mapping(address => bool) private userConsents;

    event ConsentUpdated(address indexed user, bool consent);

    function giveConsent() public {
        userConsents[msg.sender] = true;
        emit ConsentUpdated(msg.sender, true);
    }

    function withdrawConsent() public {
        userConsents[msg.sender] = false;
        emit ConsentUpdated(msg.sender, false);
    }

    function checkConsent(address user) public view returns (bool) {
        return userConsents[user];
    }
}
