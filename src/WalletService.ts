import Web3 from 'web3';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

class WalletService {
    private web3Modal: Web3Modal;
    private provider: any;
    public web3: Web3 | null = null;

    constructor() {
        const providerOptions = {
            walletconnect: {
                package: WalletConnectProvider,  // required
                options: {
                    infuraId: "YOUR_INFURA_ID", // required unless you're using a custom RPC provider
                    rpc: {
                      5777: 'http://127.0.0.1:7545'  // This is the Ganache default RPC
                    }
                }
            }
        };

        this.web3Modal = new Web3Modal({
            network: "development", // Optional: set this to the network you want (e.g., 'mainnet' or 'testnet')
            cacheProvider: true, // optional
            providerOptions // required
        });
    }

    async connectWallet(): Promise<Web3 | null> {
        try {
            this.provider = await this.web3Modal.connect(); // This will open the modal to connect a wallet
            this.web3 = new Web3(this.provider);

            this.provider.on("accountsChanged", (accounts: string[]) => {
                console.log("accounts changed", accounts);
            });

            this.provider.on("chainChanged", (chainId: number) => {
                console.log("chain changed", chainId);
            });

            this.provider.on("disconnect", (code: number, reason: string) => {
                console.log("disconnected", code, reason);
            });

            return this.web3;
        } catch (e) {
            console.error("Could not get a wallet connection", e);
            return null;
        }
    }

    disconnect() {
        if (this.web3Modal.cachedProvider) {
            this.web3Modal.clearCachedProvider();
            if (this.provider?.disconnect && typeof this.provider.disconnect === 'function') {
                this.provider.disconnect();
            }
        }
    }
}

export default new WalletService();
