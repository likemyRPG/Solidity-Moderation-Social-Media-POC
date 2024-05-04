// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.19;

import "./ContentContract.sol";
import "./ReputationSystemContract.sol";

contract VotingContract {
    ContentContract public contentContract;
    ReputationSystemContract public reputationSystem;

    constructor(address _contentAddress, address _reputationAddress) {
        contentContract = ContentContract(_contentAddress);
        reputationSystem = ReputationSystemContract(_reputationAddress);
    }

    function vote(uint _contentId, bool _vote) public {
        require(reputationSystem.getReputation(msg.sender) > 0, "Insufficient reputation to vote.");

        int voteWeight = int(reputationSystem.getReputationWeight(msg.sender));
        contentContract.updateScore(_contentId, _vote ? voteWeight : -voteWeight);
        
        reputationSystem.adjustReputation(msg.sender, _vote);
    }
}