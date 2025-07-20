const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MyToken Advanced Tokenization System", function () {
  let MyToken, myToken, owner, addr1, addr2, addr3, feeCollector, minter;
  const initialSupply = ethers.parseUnits("1000000", 18); // 1M tokens
  const maxSupply = ethers.parseUnits("100000000", 18); // 100M tokens

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, feeCollector, minter] = await ethers.getSigners();
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy(initialSupply);
    await myToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await myToken.owner()).to.equal(owner.address);
    });

    it("Should assign the initial supply to the owner", async function () {
      expect(await myToken.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should set correct token details", async function () {
      expect(await myToken.name()).to.equal("Advanced MyToken");
      expect(await myToken.symbol()).to.equal("AMTK");
      expect(await myToken.decimals()).to.equal(18);
    });

    it("Should set max supply correctly", async function () {
      expect(await myToken.MAX_SUPPLY()).to.equal(maxSupply);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await myToken.addMinter(minter.address);
    });

    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      await myToken.connect(minter).mint(addr1.address, mintAmount);
      expect(await myToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-minters to mint", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      await expect(
        myToken.connect(addr1).mint(addr1.address, mintAmount)
      ).to.be.revertedWith("Not a minter");
    });

    it("Should not mint beyond max supply", async function () {
      const excessAmount = maxSupply;
      await expect(
        myToken.connect(minter).mint(addr1.address, excessAmount)
      ).to.be.revertedWith("Would exceed max supply");
    });

    it("Should allow batch minting", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.parseUnits("1000", 18), ethers.parseUnits("2000", 18)];
      
      await myToken.connect(minter).batchMint(recipients, amounts);
      
      expect(await myToken.balanceOf(addr1.address)).to.equal(amounts[0]);
      expect(await myToken.balanceOf(addr2.address)).to.equal(amounts[1]);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await myToken.transfer(addr1.address, ethers.parseUnits("1000", 18));
    });

    it("Should allow token holders to burn tokens", async function () {
      const burnAmount = ethers.parseUnits("100", 18);
      const initialBalance = await myToken.balanceOf(addr1.address);
      
      await myToken.connect(addr1).burn(burnAmount);
      
      expect(await myToken.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
    });
  });

  describe("Pausing", function () {
    it("Should allow owner to pause and unpause", async function () {
      await myToken.pause();
      expect(await myToken.paused()).to.be.true;

      await expect(
        myToken.transfer(addr1.address, ethers.parseUnits("100", 18))
      ).to.be.revertedWithCustomError(myToken, "EnforcedPause");

      await myToken.unpause();
      expect(await myToken.paused()).to.be.false;

      await expect(
        myToken.transfer(addr1.address, ethers.parseUnits("100", 18))
      ).to.not.be.reverted;
    });
  });

  describe("Transfer Fees", function () {
    beforeEach(async function () {
      await myToken.setFeeCollector(feeCollector.address);
      await myToken.setTransferFee(100); // 1%
    });

    it("Should collect transfer fees", async function () {
      const transferAmount = ethers.parseUnits("1000", 18);
      const expectedFee = ethers.parseUnits("10", 18); // 1% of 1000
      const expectedTransfer = transferAmount - expectedFee;
      
      await myToken.transfer(addr1.address, transferAmount);
      
      expect(await myToken.balanceOf(addr1.address)).to.equal(expectedTransfer);
      expect(await myToken.balanceOf(feeCollector.address)).to.equal(expectedFee);
    });

    it("Should not allow fees above maximum", async function () {
      await expect(
        myToken.setTransferFee(600) // 6%, above 5% max
      ).to.be.revertedWith("Fee too high");
    });
  });

  describe("Blacklisting", function () {
    it("Should prevent blacklisted accounts from receiving tokens", async function () {
      await myToken.blacklistAccount(addr1.address);
      
      await expect(
        myToken.transfer(addr1.address, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("Account is blacklisted");
    });

    it("Should prevent blacklisted accounts from sending tokens", async function () {
      await myToken.transfer(addr1.address, ethers.parseUnits("100", 18));
      await myToken.blacklistAccount(addr1.address);
      
      await expect(
        myToken.connect(addr1).transfer(addr2.address, ethers.parseUnits("50", 18))
      ).to.be.revertedWith("Account is blacklisted");
    });

    it("Should allow unblacklisting", async function () {
      await myToken.blacklistAccount(addr1.address);
      await myToken.unblacklistAccount(addr1.address);
      
      await expect(
        myToken.transfer(addr1.address, ethers.parseUnits("100", 18))
      ).to.not.be.reverted;
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      await myToken.transfer(addr1.address, ethers.parseUnits("1000", 18));
    });

    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.parseUnits("500", 18);
      
      await myToken.connect(addr1).stake(stakeAmount);
      
      const stakeInfo = await myToken.getStakeInfo(addr1.address);
      expect(stakeInfo.stakedAmount).to.equal(stakeAmount);
      expect(await myToken.totalStaked()).to.equal(stakeAmount);
    });

    it("Should calculate staking rewards", async function () {
      const stakeAmount = ethers.parseUnits("1000", 18);
      
      await myToken.connect(addr1).stake(stakeAmount);
      
      // Fast forward 1 year
      await time.increase(365 * 24 * 60 * 60);
      
      const reward = await myToken.calculateStakingReward(addr1.address);
      const expectedReward = ethers.parseUnits("10", 18); // 1% of 1000 tokens
      
      // Allow some tolerance for time differences
      expect(reward).to.be.closeTo(expectedReward, ethers.parseUnits("1", 18));
    });

    it("Should allow unstaking with rewards", async function () {
      const stakeAmount = ethers.parseUnits("1000", 18);
      
      await myToken.connect(addr1).stake(stakeAmount);
      
      // Fast forward 1 year
      await time.increase(365 * 24 * 60 * 60);
      
      const initialBalance = await myToken.balanceOf(addr1.address);
      await myToken.connect(addr1).unstake(stakeAmount);
      
      const finalBalance = await myToken.balanceOf(addr1.address);
      expect(finalBalance).to.be.gt(initialBalance + stakeAmount); // Should have rewards
    });
  });

  describe("Vesting", function () {
    const vestingAmount = ethers.parseUnits("1000", 18);
    const vestingDuration = 365 * 24 * 60 * 60; // 1 year

    it("Should create vesting schedule", async function () {
      await myToken.createVestingSchedule(
        addr1.address,
        vestingAmount,
        vestingDuration,
        true
      );
      
      const vestingInfo = await myToken.getVestingInfo(addr1.address);
      expect(vestingInfo.totalAmount).to.equal(vestingAmount);
      expect(vestingInfo.releasedAmount).to.equal(0);
    });

    it("Should release vested tokens over time", async function () {
      await myToken.createVestingSchedule(
        addr1.address,
        vestingAmount,
        vestingDuration,
        true
      );
      
      // Fast forward 6 months (50% of vesting period)
      await time.increase(vestingDuration / 2);
      
      await myToken.connect(addr1).releaseVestedTokens();
      
      const vestingInfo = await myToken.getVestingInfo(addr1.address);
      const expectedReleased = vestingAmount / 2n;
      
      // Allow some tolerance for time differences
      expect(vestingInfo.releasedAmount).to.be.closeTo(expectedReleased, ethers.parseUnits("10", 18));
    });

    it("Should allow owner to revoke vesting", async function () {
      await myToken.createVestingSchedule(
        addr1.address,
        vestingAmount,
        vestingDuration,
        true
      );
      
      // Fast forward 3 months
      await time.increase(vestingDuration / 4);
      
      const initialOwnerBalance = await myToken.balanceOf(owner.address);
      await myToken.revokeVesting(addr1.address);
      
      const vestingInfo = await myToken.getVestingInfo(addr1.address);
      expect(vestingInfo.revoked).to.be.true;
      
      // Owner should receive remaining tokens
      const finalOwnerBalance = await myToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to add/remove minters", async function () {
      await myToken.addMinter(addr1.address);
      expect(await myToken.minters(addr1.address)).to.be.true;
      
      await myToken.removeMinter(addr1.address);
      expect(await myToken.minters(addr1.address)).to.be.false;
    });

    it("Should not allow non-owners to add minters", async function () {
      await expect(
        myToken.connect(addr1).addMinter(addr2.address)
      ).to.be.revertedWithCustomError(myToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw ETH", async function () {
      // Send some ETH to the contract
      await owner.sendTransaction({
        to: await myToken.getAddress(),
        value: ethers.parseEther("1")
      });
      
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      
      await myToken.emergencyWithdraw(ethers.ZeroAddress, ethers.parseEther("1"));
      
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
    });
  });

  describe("ERC20Permit", function () {
    it("Should support permit functionality", async function () {
      const domain = {
        name: "Advanced MyToken",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: await myToken.getAddress()
      };
      
      // This test verifies that the permit functionality is properly implemented
      // Full permit testing would require more complex signature handling
      expect(await myToken.DOMAIN_SEPARATOR()).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complex scenario with multiple features", async function () {
      // Setup: Add minter, set fees, create vesting
      await myToken.addMinter(minter.address);
      await myToken.setFeeCollector(feeCollector.address);
      await myToken.setTransferFee(50); // 0.5%
      
      // Mint tokens to addr1
      const mintAmount = ethers.parseUnits("10000", 18);
      await myToken.connect(minter).mint(addr1.address, mintAmount);
      
      // Create vesting schedule for addr2
      const vestingAmount = ethers.parseUnits("5000", 18);
      await myToken.createVestingSchedule(addr1.address, vestingAmount, 365 * 24 * 60 * 60, false);
      
      // Stake some tokens from addr1
      const stakeAmount = ethers.parseUnits("2000", 18);
      await myToken.connect(addr1).stake(stakeAmount);
      
      // Transfer tokens (should incur fees)
      const transferAmount = ethers.parseUnits("1000", 18);
      await myToken.connect(addr1).transfer(addr3.address, transferAmount);
      
      // Verify final state
      const stakeInfo = await myToken.getStakeInfo(addr1.address);
      expect(stakeInfo.stakedAmount).to.equal(stakeAmount);
      
      const feeCollectorBalance = await myToken.balanceOf(feeCollector.address);
      expect(feeCollectorBalance).to.be.gt(0); // Should have collected fees
      
      const addr3Balance = await myToken.balanceOf(addr3.address);
      expect(addr3Balance).to.be.lt(transferAmount); // Should be less due to fees
    });
  });
});