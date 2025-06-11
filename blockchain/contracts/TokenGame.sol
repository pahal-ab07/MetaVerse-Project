// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MetaVerseToken.sol";

contract TokenGame is ReentrancyGuard, Ownable {
    MetaVerseToken public token;
    
    // Initial HSR coins for new players
    uint256 public constant INITIAL_HSR_COINS = 20;
    
    // Mapping to track if a player has received initial coins
    mapping(address => bool) public hasReceivedInitialCoins;
    
    // Game rewards structure
    struct GameReward {
        uint256 id;
        string name;
        uint256 amount;
        bool isActive;
    }
    
    // Mapping of game rewards
    mapping(uint256 => GameReward) public gameRewards;
    uint256 public rewardCount;
    
    // Events
    event InitialCoinsGranted(address indexed player, uint256 amount);
    event GameRewardCreated(uint256 indexed id, string name, uint256 amount);
    event RewardClaimed(address indexed player, uint256 indexed rewardId, uint256 amount);
    
    constructor(address _token) Ownable() {
        token = MetaVerseToken(_token);
    }
    
    // Function to grant initial HSR coins to new players
    function grantInitialCoins(address player) external onlyOwner {
        require(!hasReceivedInitialCoins[player], "Player already received initial coins");
        
        hasReceivedInitialCoins[player] = true;
        require(token.transfer(player, INITIAL_HSR_COINS * 10**18), "Transfer failed");
        
        emit InitialCoinsGranted(player, INITIAL_HSR_COINS);
    }
    
    // Function to create a new game reward
    function createGameReward(string memory name, uint256 amount) external onlyOwner {
        uint256 rewardId = rewardCount++;
        gameRewards[rewardId] = GameReward({
            id: rewardId,
            name: name,
            amount: amount,
            isActive: true
        });
        
        emit GameRewardCreated(rewardId, name, amount);
    }
    
    // Function to claim a game reward
    function claimGameReward(uint256 rewardId) external nonReentrant {
        GameReward storage reward = gameRewards[rewardId];
        require(reward.isActive, "Reward is not active");
        
        reward.isActive = false;
        require(token.transfer(msg.sender, reward.amount), "Transfer failed");
        
        emit RewardClaimed(msg.sender, rewardId, reward.amount);
    }
    
    // Function to check if a player has received initial coins
    function hasPlayerReceivedInitialCoins(address player) external view returns (bool) {
        return hasReceivedInitialCoins[player];
    }
    
    // Function to get game reward details
    function getGameReward(uint256 rewardId) external view returns (
        string memory name,
        uint256 amount,
        bool isActive
    ) {
        GameReward storage reward = gameRewards[rewardId];
        return (reward.name, reward.amount, reward.isActive);
    }
} 