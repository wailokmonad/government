const { expect, assert, use } = require('chai');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers');
const {BigNumber: BN} = require('ethers');


describe('Government Contract', function () {

	let contract;
	let description;
	let choices;
	let startTime;
	let endTime;

	const ONE_DAYS = 86400;

	beforeEach(async function () {
		[owner, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10] = await ethers.getSigners();
		Government = await hre.ethers.getContractFactory('Government');
		contract = await Government.deploy();
		await contract.deployed();

		// add the first proposal here globally
		description = "Presidential Election";
		startTime = Math.ceil(new Date().getTime() / 1000);
		endTime = BN.from(startTime).add( 1 * ONE_DAYS ).toString();
		choices = ["Trump", "Biden"];
		await contract.addProposal(description, startTime, endTime, choices);

	});


    describe("Deployment", function () {

        it("Should set the right owner", async function () {
          	expect(await contract.owner()).to.equal(owner.address);
        });
    
    });


	describe("addProposal", function () {

        it("Should return the first proposal with correct detail", async function () {

			let description = "Will tomorrow be a rainy day?";
			let startTime = Math.ceil(new Date().getTime() / 1000);
			let endTime = BN.from(startTime).add(1 * ONE_DAYS).toString();
			let choices = ["YES", "NO"];

			await contract.addProposal(description, startTime, endTime, choices);

			let p = await contract.getProposal(1);

			expect(p[0]).to.equal(owner.address); //proposer
			expect(p[1]).to.equal(description); //description
			expect(p[2]).to.equal(startTime); //startTime
			expect(p[3]).to.equal(endTime); //endTime
			expect(p[4].length).to.equal(choices.length); //choices
			expect(p[5]).to.equal(true); //active
  
        });

		it("Should NOT add a proposal due to NOT being a part of the community", async function () {

			let description = "Presidential Election";
			let startTime = Math.ceil(new Date().getTime() / 1000);
			let endTime = BN.from(startTime).add(1 * ONE_DAYS).toString();
			let choices = ["A", "B"];

			await expect(
				contract.connect(addr2).addProposal(description, startTime, endTime, choices)
			).to.be.revertedWith('Government::isPartOfCommunity: You are not a part of the community');
  
        });

		it("Should NOT add a proposal due to just one element in the choices array", async function () {

			let description = "Presidential Election";
			let startTime = Math.ceil(new Date().getTime() / 1000);
			let endTime = BN.from(startTime).add(1 * ONE_DAYS).toString();
			let choices = ["Trump"];

			await expect(
				contract.addProposal(description, startTime, endTime, choices)
			).to.be.revertedWith('Government::addProposal: Number of choices cannot be smaller than TWO');
  
        });

		it("Should NOT add a proposal due to empty string in the choices array", async function () {

			let description = "Presidential Election";
			let startTime = Math.ceil(new Date().getTime() / 1000);
			let endTime = BN.from(startTime).add(1 * ONE_DAYS).toString();
			let choices = ["Trump", ""];

			await expect(
				contract.addProposal(description, startTime, endTime, choices)
			).to.be.revertedWith('Government::addProposal: choices cannot include empty string');
  
        });

		it("Should NOT add a proposal due to exceeding MAX_CHOICES in choices array size", async function () {

			let description = "Presidential Election";
			let startTime = Math.ceil(new Date().getTime() / 1000);
			let endTime = BN.from(startTime).add(1 * ONE_DAYS).toString();
			let choices = [];

			for( let i = 0; i < 16 ; i++ ) {
				choices.push(`Trump-${i}`)
			}

			await expect(
				contract.addProposal(description, startTime, endTime, choices)
			).to.be.revertedWith('Government::addProposal: Number of choices cannot be larger than MAX_CHOICES');
  
        });

		it("Should NOT add a proposal due to empty string description", async function () {

			let description = "";
			let startTime = Math.ceil(new Date().getTime() / 1000);
			let endTime = BN.from(startTime).add(1 * ONE_DAYS).toString();
			let choices = ["Trump", "Biden"];

			await expect(
				contract.addProposal(description, startTime, endTime, choices)
			).to.be.revertedWith('Government::addProposal: description cannot be empty');
  
        });
    
    });


	describe("addMember", function () {

		beforeEach(async function () {
			await contract.addAdmin(addr2.address);
			await contract.connect(addr2).addMember([addr3.address, addr4.address, addr5.address, addr6.address, addr7.address, addr8.address, addr9.address, addr10.address]);
		});

        it("Should add addr2 to addr10", async function () {
          	expect(await contract.member(addr2.address)).to.equal(true);
			expect(await contract.member(addr3.address)).to.equal(true);
			expect(await contract.member(addr4.address)).to.equal(true);
			expect(await contract.member(addr5.address)).to.equal(true);
			expect(await contract.member(addr6.address)).to.equal(true);
			expect(await contract.member(addr7.address)).to.equal(true);
			expect(await contract.member(addr8.address)).to.equal(true);
			expect(await contract.member(addr9.address)).to.equal(true);
			expect(await contract.member(addr10.address)).to.equal(true);
        });

		it("Should have 10 members", async function () {
          	expect(await contract.numberOfMember()).to.equal(10);
        });

    });


	describe("removeMember", function () {

		beforeEach(async function () {
			await contract.addMember([addr2.address, addr3.address]);
			await contract.removeMember([addr2.address, addr3.address]);
		});

        it("Should remove addr2", async function () {
          	expect(await contract.member(addr2.address)).to.equal(false);
        });

		it("Should remove addr3", async function () {
          	expect(await contract.member(addr3.address)).to.equal(false);
        });

		it("Should have 1 members", async function () {
          	expect(await contract.numberOfMember()).to.equal(1);
        });

    });


	describe("addAdmin", function () {

		beforeEach(async function () {
			await contract.addAdmin(addr2.address);
		});

        it("Should add addr2 as admin", async function () {
          	expect(await contract.isAdmin(addr2.address)).to.equal(true);
        });

		it("Should have 2 members", async function () {
			expect(await contract.numberOfMember()).to.equal(2);
	  	});

    });


	describe("removeAdmin", function () {

		beforeEach(async function () {
			await contract.addAdmin(addr2.address);
			await contract.removeAdmin(addr2.address);
		});

        it("Should remove as admin", async function () {
          	expect(await contract.isAdmin(addr2.address)).to.equal(false);
        });

		it("Should have 1 members", async function () {
			expect(await contract.numberOfMember()).to.equal(1);
	  	});

    });

	describe("getProposal", function () {

        it("Should a single proposal", async function () {
			let p = await contract.getProposal(0);
			expect(p[1]).to.equal(description);
        });

    });



	describe("batchGetProposal", function () {

		let description;
		let choices;
		let startTime;
		let endTime;

		beforeEach(async function () {

			await contract.addMember([addr2.address]);

			description = "Vacation";
			startTime = Math.ceil(new Date().getTime() / 1000);
			endTime = BN.from(startTime).add( 1 * ONE_DAYS ).toString();
			choices = ["Japan", "Korea", "Thailand", "Singapore", "Beijing"];
			await contract.connect(addr2).addProposal(description, startTime, endTime, choices);

			description = "Lunch";
			startTime = Math.ceil(new Date().getTime() / 1000);
			endTime = BN.from(startTime).add( 1 * ONE_DAYS ).toString();
			choices = ["McDonald", "KFC", "Burger King"];
			await contract.connect(addr2).addProposal(description, startTime, endTime, choices);
		});

        it("Should have 3 proposals", async function () {
			expect(await contract.numberOfProposals()).to.equal(3);
        });


		it("Should return array with 3 proposals", async function () {
			let p = await contract.batchGetProposal(0,2);
			expect(p.length).to.equal(3);
        });

		it("Should return the firt and second proposals", async function () {
			let p = await contract.batchGetProposal(0,1);
			expect(p.length).to.equal(2);
        });

		it("Should return the second and third proposals", async function () {
			let p = await contract.batchGetProposal(1,2);
			expect(p.length).to.equal(2);
        });

		it("Should match the description of the second proposal", async function () {
			let p = await contract.batchGetProposal(1,2);
			let first = p[0]
			expect(first[1]).to.equal("Vacation");
        });

    });


	describe("closeProposal", function () {

		beforeEach(async function () {
			await contract.addAdmin(addr2.address);
			await contract.connect(addr2).closeProposal(0)
		});

		
        it("Should close the first proposal", async function () {
			let p = await contract.getProposal(0);
          	expect(p[5]).to.equal(false);
        });

		it("Should NOT be able to close a proposal because not being an admin", async function () {
			await expect(
				contract.connect(addr3).closeProposal(0)
			).to.be.revertedWith('Government::onlyAdmin: You are not the admin');
        });

		it("Should NOT be able to vote due to proposal being closed", async function () {
			await expect(
				contract.vote(0,0)
			).to.be.revertedWith('Government::isValidVote: The proposal is not active now');
        });

    });


	describe("vote", function () {

		let description;
		let choices;
		let startTime;
		let endTime;

		beforeEach(async function () {
			await contract.addAdmin(addr2.address);
			await contract.connect(addr2).addMember([addr3.address, addr4.address, addr5.address, addr6.address, addr7.address, addr8.address, addr9.address, addr10.address]);

			await contract.vote(0,0);
			await contract.connect(addr2).vote(0,0);
			await contract.connect(addr3).vote(0,0);
			await contract.connect(addr4).vote(0,0);
			await contract.connect(addr5).vote(0,0);
			await contract.connect(addr6).vote(0,0);
			await contract.connect(addr7).vote(0,1);
			await contract.connect(addr8).vote(0,1);
			await contract.connect(addr9).vote(0,1);
			await contract.connect(addr10).vote(0,1);

			description = "Vacation";
			startTime = Math.ceil(new Date().getTime() / 1000);
			endTime = BN.from(startTime).add( 1 * ONE_DAYS ).toString();
			choices = ["Japan", "Korea", "Thailand", "Singapore", "Beijing"];
			await contract.connect(addr2).addProposal(description, startTime, endTime, choices);

			await contract.vote(1,0);
			await contract.connect(addr2).vote(1,1);
			await contract.connect(addr3).vote(1,1);
			await contract.connect(addr4).vote(1,1);
			await contract.connect(addr5).vote(1,2);
			await contract.connect(addr6).vote(1,2);
			await contract.connect(addr7).vote(1,2);
			await contract.connect(addr8).vote(1,2);
			await contract.connect(addr9).vote(1,3);
			await contract.connect(addr10).vote(1,4);

			description = "Lunch";
			startTime = Math.ceil(new Date().getTime() / 1000);
			endTime = BN.from(startTime).add( 1 * ONE_DAYS ).toString();
			choices = ["McDonald", "KFC", "Burger King"];
			await contract.connect(addr2).addProposal(description, startTime, endTime, choices);

		});

        it("Should have 10 member", async function () {
          	expect(await contract.numberOfMember()).to.equal(10);
        });

		it("Should return the correct votes for first proposal", async function () {
			let p = await contract.getProposal(0);
			let votes = p[6]
			expect(votes[0]).to.equal(6);
			expect(votes[1]).to.equal(4);
	  	});

		it("Should return the correct votes for second proposal", async function () {
			let p = await contract.getProposal(1);
			let votes = p[6]
			expect(votes[0]).to.equal(1);
			expect(votes[1]).to.equal(3);
			expect(votes[2]).to.equal(4);
			expect(votes[3]).to.equal(1);
			expect(votes[4]).to.equal(1);
	  	});

		it("Should NOT be able to vote on a non-existing proposal", async function () {
			await expect(
				contract.vote(10,0)
			).to.be.revertedWith("Government::isValidProposal: The proposal doesn't exist");
	  	});

		it("Should NOT be able to vote TWO times", async function () {
			await expect(
				contract.vote(1,1)
			).to.be.revertedWith("Government::isValidVote: Already voted on this proprosal");
	  	});

		it("Should NOT be able to vote on a non-existing choices", async function () {
			await expect(
				contract.vote(2,3)
			).to.be.revertedWith("Government::isValidChoice: The choice doesn't exist");
	  	});


		it("Should NOT be able to vote due to contract being paused", async function () {

			let description = "testing";
			let startTime = Math.ceil(new Date().getTime() / 1000) - 1;
			let endTime = BN.from(startTime).add( 1 * ONE_DAYS ).toString();
			let choices = ["A", "B", "C"];
			await contract.connect(addr2).addProposal(description, startTime, endTime, choices);

			await contract.pause();

			await expect(
				contract.vote(3,0)
			).to.be.revertedWith("Pausable: paused");

	  	});

		
		it("Should NOT be able to vote because the proposal haven't started yet", async function () {

			let description = "testing";
			let startTime = Math.ceil(new Date().getTime() / 1000) + 86400;
			let endTime = BN.from(startTime).add( 1 * ONE_DAYS ).toString();
			let choices = ["A", "B", "C"];
			await contract.connect(addr2).addProposal(description, startTime, endTime, choices);

			await expect(
				contract.vote(3,0)
			).to.be.revertedWith("Government::isValidVote: The proposal haven't started yet");
	  	});

		it("Should NOT be able to vote because the proposal haven already ended", async function () {

			await network.provider.send('evm_increaseTime', [86401]);
			await network.provider.send('evm_mine');

			await expect(
				contract.vote(2,0)
			).to.be.revertedWith("Government::isValidVote: The proposal have already ended");
	  	});

    });

	after(async function () {});
});
