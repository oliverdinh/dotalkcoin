

module.exports = {
  networks: {

      development: {
      host: "localhost",
      port: 8545,
      //gas:4500000,
      network_id: "*" // Match any network id
    },
      rinkeby: {
          host: "localhost", // Connect to geth on the specified
          port: 8545,
          network_id: 4,
          gas: 4612388 // Gas limit used for deploys
      }
      ,
      mainnet: {
          host: "localhost", // Connect to geth on the specified
          port: 8545,
          network_id: 1,
          gasPrice:20000000000,
          gas: 6612388 // Gas limit used for deploys
      }
  }
};
