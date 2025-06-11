// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MetaVerseLand is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _landIds;

    // Land coordinates structure
    struct Coordinates {
        int256 x;
        int256 y;
    }

    // Land details structure
    struct LandDetails {
        Coordinates coordinates;
        uint256 size; // in square meters
        string landType; // residential, commercial, etc.
        bool isForSale;
        uint256 price;
    }

    // Mapping from land ID to its details
    mapping(uint256 => LandDetails) private _landDetails;
    
    // Mapping from coordinates to land ID to prevent overlapping
    mapping(int256 => mapping(int256 => uint256)) private _coordinatesToLandId;

    // Events
    event LandMinted(address indexed owner, uint256 indexed landId, Coordinates coordinates, uint256 size);
    event LandSold(uint256 indexed landId, address indexed seller, address indexed buyer, uint256 price);
    event LandListed(uint256 indexed landId, uint256 price);
    event LandUnlisted(uint256 indexed landId);

    constructor() ERC721("MetaVerse Land", "MVL") {}

    function mintLand(
        address to,
        int256 x,
        int256 y,
        uint256 size,
        string memory landType,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(_coordinatesToLandId[x][y] == 0, "Land already exists at these coordinates");
        
        _landIds.increment();
        uint256 newLandId = _landIds.current();

        _safeMint(to, newLandId);
        _setTokenURI(newLandId, tokenURI);

        _landDetails[newLandId] = LandDetails({
            coordinates: Coordinates(x, y),
            size: size,
            landType: landType,
            isForSale: false,
            price: 0
        });

        _coordinatesToLandId[x][y] = newLandId;

        emit LandMinted(to, newLandId, Coordinates(x, y), size);
        return newLandId;
    }

    function getLandDetails(uint256 landId) public view returns (LandDetails memory) {
        require(_exists(landId), "Land does not exist");
        return _landDetails[landId];
    }

    function listLandForSale(uint256 landId, uint256 price) public {
        require(_exists(landId), "Land does not exist");
        require(ownerOf(landId) == msg.sender, "Not the land owner");
        
        _landDetails[landId].isForSale = true;
        _landDetails[landId].price = price;

        emit LandListed(landId, price);
    }

    function unlistLand(uint256 landId) public {
        require(_exists(landId), "Land does not exist");
        require(ownerOf(landId) == msg.sender, "Not the land owner");
        
        _landDetails[landId].isForSale = false;
        _landDetails[landId].price = 0;

        emit LandUnlisted(landId);
    }

    function buyLand(uint256 landId) public payable {
        require(_exists(landId), "Land does not exist");
        require(_landDetails[landId].isForSale, "Land is not for sale");
        require(msg.value >= _landDetails[landId].price, "Insufficient payment");

        address seller = ownerOf(landId);
        require(seller != msg.sender, "Cannot buy your own land");

        // Transfer the land
        _transfer(seller, msg.sender, landId);
        
        // Transfer the payment
        payable(seller).transfer(msg.value);

        // Update land status
        _landDetails[landId].isForSale = false;
        _landDetails[landId].price = 0;

        emit LandSold(landId, seller, msg.sender, msg.value);
    }

    function _exists(uint256 landId) internal view override returns (bool) {
        return super._exists(landId);
    }

    // Function to get all lands owned by an address
    function landsOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 landCount = balanceOf(owner);
        uint256[] memory landIds = new uint256[](landCount);
        
        for (uint256 i = 0; i < landCount; i++) {
            landIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return landIds;
    }

    // Function to get land by index
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balanceOf(owner), "Index out of bounds");
        return _landIds.current();
    }

    // Function to check if coordinates are available
    function areCoordinatesAvailable(int256 x, int256 y) public view returns (bool) {
        return _coordinatesToLandId[x][y] == 0;
    }
} 