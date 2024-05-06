import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container } from '@mui/material';
import Home from './pages/Home'; 
import BlockchainActivityLog from './components/BlockchainActivityLog';
import DecentralizationBenefits from './components/DecentralizationBenefits';
import ConnectWalletPrompt from './components/ConnectWalletPrompt';
import theme from './theme'; 
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import NavBar from './components/Navbar';
import reputationSystemContract from './contracts/ReputationSystemContract.json';
import { SnackbarProvider } from './context/SnackbarContext';
import UserProfile from './components/UserProfile';


const Web3Context = createContext({ web3: null, account: '' });
export const useWeb3Context = () => useContext(Web3Context);


const App: React.FC = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string>('');
  const [reputation, setReputation] = useState<number>(0);
  const [balance, setBalance] = useState<string>('0');

  const web3Modal = new Web3Modal({
    network: "development",
    cacheProvider: true,
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

  useEffect(() => {
    const initWeb3 = async () => {
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            rpc: { 5777: 'http://127.0.0.1:7545' },
          },
        },
      };

      try {
        const provider = await web3Modal.connect();
        const web3Instance = new Web3(provider);

        provider.on("accountsChanged", (accounts: string[]) => {
          setAccount(accounts[0] || '');
          fetchAccountData(web3Instance, accounts[0]);
        });

        provider.on("chainChanged", (_chainId: string) => {
          fetchAccountData(web3Instance, account);
        });

        provider.on("disconnect", () => {
          setAccount('');
          setWeb3(null);
        });

        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchAccountData(web3Instance, accounts[0]);
        }
      } catch (error) {
        console.error("Web3Modal connection failed:", error);
      }
    };

    initWeb3();
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = event => {
      console.error('Unhandled rejection:', event.promise, 'reason:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const connectWallet = async () => {
    try {
      const provider = await web3Modal.connect();
      const web3Instance = new Web3(provider);

      provider.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0] || '');
        fetchAccountData(web3Instance, accounts[0]);
      });

      provider.on("chainChanged", (_chainId: string) => window.location.reload());

      provider.on("disconnect", () => {
        setAccount('');
        setWeb3(null);
      });

      setWeb3(web3Instance);
      const accounts = await web3Instance.eth.getAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        fetchAccountData(web3Instance, accounts[0]);
      }
    } catch (error) {
      console.error("Web3Modal connection failed:", error);
    }
  }

  const fetchAccountData = async (web3, account) => {
    if (!web3 || !account) return;
    const balanceWei = await web3.eth.getBalance(account);
    const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
    setBalance(balanceEth);

    // Fetch reputation here (you'll need to add this logic based on your contract)
    const reputation = await fetchReputation(web3, account); // Implement this function
    setReputation(reputation);
  };

  interface Web3ContextValue {
    web3: Web3 | null;
    account: string;
  }
  
  const Web3Context = React.createContext<Web3ContextValue | null>(null);

  const logout = () => {
    web3Modal.clearCachedProvider();
    setWeb3(null);
    setAccount('');
    window.location.reload(); // Optionally force reload to clear all app state
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
      <Router>
        <Web3Context.Provider value={{ web3, account }}>
          <NavBar
            account={account}
            balance={balance}
            reputation={reputation}
            disconnectWallet={logout}
            connectWallet={connectWallet}
          />
          <Container maxWidth="md">
            <Routes>
              <Route path="/" element={web3 ? <Home web3={web3} account={account} /> : <ConnectWalletPrompt connectWallet={connectWallet} />} />
              <Route path="/activity-log" element={web3 ? <BlockchainActivityLog web3={web3} /> : <ConnectWalletPrompt connectWallet={connectWallet} />} />
              <Route path="/benefits" element={<DecentralizationBenefits />} />
              <Route path="/profile" element={web3? <UserProfile web3={web3} account={account} /> : <ConnectWalletPrompt connectWallet={connectWallet} />} />
            </Routes>
          </Container>
        </Web3Context.Provider>
      </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;

function fetchReputation(web3, account) {
  const ReputationSystemContract = new web3.eth.Contract(reputationSystemContract.abi, reputationSystemContract.networks['5777'].address);
  return ReputationSystemContract.methods.getReputation(account).call();
}
