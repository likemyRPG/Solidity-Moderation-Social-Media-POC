import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import TruffleContract from 'truffle-contract';
import { Container, TextField, Button, Card, CardContent, Typography, CircularProgress, ThemeProvider, createTheme, CardActions, CardMedia, IconButton, AppBar, Toolbar } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { styled } from '@mui/system';
import { Box, CssBaseline } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import contentContract from './contracts/ContentContract.json';
import reputationSystemContract from './contracts/ReputationSystemContract.json';

import BlockchainActivityLog from './components/BlockchainActivityLog';

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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

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
            5777: 'http://127.0.0.1:7545',
          }
        }
      }
    }
  });

  // Define the connectWallet function
  const connectWallet = async () => {
    try {
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
    }
    catch (error) {
      console.error("Error connecting to wallet:", error);
        // Handle errors like user closing the modal here
        if(error instanceof Error && error.message === "Modal closed by user") {
            console.log("Wallet connection cancelled by user.");
            setSnackbar({ open: true, message: 'Wallet connection cancelled by user.', severity: 'info' });
        } else {
            console.error("An unexpected error occurred:", error);
            setSnackbar({ open: true, message: 'Something went wrong while connecting to your wallet.', severity: 'error' });
        }
    }
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
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
    setMenuAnchorEl(null);
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

  const disconnectWallet = () => {
    web3Modal.clearCachedProvider();
    setAccount('');
    setReputation(0);
    setPosts([]);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Decentralized Content Platform
          </Typography>
          {account ? (
            <>
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    Reputation: {reputation}
                  </Typography>
                <AccountBalanceWalletIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {balance.substring(0, 6)} ETH
                  </Typography>
              <IconButton color="inherit" onClick={handleMenuOpen}>
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}  // Controls where the menu is anchored in relation to the IconButton
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}  // Controls the origin point of the Menu animation
              >
                <MenuItem onClick={handleMenuClose}>
                  <Typography variant="body2" noWrap>
                    {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={disconnectWallet}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" onClick={connectWallet}>Connect Wallet</Button>
          )}
        </Toolbar>
      </AppBar>
      <BlockchainActivityLog web3={web3} />
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
            <Button variant="contained" color="primary" onClick={handleConnectWallet} fullWidth>
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
