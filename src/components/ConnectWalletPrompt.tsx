import React from 'react';
import { Button, Typography, Box } from '@mui/material';

interface ConnectWalletPromptProps {
  connectWallet: () => void;
}

const ConnectWalletPrompt: React.FC<ConnectWalletPromptProps> = ({ connectWallet }) => {
  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Connect Your Wallet
      </Typography>
      <Typography variant="body1" gutterBottom>
        Please connect your wallet to interact with the application.
      </Typography>
      <Button variant="contained" color="primary" onClick={connectWallet}>
        Connect Wallet
      </Button>
    </Box>
  );
};

export default ConnectWalletPrompt;
