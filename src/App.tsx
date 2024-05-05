import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import TruffleContract from 'truffle-contract';
import { Container, TextField, Button, Card, CardContent, Typography, CircularProgress, ThemeProvider, createTheme, CardActions, CardMedia, IconButton, AppBar, Toolbar } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { styled } from '@mui/system';
import { Box, CssBaseline } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Tooltip } from '@mui/material';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';

import contentContract from './contracts/ContentContract.json';
import reputationSystemContract from './contracts/ReputationSystemContract.json';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', // black
    },
    secondary: {
      main: '#ffffff', // white
    },
    background: {
      default: '#ffffff', // white
      paper: '#ffffff',
    },
    text: {
      primary: '#000000', // black
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#000000', // black
          color: '#ffffff', // white
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#ffffff', // white
        },
      },
    },
  },
});

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

type Severity = 'error' | 'info' | 'success' | 'warning' | undefined;

const App: React.FC = () => {
  const [account, setAccount] = useState<string>('');
  const [reputation, setReputation] = useState<number>(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingVotes, setLoadingVotes] = useState<boolean[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: Severity }>({ open: false, message: '', severity: 'info' });
  const [balance, setBalance] = useState<string>('0');

  const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
  const web3 = new Web3(provider);
  const ContentContract = TruffleContract(contentContract);
  const ReputationSystemContract = TruffleContract(reputationSystemContract);
  ContentContract.setProvider(web3.currentProvider);
  ReputationSystemContract.setProvider(web3.currentProvider);

  const web3Modal = new Web3Modal({
    network: "development", // Match the network to your Ganache
    cacheProvider: true, // Enables reconnection on page reloads
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: {
            5777: 'http://127.0.0.1:7545' // Your local Ganache RPC URL
          }
        }
      }
    }
  });

  // Define the connectWallet function
  const connectWallet = async () => {
    const provider = await web3Modal.connect(); // Connect using Web3Modal
    const web3 = new Web3(provider);

    provider.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        loadReputationAndPosts(accounts[0], web3);
      } else {
        setAccount('');
      }
    });

    provider.on("chainChanged", (_chainId: number) => window.location.reload());

    provider.on("disconnect", (_error: { code: number; message: string }) => {
      setAccount('');
    });

    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);
    updateBalance(accounts[0]);
    await loadReputationAndPosts(accounts[0], web3);
  };

  const updateBalance = async (account: string) => {
    const balance = await web3.eth.getBalance(account);
    setBalance(web3.utils.fromWei(balance, 'ether'));
  };

  const loadReputationAndPosts = async (account: string, web3: Web3) => {
    setLoading(true);
    try {
      const reputationInstance = await ReputationSystemContract.deployed();
      const userReputation = await reputationInstance.getReputation(account);
      setReputation(userReputation.toNumber());

      const contentInstance = await ContentContract.deployed();
      const contentCountBN = await contentInstance.getContentsCount();
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
    } catch (error) {
      console.error("Error loading data", error);
      setSnackbar({ open: true, message: 'An error occurred while loading the app.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {  
    // Initialize wallet connection on component mount
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  
  }, [web3Modal.cachedProvider]);

  const handleConnectWallet = async () => {
    await connectWallet();
  };

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
      await contentInstance.createContent(newPost, { from: account });
      setNewPost('');
      const contentCountBN = await contentInstance.getContentsCount();
      const contentCount = contentCountBN.toNumber();
      loadPosts(contentCount, contentInstance);
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'An error occurred while posting.', severity: 'error' });
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
    } catch (error) {
      console.error("Error voting", error);
      setSnackbar({ open: true, message: 'Failed to vote', severity: 'error' });
    } finally {
      setLoadingVotes(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleConnectClick = () => {
    if (account) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const disconnectWallet = () => {
    web3Modal.clearCachedProvider();
    setAccount('');
    setReputation(0);
    setPosts([]);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <IconButton edge="start" color="inherit" aria-label="menu">
                <MenuIcon />
              </IconButton>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" align="center">
                Decentralized Content Platform
              </Typography>
            </Grid>
            <Grid item>
              {account ? (
                <div>
                  <Tooltip title="Wallet Address">
                    <IconButton color="inherit">
                      <AccountCircle />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {account.substring(0, 6)}...{account.substring(account.length - 4)}
                      </Typography>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ETH Balance">
                    <IconButton color="inherit">
                      <AccountBalanceWalletIcon />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {balance} ETH
                      </Typography>
                    </IconButton>
                  </Tooltip>
                  <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                  <Typography variant="caption" sx={{ verticalAlign: 'middle' }}>
                    Reputation: {reputation}
                  </Typography>
                  <Button color="inherit" onClick={handleConnectClick} sx={{ ml: 2 }}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Button color="inherit" onClick={handleConnectClick}>
                  Connect Wallet
                </Button>
              )}
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Typography variant="h3" component="h1" sx={{ textAlign: 'center', my: 3 }}>
          Decentralized Content Platform
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
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
              <IconButton
                aria-label="upvote"
                onClick={() => handleVote(post.id, true)}
                disabled={loadingVotes[post.id]}
              >
                {loadingVotes[post.id] ? <CircularProgress size={24} /> : <ThumbUpIcon color="primary" />}
              </IconButton>
              <IconButton
                aria-label="downvote"
                onClick={() => handleVote(post.id, false)}
                disabled={loadingVotes[post.id]}
              >
                {loadingVotes[post.id] ? <CircularProgress size={24} /> : <ThumbDownIcon color="error" />}
              </IconButton>
                <Typography sx={{ marginLeft: 'auto' }}>Votes: {post.votes}</Typography>
              </CardActions>
            </StyledCard>
          ))}
        </PostContainer>
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default App;
