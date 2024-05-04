import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import TruffleContract from 'truffle-contract';
// contracts are in the build folder
import contentContract from './contracts/ContentContract.json';
import reputationSystemContract from './contracts/ReputationSystemContract.json';

interface Post {
  id: number;
  data: string;
  votes: number;
}

const App: React.FC = () => {
  const [account, setAccount] = useState<string>('');
  const [reputation, setReputation] = useState<number>(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<string>('');

  // Initialize web3 and contracts
  const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
  const web3 = new Web3(provider);
  const ContentContract = TruffleContract(contentContract);
  const ReputationSystemContract = TruffleContract(reputationSystemContract);
  ContentContract.setProvider(web3.currentProvider);
  ReputationSystemContract.setProvider(web3.currentProvider);

  useEffect(() => {
    const init = async () => {
      const accounts = await web3.eth.getAccounts();
      if (accounts.length === 0) {
        console.error("No accounts found.");
        return;
      }
      setAccount(accounts[0]);

      const reputationInstance = await ReputationSystemContract.deployed();
      const userReputation = await reputationInstance.getReputation(accounts[0]);
      setReputation(userReputation.toNumber()); // Ensure conversion to JavaScript number

      const contentInstance = await ContentContract.deployed();
      const contentCountBN = await contentInstance.getContentsCount();
      const contentCount = contentCountBN.toNumber(); // Convert BN to number

      const fetchedPosts: Post[] = [];
      for (let i = 0; i < contentCount; i++) {
        const post = await contentInstance.contents(i);
        fetchedPosts.push({
          id: post.id.toNumber(), // Ensure conversion to JavaScript number
          data: post.data,
          votes: post.score.toNumber() // Convert BN to number for score
        });
      }
      setPosts(fetchedPosts);
    };
    init();
  }, []);

  const handleNewPost = async () => {
    const contentInstance = await ContentContract.deployed();
    await contentInstance.createContent(newPost, { from: account });
    setNewPost('');
    // Optionally, refresh the posts list here
  };

  const handleVote = async (postId: number, upvote: boolean) => {
    const contentInstance = await ContentContract.deployed();
    const change = upvote ? 1 : -1;
    await contentInstance.updateScore(postId, change, { from: account });
    // Optionally, update the post's score in the local state here
  };

  return (
    <div>
      <h1>Decentralized Content Platform</h1>
      <div>
        <h2>Your Reputation: {reputation}</h2>
        <input value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Write something..." />
        <button onClick={handleNewPost}>Post</button>
      </div>
      <div>
        {posts.map(post => (
          <div key={post.id}>
            <p>{post.data}</p>
            <button onClick={() => handleVote(post.id, true)}>Upvote</button>
            <button onClick={() => handleVote(post.id, false)}>Downvote</button>
            <span>Votes: {post.votes}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;


