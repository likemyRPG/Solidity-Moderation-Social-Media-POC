const VotingContract = artifacts.require("VotingContract");
const ContentContract = artifacts.require("ContentContract");
const ReputationSystemContract = artifacts.require("ReputationSystemContract");

contract("VotingContract", accounts => {
    let votingContract, contentContract, reputationSystemContract;
    const [admin, user1, user2] = accounts;

    before(async () => {
        reputationSystemContract = await ReputationSystemContract.new();
        contentContract = await ContentContract.new(reputationSystemContract.address);
        votingContract = await VotingContract.new(contentContract.address, reputationSystemContract.address);

        // Initialize user1's reputation to participate in voting
        await reputationSystemContract.adjustReputationAdmin(user1, 20, { from: admin }); // Admin boosts user1's reputation
    });

    describe("User voting on content", () => {
        it("should allow a user with sufficient reputation to vote", async () => {
            // User1 creates content
            await contentContract.createContent("Sample Content", { from: user1 });
            // User1 votes on his own content (upvote)
            await votingContract.vote(0, true, { from: user1 });

            // Check the updated score and reputation
            let content = await contentContract.contents(0);
            assert.equal(content.score.toNumber(), 2, "Content score did not update correctly"); // Assuming score changes by reputation weight

            let reputation = await reputationSystemContract.getReputation(user1);
            assert.equal(reputation.toNumber(), 22, "Reputation did not update correctly"); // Check if reputation increased correctly
        });

        it("should not allow a user with insufficient reputation to vote", async () => {
            // User2 tries to vote without enough reputation
            try {
                await votingContract.vote(0, true, { from: user2 });
                assert.fail("The transaction should have reverted.");
            } catch (error) {
                assert.include(error.message, "revert Insufficient reputation to vote", "The revert message was not present");
            }
        });
    });
});
