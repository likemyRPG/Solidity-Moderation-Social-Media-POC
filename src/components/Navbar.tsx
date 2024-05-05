import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { Link } from 'react-router-dom';

interface NavBarProps {
  account: string;
  disconnectWallet: () => void;
  connectWallet: () => void;
  reputation?: number;
  balance?: string;
}

const NavBar: React.FC<NavBarProps> = ({
  account,
  disconnectWallet,
  connectWallet,
  reputation,
  balance
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'start' }}>
          Decentralized Content Platform
        </Typography>
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/activity-log">Activity Log</Button>
        </Box>
        {account ? (
          <>
            <Typography variant="body2" sx={{ ml: 1, flexGrow: 1, textAlign: 'right' }}>
              Rep: {reputation} | {balance?.substring(0, 6)} ETH
            </Typography>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
  );
};

export default NavBar;
