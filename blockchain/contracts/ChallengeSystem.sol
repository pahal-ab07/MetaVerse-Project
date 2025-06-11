// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MetaVerseToken.sol";

contract ChallengeSystem is ReentrancyGuard, Ownable {
    MetaVerseToken public token;
    
    struct Challenge {
        uint256 id;
        string title;
        string description;
        uint256 reward;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        address creator;
        address[] participants;
        mapping(address => bool) hasCompleted;
    }
    
    mapping(uint256 => Challenge) public challenges;
    uint256 public challengeCount;
    
    event ChallengeCreated(uint256 indexed id, string title, uint256 reward);
    event ChallengeCompleted(uint256 indexed id, address indexed participant);
    event RewardClaimed(uint256 indexed id, address indexed participant, uint256 amount);
    
    constructor(address _token) Ownable() {
        token = MetaVerseToken(_token);
    }
    
    function createChallenge(
        string memory _title,
        string memory _description,
        uint256 _reward,
        uint256 _duration
    ) external onlyOwner {
        require(_reward > 0, "Reward must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        uint256 challengeId = challengeCount++;
        Challenge storage challenge = challenges[challengeId];
        
        challenge.id = challengeId;
        challenge.title = _title;
        challenge.description = _description;
        challenge.reward = _reward;
        challenge.startTime = block.timestamp;
        challenge.endTime = block.timestamp + _duration;
        challenge.isActive = true;
        challenge.creator = msg.sender;
        
        emit ChallengeCreated(challengeId, _title, _reward);
    }
    
    function participateInChallenge(uint256 _challengeId) external {
        Challenge storage challenge = challenges[_challengeId];
        require(challenge.isActive, "Challenge is not active");
        require(block.timestamp <= challenge.endTime, "Challenge has ended");
        require(!challenge.hasCompleted[msg.sender], "Already participated");
        
        challenge.participants.push(msg.sender);
    }
    
    function completeChallenge(uint256 _challengeId) external nonReentrant {
        Challenge storage challenge = challenges[_challengeId];
        require(challenge.isActive, "Challenge is not active");
        require(block.timestamp <= challenge.endTime, "Challenge has ended");
        require(!challenge.hasCompleted[msg.sender], "Already completed");
        
        challenge.hasCompleted[msg.sender] = true;
        emit ChallengeCompleted(_challengeId, msg.sender);
    }
    
    function claimReward(uint256 _challengeId) external nonReentrant {
        Challenge storage challenge = challenges[_challengeId];
        require(challenge.hasCompleted[msg.sender], "Challenge not completed");
        require(block.timestamp > challenge.endTime, "Challenge still active");
        
        uint256 reward = challenge.reward;
        challenge.hasCompleted[msg.sender] = false; // Prevent double claiming
        
        require(token.transfer(msg.sender, reward), "Reward transfer failed");
        emit RewardClaimed(_challengeId, msg.sender, reward);
    }
    
    function getChallengeDetails(uint256 _challengeId) external view returns (
        string memory title,
        string memory description,
        uint256 reward,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        address creator,
        uint256 participantCount
    ) {
        Challenge storage challenge = challenges[_challengeId];
        return (
            challenge.title,
            challenge.description,
            challenge.reward,
            challenge.startTime,
            challenge.endTime,
            challenge.isActive,
            challenge.creator,
            challenge.participants.length
        );
    }
    
    function isParticipant(uint256 _challengeId, address _participant) external view returns (bool) {
        return challenges[_challengeId].hasCompleted[_participant];
    }
} 