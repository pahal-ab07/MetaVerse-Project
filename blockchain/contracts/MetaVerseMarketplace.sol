// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MetaVerseNFT.sol";
import "./MetaVerseLand.sol";
import "./MetaVerseToken.sol";

contract MetaVerseMarketplace is ReentrancyGuard, Ownable {
    MetaVerseNFT public nftContract;
    MetaVerseLand public landContract;
    MetaVerseToken public tokenContract;

    // Platform fee percentage (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeePercentage = 250;
    
    // Minimum listing duration (in seconds)
    uint256 public minListingDuration = 1 days;
    
    // Maximum listing duration (in seconds)
    uint256 public maxListingDuration = 90 days;

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isNFT; // true for NFT, false for Land
    }

    // Mapping from listing ID to Listing
    mapping(uint256 => Listing) public listings;
    
    // Counter for listing IDs
    uint256 private _listingIds;

    // Events
    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 price, uint256 startTime, uint256 endTime, bool isNFT);
    event ListingCancelled(uint256 indexed listingId);
    event ItemSold(uint256 indexed listingId, address indexed seller, address indexed buyer, uint256 price);
    event PlatformFeeUpdated(uint256 newFeePercentage);
    event ListingDurationUpdated(uint256 newMinDuration, uint256 newMaxDuration);

    constructor(
        address _nftContract,
        address _landContract,
        address _tokenContract
    ) {
        nftContract = MetaVerseNFT(_nftContract);
        landContract = MetaVerseLand(_landContract);
        tokenContract = MetaVerseToken(_tokenContract);
    }

    function createListing(
        uint256 tokenId,
        uint256 price,
        uint256 duration,
        bool isNFT
    ) external returns (uint256) {
        require(duration >= minListingDuration && duration <= maxListingDuration, "Invalid duration");
        require(price > 0, "Price must be greater than 0");

        if (isNFT) {
            require(nftContract.ownerOf(tokenId) == msg.sender, "Not the NFT owner");
            require(nftContract.getApproved(tokenId) == address(this), "Marketplace not approved");
        } else {
            require(landContract.ownerOf(tokenId) == msg.sender, "Not the land owner");
            require(landContract.getApproved(tokenId) == address(this), "Marketplace not approved");
        }

        _listingIds++;
        uint256 listingId = _listingIds;

        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            isActive: true,
            isNFT: isNFT
        });

        emit ListingCreated(listingId, msg.sender, tokenId, price, block.timestamp, block.timestamp + duration, isNFT);
        return listingId;
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        listing.isActive = false;
        emit ListingCancelled(listingId);
    }

    function buyItem(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(block.timestamp <= listing.endTime, "Listing expired");
        require(msg.sender != listing.seller, "Cannot buy your own item");

        // Calculate platform fee
        uint256 platformFee = (listing.price * platformFeePercentage) / 10000;
        uint256 sellerAmount = listing.price - platformFee;

        // Transfer tokens
        require(tokenContract.transferFrom(msg.sender, address(this), listing.price), "Token transfer failed");
        require(tokenContract.transfer(listing.seller, sellerAmount), "Seller transfer failed");
        require(tokenContract.transfer(owner(), platformFee), "Platform fee transfer failed");

        // Transfer the NFT or Land
        if (listing.isNFT) {
            nftContract.transferFrom(listing.seller, msg.sender, listing.tokenId);
        } else {
            landContract.transferFrom(listing.seller, msg.sender, listing.tokenId);
        }

        listing.isActive = false;
        emit ItemSold(listingId, listing.seller, msg.sender, listing.price);
    }

    function updatePlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
        emit PlatformFeeUpdated(newFeePercentage);
    }

    function updateListingDuration(uint256 newMinDuration, uint256 newMaxDuration) external onlyOwner {
        require(newMinDuration <= newMaxDuration, "Invalid duration range");
        minListingDuration = newMinDuration;
        maxListingDuration = newMaxDuration;
        emit ListingDurationUpdated(newMinDuration, newMaxDuration);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getActiveListings() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= _listingIds; i++) {
            if (listings[i].isActive) {
                count++;
            }
        }

        uint256[] memory activeListings = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= _listingIds; i++) {
            if (listings[i].isActive) {
                activeListings[index] = i;
                index++;
            }
        }

        return activeListings;
    }
} 