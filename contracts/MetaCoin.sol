// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract MetaCoin {
	mapping (address => uint) balances;

	constructor() {
		balances[msg.sender] = 10000;
	}

	function sendCoin(address receiver, uint amount)
	    public
	    returns (bool)
    {
		if (balances[msg.sender] < amount) {
            return false;
        }
		balances[msg.sender] -= amount;
		balances[receiver] += amount;
		return true;
	}

	function getBalance(address addr)
	    public
	    view
	    returns (uint)
    {
  	    return balances[addr];
	}
}
