const ContentContract = artifacts.require("ContentContract");

contract("ContentContract", accounts => {
    let contentContract;

    before(async () => {
        contentContract = await ContentContract.deployed();
    });

    describe("createContent", () => {
        it("should create content successfully", async () => {
            await contentContract.createContent("Hello, world!");
            const content = await contentContract.contents(0);
            assert.equal(content.data, "Hello, world!", "Content was not created correctly.");
        });
    });

    describe("flagContent", () => {
        it("should flag content when score falls below threshold", async () => {
            const contentId = 0;
            // Assume flagThreshold is set to -10 and default score is 0
            await contentContract.updateScore(contentId, -11); // Update score to simulate downvotes
            const content = await contentContract.contents(contentId);
            assert.equal(content.isFlagged, true, "Content was not flagged as expected.");
        });
    });
});
