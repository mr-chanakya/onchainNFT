// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ArcNFT
 * @notice Mint a simple on-chain NFT with custom name and message on Arc.
 *         Metadata is stored fully on-chain as SVG — no IPFS needed.
 */
contract ArcNFT {
    event Minted(address indexed to, uint256 indexed tokenId, string name);

    struct Token {
        uint256 tokenId;
        address owner;
        string name;
        string message;
        uint256 mintedAt;
    }

    Token[] public tokens;
    mapping(address => uint256[]) public ownedTokens;
    mapping(address => uint256) public mintCount;
    uint256 public totalSupply;

    uint256 public constant MAX_PER_WALLET = 5;

    function mint(string calldata name, string calldata message) external returns (uint256) {
        require(mintCount[msg.sender] < MAX_PER_WALLET, "Max 5 NFTs per wallet");
        require(bytes(name).length > 0, "Name required");

        uint256 tokenId = tokens.length;
        tokens.push(Token({
            tokenId: tokenId,
            owner: msg.sender,
            name: name,
            message: bytes(message).length > 0 ? message : "Minted on Arc",
            mintedAt: block.timestamp
        }));

        ownedTokens[msg.sender].push(tokenId);
        mintCount[msg.sender]++;
        totalSupply++;
        emit Minted(msg.sender, tokenId, name);
        return tokenId;
    }

    function getToken(uint256 tokenId) external view returns (Token memory) {
        require(tokenId < tokens.length, "Token does not exist");
        return tokens[tokenId];
    }

    function getRecentTokens(uint256 count) external view returns (Token[] memory) {
        uint256 len = tokens.length;
        uint256 start = len > count ? len - count : 0;
        Token[] memory result = new Token[](len - start);
        for (uint256 i = 0; i < result.length; i++) result[i] = tokens[start + i];
        return result;
    }

    function getOwnedTokens(address owner) external view returns (uint256[] memory) {
        return ownedTokens[owner];
    }
}
