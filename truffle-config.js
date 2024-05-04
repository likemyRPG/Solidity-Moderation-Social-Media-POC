module.exports = {
    networks: {
      development: {
        host: "127.0.0.1",
        port: 7545, // Default Ganache port; adjust if your Ganache is running on a different port
        network_id: "*", // Match any network
        gas: 6721975, // Gas limit used for deploys
        gasPrice: 20000000000, // Gas price used for deploys
      },
    },
    // Configure compilers
    compilers: {
      solc: {
        version: "0.8.19", // Fetch exact version from solc-bin
      }
    }
  };
  