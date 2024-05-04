const SimpleStorage = artifacts.require("./SimpleStorage.sol");
const MetaCoin = artifacts.require("./MetaCoin.sol");
const ContentContract = artifacts.require("./ContentContract.sol");
const ReputationSystemContract = artifacts.require("./ReputationSystemContract.sol");
const VotingContract = artifacts.require("./VotingContract.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(MetaCoin);
  deployer.deploy(ContentContract).then(function() {
    return deployer.deploy(ReputationSystemContract).then(function() {
      return deployer.deploy(VotingContract, ContentContract.address, ReputationSystemContract.address);
    });
  }
  );
}
