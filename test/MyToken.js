const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let MyToken, myToken, owner, addr1, addr2;
  const initialSupply = ethers.parseUnits("1000000", 18);

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy(initialSupply);
    await myToken.waitForDeployment();
  });

  it("Should assign the initial supply to the owner", async function () {
    expect(await myToken.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should transfer tokens between accounts", async function () {
    await myToken.transfer(addr1.address, 1000);
    expect(await myToken.balanceOf(addr1.address)).to.equal(1000);
  });

  it("Should update balances after transfers", async function () {
    await myToken.transfer(addr1.address, 1000);
    await myToken.connect(addr1).transfer(addr2.address, 500);
    expect(await myToken.balanceOf(addr1.address)).to.equal(500);
    expect(await myToken.balanceOf(addr2.address)).to.equal(500);
  });
}); 