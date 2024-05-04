// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.19;

contract ContentContract {
    struct Content {
        uint id;
        string data;
        address author;
        bool isFlagged;
        int score;
    }

    Content[] public contents;
    int public flagThreshold = -10;

    event ContentCreated(uint contentId, address author, string data);
    event ContentFlagged(uint contentId);
    event ScoreUpdated(uint contentId, int score);

    function createContent(string memory _data) public {
        contents.push(Content({
            id: contents.length,
            data: _data,
            author: msg.sender,
            isFlagged: false,
            score: 0
        }));
        uint id = contents.length - 1;
        emit ContentCreated(id, msg.sender, _data);
    }

    function updateScore(uint _id, int _change) public {
        Content storage content = contents[_id];
        content.score += _change;
        emit ScoreUpdated(_id, content.score);
        if (content.score <= flagThreshold) {
            flagContent(_id);
        }
    }

    function flagContent(uint _id) internal {
        Content storage content = contents[_id];
        content.isFlagged = true;
        emit ContentFlagged(_id);
    }

    function getContentsCount() public view returns (uint) {
        return contents.length;
    }

    function getContent(uint _id) public view returns (uint, string memory, address, bool, int) {
        Content memory content = contents[_id];
        return (content.id, content.data, content.author, content.isFlagged, content.score);
    }

    function getFlaggedContents() public view returns (uint[] memory) {
        uint flaggedCount = 0;
        for (uint i = 0; i < contents.length; i++) {
            if (contents[i].isFlagged) {
                flaggedCount++;
            }
        }
        uint[] memory flaggedContents = new uint[](flaggedCount);
        uint index = 0;
        for (uint i = 0; i < contents.length; i++) {
            if (contents[i].isFlagged) {
                flaggedContents[index] = i;
                index++;
            }
        }
        return flaggedContents;
    }

    function getAuthorContents(address _author) public view returns (uint[] memory) {
        uint authorCount = 0;
        for (uint i = 0; i < contents.length; i++) {
            if (contents[i].author == _author) {
                authorCount++;
            }
        }
        uint[] memory authorContents = new uint[](authorCount);
        uint index = 0;
        for (uint i = 0; i < contents.length; i++) {
            if (contents[i].author == _author) {
                authorContents[index] = i;
                index++;
            }
        }
        return authorContents;
    }

    function getAuthorFlaggedContents(address _author) public view returns (uint[] memory) {
        uint authorFlaggedCount = 0;
        for (uint i = 0; i < contents.length; i++) {
            if (contents[i].author == _author && contents[i].isFlagged) {
                authorFlaggedCount++;
            }
        }
        uint[] memory authorFlaggedContents = new uint[](authorFlaggedCount);
        uint index = 0;
        for (uint i = 0; i < contents.length; i++) {
            if (contents[i].author == _author && contents[i].isFlagged) {
                authorFlaggedContents[index] = i;
                index++;
            }
        }
        return authorFlaggedContents;
    }

    function getAuthorScore(address _author) public view returns (int) {
        int authorScore = 0;
        for (uint i = 0; i < contents.length; i++) {
            if (contents[i].author == _author) {
                authorScore += contents[i].score;
            }
        }
        return authorScore;
    }

    function getAuthorFlaggedScore(address _author) public view returns (int) {
        int authorFlaggedScore = 0;
        for (uint i = 0; i < contents.length; i++) {
            if (contents[i].author == _author && contents[i].isFlagged) {
                authorFlaggedScore += contents[i].score;
            }
        }
        return authorFlaggedScore;
    }
}