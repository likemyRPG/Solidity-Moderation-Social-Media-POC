// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.19;

contract ReputationSystemContract {
    mapping(address => uint) public reputations;

    function adjustReputation(address _user, bool _positiveFeedback) public {
        if (_positiveFeedback) {
            reputations[_user] += 1;
        } else if (reputations[_user] > 0) {
            reputations[_user] -= 1;
        }
    }

    function getReputation(address _user) public view returns (uint) {
        return reputations[_user];
    }

    function getReputationWeight(address _user) public view returns (int) {
        return int(reputations[_user] / 10);
    }
}