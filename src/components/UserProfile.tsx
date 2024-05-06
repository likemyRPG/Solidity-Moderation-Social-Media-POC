import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, CircularProgress, Container, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Web3 from 'web3';
import TruffleContract from 'truffle-contract';
import contentContract from '../contracts/ContentContract.json';
import consentContract from '../contracts/ConsentContract.json';
import { useSnackbar } from '../context/SnackbarContext';
import theme from 'src/theme';

interface Post {
  id: number;
  data: string;
  votes: number;
  isFlagged: boolean;
  author: string;
}

interface UserProfileProps {
  web3: Web3;
  account: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ web3, account }) => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reputation, setReputation] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const { setSnackbar } = useSnackbar();

  useEffect(() => {
    const checkConsent = async () => {
      if (!web3 || !account) return;

      const Consent = TruffleContract(consentContract);
      Consent.setProvider(web3.currentProvider);
      const consentInstance = await Consent.deployed();

      try {
        const status = await consentInstance.checkConsent(account);
        setConsentGiven(status);
        if (!status) {
          setConsentDialogOpen(true); // Open consent dialog if no consent given
        }
      } catch (error) {
        console.error('Error checking consent status:', error);
        setSnackbar({ open: true, message: 'Failed to check consent status.', severity: 'error' });
      }
    };

    checkConsent();
  }, [web3, account, setSnackbar]);

  useEffect(() => {
    if (consentGiven) {
      fetchUserData();
    }
  }, [consentGiven]);

  const fetchUserData = async () => {
    if (!web3 || !account) return;

    const Content = TruffleContract(contentContract);
    Content.setProvider(web3.currentProvider);

    setLoading(true);
    try {
      const contentInstance = await Content.deployed();
      const postsData = await contentInstance.getAuthorContents(account);

      const posts = await Promise.all(postsData.map(async (postId) => {
        const post = await contentInstance.contents(postId.toNumber());
        return {
          id: postId.toNumber(),
          data: post[1], // Assuming index 1 is data
          votes: post[4].toNumber(), // Assuming index 4 is votes
          isFlagged: post[3], // Assuming index 3 is isFlagged
          author: post[2] // Assuming index 2 is author
        };
      }));

      setPosts(posts);
      const reputationData = await contentInstance.getAuthorScore(account);
      setReputation(reputationData.toNumber());
      setSnackbar({ open: true, message: 'Data loaded successfully.', severity: 'success' });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setSnackbar({ open: true, message: 'Failed to load data.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConsentDialogClose = (giveConsent) => {
    setConsentDialogOpen(false);
    handleConsentChange(giveConsent);
  };

  const handleConsentChange = async (giveConsent) => {
    const Consent = TruffleContract(consentContract);
    Consent.setProvider(web3.currentProvider);
    const consentInstance = await Consent.deployed();

    if (giveConsent) {
      await consentInstance.giveConsent({ from: account });
      setConsentGiven(true);
    } else {
      await consentInstance.withdrawConsent({ from: account });
      setConsentGiven(false);
    }

    setSnackbar({ open: true, message: `Consent ${giveConsent ? 'given' : 'withdrawn'}.`, severity: 'success' });
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>Your Profile</Typography>
      <Typography variant="h6">Reputation: {reputation}</Typography>
      <Button variant="contained" onClick={() => handleConsentDialogClose(true)} disabled={consentGiven}>
        Give Consent
      </Button>
      <Button variant="contained" onClick={() => handleConsentDialogClose(false)} disabled={!consentGiven}>
        Withdraw Consent
      </Button>
      {loading ? (
        <CircularProgress />
      ) : (
        posts.map((post, index) => (
          <Card key={index} sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h5">{post.data}</Typography>
              <Typography variant="body2">{`Votes: ${post.votes} | ${post.isFlagged ? 'Flagged' : 'Not Flagged'}`}</Typography>
            </CardContent>
          </Card>
        ))
      )}
      <Dialog
        open={consentDialogOpen}
        onClose={() => setConsentDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        color='primary'
      >
        <DialogTitle id="alert-dialog-title">{"User Data Consent"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Your posts will be stored on a blockchain, which is immutable. Once data is added, it cannot be edited or deleted. Do you consent to this method of data storage?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConsentDialogClose(false)} color="primary" style={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
            Disagree
          </Button>
          <Button onClick={() => handleConsentDialogClose(true)} autoFocus color='primary' style={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile;
