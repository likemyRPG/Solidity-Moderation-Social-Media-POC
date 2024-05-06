import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import TruffleContract from 'truffle-contract';
import { Container, TextField, Button, Card, CardContent, Typography, CircularProgress, ThemeProvider, CardActions, CardMedia, IconButton } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { styled } from '@mui/system';
import { Box, CssBaseline } from '@mui/material';
import theme from 'src/theme';
import Tooltip from '@mui/material/Tooltip';

import contentContract from '../contracts/ContentContract.json';
import reputationSystemContract from '../contracts/ReputationSystemContract.json';
import { useSnackbar } from '../context/SnackbarContext';

const StyledCard = styled(Card)({
  width: '100%', // Use full container width
  marginBottom: '20px',
  backgroundColor: '#f7f7f7',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
});

const PostContainer = styled(Box)({
  marginTop: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  gap: '15px',
});

interface Post {
  id: number;
  data: string;
  votes: number;
  isFlagged: boolean;
  author: string;
}

interface HomeProps {
  web3: Web3;
  account: string;
}

const Home: React.FC<HomeProps> = ({ web3, account }) => {
  const [reputation, setReputation] = useState<number>(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingVotes, setLoadingVotes] = useState<boolean[]>([]);
  const { setSnackbar } = useSnackbar();

  const ContentContract = TruffleContract(contentContract);
  const ReputationSystemContract = TruffleContract(reputationSystemContract);
  ContentContract.setProvider(web3.currentProvider);
  ReputationSystemContract.setProvider(web3.currentProvider);


  const loadReputationAndPosts = async (account: string, web3: Web3) => {
    const ContentContract = TruffleContract(contentContract);
    ContentContract.setProvider(web3.currentProvider);
  
    const ReputationSystemContract = TruffleContract(reputationSystemContract);
    ReputationSystemContract.setProvider(web3.currentProvider);
  
    setLoading(true);
    try {
      const reputationInstance = await ReputationSystemContract.deployed();
      const userReputation = await reputationInstance.getReputation.call(account);
      setReputation(userReputation.toNumber());
  
      const contentInstance = await ContentContract.deployed();
      const contentCountBN = await contentInstance.getContentsCount.call();
      const contentCount = contentCountBN.toNumber();
      const fetchedPosts: Post[] = [];
      for (let i = 0; i < contentCount; i++) {
        const post = await contentInstance.contents(i);
        fetchedPosts.push({
          id: post.id.toNumber(),
          data: post.data,
          votes: post.score.toNumber(),
          isFlagged: post.isFlagged,
          author: post.author,
        });
      }
      setPosts(fetchedPosts);
      setSnackbar({ open: true, message: 'Successfully loaded posts and reputation.', severity: 'success' });
    } catch (error) {
      console.error("Error loading data", error);
      setSnackbar({ open: true, message: `Failed to load posts and reputation: ${error}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && web3) {
      loadReputationAndPosts(account, web3);
    }
  }, [account, web3]);

  const loadPosts = async (count, instance) => {
    const fetchedPosts: Post[] = [];
    console.log(fetchedPosts)
    for (let i = 0; i < count; i++) {
      const post = await instance.contents(i);
      console.log(post)
      fetchedPosts.push({
        id: post.id.toNumber(),
        data: post.data,
        votes: post.score.toNumber(),
        isFlagged: post.isFlagged,
        author: post.author,
      });
    }
    setPosts(fetchedPosts);
  };

  const handleNewPost = async () => {
    setLoading(true);
    try {
        const contentInstance = await ContentContract.deployed();
        await contentInstance.createContent(newPost, { from: account })
            .then(() => {
                setNewPost('');
                setSnackbar({ open: true, message: 'Successfully posted.', severity: 'success' });
            })
            .catch((error) => {
                if (error.code === 4001) { // Check if the rejection is because the user denied the transaction
                    setSnackbar({ open: true, message: 'Transaction signature denied by user.', severity: 'info' });
                } else {
                    throw error; // Rethrow if it's a different error
                }
            });
    } catch (error: any) {
        console.error("Failed to post", error);
        setSnackbar({ open: true, message: `Failed to post due to an error: ${error.message}`, severity: 'error' });
    } finally {
        setLoading(false);
    }
};

  
  const handleVote = async (postId, upvote) => {
    setLoadingVotes(prev => ({ ...prev, [postId]: true }));
    try {
      const contentInstance = await ContentContract.deployed();
      const change = upvote ? 1 : -1;
      await contentInstance.updateScore(postId, change, { from: account });
      const updatedPost = await contentInstance.contents(postId);
      setPosts(prevPosts => prevPosts.map(post => post.id === postId ? { ...post, votes: updatedPost.score.toNumber() } : post));
      setSnackbar({ open: true, message: 'Successfully voted.', severity: 'success' });
    } catch (error: any) {
      console.error("Error voting", error);
      const errorMessage = error.code === 4001 ? 'Transaction signature denied.' : 'Failed to vote.';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoadingVotes(prev => ({ ...prev, [postId]: false }));
    }
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
      <Typography variant="h4" align="center" sx={{ my: 4 }}>
          {account ? 'Post Your Thoughts' : 'Connect Your Wallet'}
        </Typography>
        {account ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
            <TextField
              fullWidth
              label="Write something..."
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              variant="outlined"
              sx={{ width: '80%' }}
            />
            <Button variant="contained" color="primary" onClick={handleNewPost} disabled={!newPost || loading} sx={{ mt: 2 }}>
              Post
            </Button>
            {loading && <CircularProgress />}
          </Box>
          ) : (
            <Button variant="contained" color="primary" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
              Connect Wallet
            </Button>
          )}
        <PostContainer>
          {posts.map(post => (
            <StyledCard key={post.id}>
              <CardMedia
                component="img"
                height="140"
                image={`https://picsum.photos/seed/${post.id + 1}/500`}
                alt="Random"
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {post.data}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Author: {post.author} | {post.isFlagged ? 'Flagged' : 'Not Flagged'}
                </Typography>
              </CardContent>
              <CardActions disableSpacing>
              <Tooltip title="Votes are securely and transparently recorded on the blockchain, ensuring that all voting activity is verifiable and tamper-proof.">
                <IconButton
                  aria-label="upvote"
                  onClick={() => handleVote(post.id, true)}
                  disabled={loadingVotes[post.id]}
                >
                  {loadingVotes[post.id] ? <CircularProgress size={24} /> : <ThumbUpIcon color="primary" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Votes are securely and transparently recorded on the blockchain, ensuring that all voting activity is verifiable and tamper-proof.">
                <IconButton
                  aria-label="downvote"
                  onClick={() => handleVote(post.id, false)}
                  disabled={loadingVotes[post.id]}
                >
                  {loadingVotes[post.id] ? <CircularProgress size={24} /> : <ThumbDownIcon color="error" />}
                </IconButton>
              </Tooltip>
                <Typography sx={{ marginLeft: 'auto' }}>Votes: {post.votes}</Typography>
              </CardActions>
            </StyledCard>
          ))}
        </PostContainer>
      </Container>
    </ThemeProvider>
  );
};

export default Home;