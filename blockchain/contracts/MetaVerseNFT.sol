// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MetaVerseNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Mapping from token ID to creator address
    mapping(uint256 => address) private _creators;
    
    // Mapping from token ID to royalty percentage (in basis points, e.g., 250 = 2.5%)
    mapping(uint256 => uint256) private _royalties;

    // Events
    event NFTMinted(address indexed creator, address indexed to, uint256 indexed tokenId, string tokenURI);
    event RoyaltySet(uint256 indexed tokenId, uint256 royaltyPercentage);

    constructor() ERC721("MetaVerse NFT", "MVNFT") {}

    function mintNFT(address to, string memory tokenURI, uint256 royaltyPercentage) 
        public 
        returns (uint256) 
    {
        require(royaltyPercentage <= 1000, "Royalty percentage too high"); // Max 10%
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        _creators[newTokenId] = msg.sender;
        _royalties[newTokenId] = royaltyPercentage;

        emit NFTMinted(msg.sender, to, newTokenId, tokenURI);
        emit RoyaltySet(newTokenId, royaltyPercentage);

        return newTokenId;
    }

    function getCreator(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _creators[tokenId];
    }

    function getRoyalty(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return _royalties[tokenId];
    }

    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // Override transfer functions to handle royalties
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._transfer(from, to, tokenId);
    }

    // Function to check if an address owns any NFTs
    function balanceOf(address owner) public view override(ERC721, IERC721) returns (uint256) {
        return super.balanceOf(owner);
    }

    // Function to get all tokens owned by an address
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    // Function to get token by index
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balanceOf(owner), "Index out of bounds");
        return _tokenIds.current();
    }
} 