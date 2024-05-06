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
        // Retrieve the weight of the vote based on the user's current reputation
        int voteWeight = reputationSystem.getReputationWeight(msg.sender);
        require(voteWeight > 0, "Insufficient reputation to vote.");

        // Update the content score based on the vote
        contentContract.updateScore(_contentId, _vote ? voteWeight : -voteWeight);
        
        // Register the vote for user activity and total votes cast
        reputationSystem.registerVote(msg.sender, _vote);
        
        // Check if the content is currently flagged
        bool isContentFlagged = contentContract.isContentFlagged(_contentId);
        // Determine vote accuracy based on the content's flagged status and vote type
        bool accurateVote = (_vote && !isContentFlagged) || (!_vote && isContentFlagged);

        // Adjust the voter's reputation based on the accuracy of their vote
reputationSystem.adjustReputation(msg.sender, accurateVote ? int8(1) : -1);  // Adjust by +1 or -1 based on accuracy
        // If the vote is positive, reward the author
        if (_vote) {
            address author = contentContract.getAuthor(_contentId);
            // Reward the author only if the vote contributes positively to unflagged content
            if(!isContentFlagged) {
                reputationSystem.adjustReputation(author, 1);  // Reward the author
            }
        }
    }
}
