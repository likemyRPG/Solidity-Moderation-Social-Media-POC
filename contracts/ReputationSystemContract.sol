// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

contract ReputationSystemContract {
    mapping(address => uint) public reputations;
    uint public requiredReputationToVote = 10; 
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function adjustReputation(address _user, int _amount) public {
        // Safe check for negative reputations
        if (_amount > 0 || (reputations[_user] >= uint(-_amount))) {
            reputations[_user] += uint(_amount);
        }
    }

    function getReputation(address _user) public view returns (uint) {
        return reputations[_user];
    }

    function getReputationWeight(address _user) public view returns (int) {
        uint baseReputation = reputations[_user];
        return int(baseReputation / 10);  // Simple scaling for reputation impact
    }

    function setRequiredReputationToVote(uint _value) public {
        requiredReputationToVote = _value;
    }

    function getRequiredReputationToVote() public view returns (uint) {
        return requiredReputationToVote;
    }

    // Method to increment or decrement reputation safely
    function modifyReputation(address _user, int _change) public {
        if (_change > 0 || (reputations[_user] > uint(-_change))) {
            reputations[_user] += uint(_change);
        }
    }

    // Register user vote activity
    function registerVote(address _voter, bool _vote) public {
        if (_vote) {
            adjustReputation(_voter, 1);
        } else {
            adjustReputation(_voter, -1);
        }
    }

    function adjustReputationAdmin(address _user, int _amount) public {
        require(msg.sender == owner, "Only the contract owner can adjust reputation.");
        adjustReputation(_user, _amount);
    }

    function setOwner(address _owner) public {
        require(msg.sender == owner, "Only the contract owner can change ownership.");
        owner = _owner;
    }
}
