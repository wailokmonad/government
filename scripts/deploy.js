
const hre = require("hardhat");

async function main() {

  console.log("starting...");

  const Government = await hre.ethers.getContractFactory("Government");
  const contract = await Government.deploy();

  await contract.deployed();

  console.log("Government deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
