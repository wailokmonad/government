# Government Contract

This is a government smart contract project that would allow people in the community to propose ideas and vote on it. The contract is expected to be deployed and run in EVM-based blockchains.

Rinkeby contract address: 0xB268A43cBfc1c047eB4d93504749Eb3C7CBFB64E

<br />

### 1) Install the dependencies
```shell
npm i
```

<br />

### 2) Compile the contract
```shell
npx hardhat compile
```

<br />

### 3) Run the test cases to verify the contract functinalities
```shell
npx hardhat test
```
You should see a total of 34 test cases passed sucessfully

<br />

### 4) Set up the .env file based on env.sample
```
PRIVATE_KEY = "your private key"
ETHERSCAN_KEY = "etherscan key"
```
<br />

### 5) Deploy the rinkeby testnet
```shell
npx hardhat run scripts/deploy.js --network rinkeby
```

Then you should see something like this

```shell
Government deployed to: {contract address}
```

<br />

### 6) Verify the contract
```shell
npx hardhat verify {contract address} --network rinkeby 
```

Then you should see something like this

```shell
Successfully verified contract Government on Etherscan.
https://rinkeby.etherscan.io/address/{contract address}#code
```





