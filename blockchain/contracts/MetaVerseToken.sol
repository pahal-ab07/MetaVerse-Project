// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MetaVerseToken is ERC20, Ownable {
    constructor() ERC20("MetaVerse Token", "MVT") Ownable(msg.sender) {
        // Mint initial supply to the contract creator
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Function to mint new tokens (only owner can call this)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Function to burn tokens
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}