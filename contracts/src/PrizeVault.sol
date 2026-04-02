// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PrizeVault is Ownable {
    IERC20 public immutable bluffToken;

    event PrizeClaimed(address indexed winner, uint256 amount, bytes32 vaultId);

    constructor(address _bluffToken) Ownable(msg.sender) {
        bluffToken = IERC20(_bluffToken);
    }

    function claimPrize(
        address winner,
        uint256 amount,
        bytes32 vaultId
    ) external onlyOwner {
        require(bluffToken.balanceOf(address(this)) >= amount, "Insufficient vault balance");
        bluffToken.transfer(winner, amount);
        emit PrizeClaimed(winner, amount, vaultId);
    }

    function vaultBalance() external view returns (uint256) {
        return bluffToken.balanceOf(address(this));
    }

    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        bluffToken.transfer(to, amount);
    }
}
