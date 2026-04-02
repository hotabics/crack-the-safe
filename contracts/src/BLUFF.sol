// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BLUFF is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18; // 100M total supply

    constructor() ERC20("BLUFF", "BLUFF") Ownable(msg.sender) {
        _mint(msg.sender, MAX_SUPPLY);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
