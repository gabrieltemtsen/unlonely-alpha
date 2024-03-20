// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./TempTokenV1.sol"; // Make sure this import path matches where your token contract is located.

contract TempTokenFactoryV1 is Ownable {

    /**
        * @dev TokenInfo is a struct to store information about a deployed token.
        * @dev tokenAddress is the address of the deployed token.
        * @dev ownerAddress is the address of the token's owner. This will usually be the owner of the Unlonely channel that is launching this token.
        * @dev name is the name of the token.
        * @dev symbol is the symbol of the token.
        * @dev endTimestamp is the timestamp when the token is no longer tradeable (more information in TempTokenV1 contract).
        * @dev protocolFeeDestination is the address where the protocol fees are sent.
        * @dev protocolFeePercent is the percentage of the protocol fee.
        * @dev streamerFeePercent is the percentage of the streamer fee.
     */
    struct TokenInfo {
        address tokenAddress;
        address ownerAddress;
        string name;
        string symbol;
        uint256 endTimestamp;
        address protocolFeeDestination;
        uint256 protocolFeePercent;
        uint256 streamerFeePercent;
    }

    /**
        * @dev numDeployedTokens is the number of deployed tokens.
        * @dev deployedTokenIndices is a mapping of token addresses to their assigned index.
        * @dev deployedTokens is a mapping of token indices to TokenInfo structs.
     */
    uint256 public numDeployedTokens;
    mapping(address => uint256) public deployedTokenIndices;
    mapping(uint256 => TokenInfo) public deployedTokens;

    /**
        * @dev defaultProtocolFeePercent is the default protocol fee percentage. ex: 2% = 2 * 10**16 = 20000000000000000.
        * @dev defaultStreamerFeePercent is the default streamer fee percentage. ex: 2% = 2 * 10**16 = 20000000000000000.
        * @dev defaultProtocolFeeDestination is the default protocol fee destination address.
        * @dev isPaused is a boolean to pause the token creation function.
        * @dev maxDuration is the max duration in seconds for the lifespan of the TempToken.
     */
    uint256 public defaultProtocolFeePercent;
    uint256 public defaultStreamerFeePercent;
    address public defaultProtocolFeeDestination;
    bool public isPaused;
    uint256 public maxDuration;

    // Event to log the creation of a new TempToken.
    event TempTokenCreated(address indexed tokenAddress, address indexed owner, uint256 index, string name, string symbol, uint256 endTimestamp, address protocolFeeDestination, uint256 protocolFeePercent, uint256 streamerFeePercent);
    event ProtocolFeeDestinationSet(address indexed protocolFeeDestination);
    event ProtocolFeePercentSet(uint256 feePercent);
    event StreamerFeePercentSet(uint256 feePercent);
    event PauseFactorySet(bool isPaused, uint256 numDeployedTokens);
    event MaxDurationSet(uint256 maxDuration);

    constructor(address _defaultProtocolFeeDestination, uint256 _defaultProtocolFeePercent, uint256 _defaultStreamerFeePercent) {
        require(_defaultProtocolFeeDestination != address(0), "Default fee destination cannot be the zero address");

        defaultProtocolFeePercent = _defaultProtocolFeePercent;
        defaultStreamerFeePercent = _defaultStreamerFeePercent;
        defaultProtocolFeeDestination = _defaultProtocolFeeDestination;
        maxDuration = 1 hours; // Sets the initial maxDuration to 3600 seconds
    }

    /**
        * @dev createTempToken is a function to create a new TempToken.
        * @dev name is the name of the token.
        * @dev symbol is the symbol of the token.
        * @dev duration is the duration in seconds for the lifespan of the TempToken.
        * @dev The function returns the address of the new TempToken.
     */
    function createTempToken(
        string memory name,
        string memory symbol,
        uint256 duration
    ) public returns (address) {
        require(!isPaused, "Factory is paused");
        require(duration <= maxDuration, "Duration is longer than max duration");
        uint256 endTimestamp = block.timestamp + duration;
        TempTokenV1 newToken = new TempTokenV1(name, symbol, endTimestamp, defaultProtocolFeeDestination, defaultProtocolFeePercent, defaultStreamerFeePercent, address(this));        
        
        /**
            * @dev We increment the numDeployedTokens and use the new value as the index to store the TokenInfo struct in the deployedTokens mapping.
            * @dev We also store the index of the token in the deployedTokenIndices mapping using the token's address as the key.
         */
        uint256 index = ++numDeployedTokens;
        deployedTokens[index] = TokenInfo(address(newToken), msg.sender, name, symbol, endTimestamp, defaultProtocolFeeDestination, defaultProtocolFeePercent, defaultStreamerFeePercent);
        deployedTokenIndices[address(newToken)] = index;

        newToken.transferOwnership(msg.sender); // Transfer ownership of the new token to the caller of this function.
        emit TempTokenCreated(address(newToken), msg.sender, index, name, symbol, endTimestamp, defaultProtocolFeeDestination, defaultProtocolFeePercent, defaultStreamerFeePercent);
        return address(newToken);
    }

    /**
        * @dev getTokenInfo is a function to get the TokenInfo struct of a deployed token.
        * @dev tokenAddress is the address of the deployed token.
        * @dev The function returns the TokenInfo struct of the deployed token.
     */
    function getTokenInfo(address tokenAddress) public view returns (TokenInfo memory) {
        uint256 index = deployedTokenIndices[tokenAddress];
        return deployedTokens[index];
    }

    /**
        * @dev The following functions are used to set the default protocol fee destination, protocol fee percentage, streamer fee percentage, pause the factory, and set the max duration.
        * @dev These functions are only callable by the owner of the factory.
     */

    function setFeeDestination(address protocolFeeDestination) public onlyOwner {
        defaultProtocolFeeDestination = protocolFeeDestination;
        emit ProtocolFeeDestinationSet(protocolFeeDestination);
    }

    function setProtocolFeePercent(uint256 _feePercent) public onlyOwner {
        defaultProtocolFeePercent = _feePercent;
        emit ProtocolFeePercentSet(_feePercent);
    }

    function setStreamerFeePercent(uint256 _feePercent) public onlyOwner {
        defaultStreamerFeePercent = _feePercent;
        emit StreamerFeePercentSet(_feePercent);
    }

    function setPauseFactory(bool _isPaused) public onlyOwner {
        isPaused = _isPaused;
        emit PauseFactorySet(_isPaused, numDeployedTokens);
    }

    function setMaxDuration(uint256 _maxDuration) public onlyOwner {
        maxDuration = _maxDuration;
        emit MaxDurationSet(_maxDuration);
    }
}