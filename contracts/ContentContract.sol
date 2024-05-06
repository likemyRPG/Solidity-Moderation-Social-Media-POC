// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import "./ReputationSystemContract.sol";

contract ContentContract {
    struct Content {
        uint id;
        string data;
        address author;
        bool isFlagged;
        int score;
        bool finalDecision;
    }

    Content[] public contents;
    mapping(address => uint[]) private authorContents;
    int public flagThreshold = -10;
    int public recoveryThreshold = -5;
    ReputationSystemContract reputationSystem;

    event ContentCreated(uint contentId, address author, string data);
    event ContentFlagged(uint contentId);
    event ContentRecovered(uint contentId);
    event ScoreUpdated(uint contentId, int score);

    constructor(address _reputationAddress) {
        reputationSystem = ReputationSystemContract(_reputationAddress);
    }

    function createContent(string memory _data) public {
        contents.push(Content({
            id: contents.length,
            data: _data,
            author: msg.sender,
            isFlagged: false,
            score: 0,
            finalDecision: false
        }));
        uint id = contents.length - 1;
        authorContents[msg.sender].push(id);
        emit ContentCreated(id, msg.sender, _data);
    }

    function updateScore(uint _id, int _change) public {
        require(_id < contents.length, "Content ID does not exist.");
        Content storage content = contents[_id];
        content.score += _change;
        emit ScoreUpdated(_id, content.score);

        if (content.score <= flagThreshold && !content.isFlagged) {
            flagContent(_id);
            reputationSystem.adjustReputation(content.author, -5); // Penalize on flagging
        } else if (content.score > recoveryThreshold && content.isFlagged) {
            recoverContent(_id);
            reputationSystem.adjustReputation(content.author, 3); // Reward on recovery
        }
    }

    function flagContent(uint _id) internal {
        Content storage content = contents[_id];
        content.isFlagged = true;
        content.finalDecision = true;
        emit ContentFlagged(_id);
    }

    function recoverContent(uint _id) internal {
        Content storage content = contents[_id];
        content.isFlagged = false;
        content.finalDecision = false;
        emit ContentRecovered(_id);
    }

    function getContentsCount() public view returns (uint) {
        return contents.length;
    }

    function getAuthor(uint _id) public view returns (address) {
        return contents[_id].author;
    }

    function isContentFlagged(uint _id) public view returns (bool) {
        return contents[_id].isFlagged;
    }

    function getAuthorContents(address _author) public view returns (uint[] memory) {
        return authorContents[_author];
    }

    function getAuthorScore(address _author) public view returns (int) {
        uint[] memory authorContentIds = authorContents[_author];
        int totalScore = 0;
        for (uint i = 0; i < authorContentIds.length; i++) {
            totalScore += contents[authorContentIds[i]].score;
        }
        return totalScore;
    }

    function getContent(uint _id) public view returns (uint, string memory, address, bool, int, bool) {
        Content memory content = contents[_id];
        return (content.id, content.data, content.author, content.isFlagged, content.score, content.finalDecision);
    }
}
