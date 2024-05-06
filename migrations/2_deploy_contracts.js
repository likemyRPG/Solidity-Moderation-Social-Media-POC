const ContentContract = artifacts.require("./ContentContract.sol");
const ReputationSystemContract = artifacts.require("./ReputationSystemContract.sol");
const VotingContract = artifacts.require("./VotingContract.sol");
const ConsentContract = artifacts.require("./ConsentContract.sol");

module.exports = async function(deployer) {
    // Deploy the ReputationSystemContract
    await deployer.deploy(ReputationSystemContract);
    const reputationSystem = await ReputationSystemContract.deployed();

    // Deploy the ContentContract with the address of the deployed ReputationSystemContract
    await deployer.deploy(ContentContract, reputationSystem.address);
    const contentContract = await ContentContract.deployed();

    // Deploy the VotingContract with the addresses of the deployed ContentContract and ReputationSystemContract
    await deployer.deploy(VotingContract, contentContract.address, reputationSystem.address);

    // Deploy the ConsentContract
    await deployer.deploy(ConsentContract);
};
