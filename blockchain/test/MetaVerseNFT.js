const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MetaVerseNFT", function () {
  let nft, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("MetaVerseNFT");
    nft = await NFT.deploy();
    await nft.deployed();
  });

  it("Should deploy and set the right owner", async function () {
    expect(await nft.owner()).to.equal(owner.address);
  });

  it("Should mint an NFT and assign it to the correct owner", async function () {
    const tokenURI = "ipfs://test-uri";
    await nft.mintNFT(addr1.address, tokenURI, 5);
    expect(await nft.ownerOf(1)).to.equal(addr1.address);
    expect(await nft.tokenURI(1)).to.equal(tokenURI);
  });
}); 