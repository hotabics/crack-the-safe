// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BLUFF.sol";
import "../src/PrizeVault.sol";

contract BLUFFTest is Test {
    BLUFF public token;
    PrizeVault public vault;
    address public deployer = address(1);
    address public winner = address(2);

    function setUp() public {
        vm.startPrank(deployer);
        token = new BLUFF();
        vault = new PrizeVault(address(token));
        // Fund vault with 1M BLUFF
        token.transfer(address(vault), 1_000_000 * 10 ** 18);
        vm.stopPrank();
    }

    function test_TokenDeployment() public view {
        assertEq(token.name(), "BLUFF");
        assertEq(token.symbol(), "BLUFF");
        assertEq(token.totalSupply(), 100_000_000 * 10 ** 18);
    }

    function test_DeployerBalance() public view {
        // Deployer should have 99M (100M - 1M sent to vault)
        assertEq(token.balanceOf(deployer), 99_000_000 * 10 ** 18);
    }

    function test_VaultBalance() public view {
        assertEq(vault.vaultBalance(), 1_000_000 * 10 ** 18);
    }

    function test_ClaimPrize() public {
        vm.prank(deployer);
        vault.claimPrize(winner, 1_000_000 * 10 ** 18, bytes32("vault1"));
        assertEq(token.balanceOf(winner), 1_000_000 * 10 ** 18);
        assertEq(vault.vaultBalance(), 0);
    }

    function test_ClaimPrize_Unauthorized() public {
        vm.prank(winner); // Not owner
        vm.expectRevert();
        vault.claimPrize(winner, 1_000_000 * 10 ** 18, bytes32("vault1"));
    }

    function test_ClaimPrize_InsufficientBalance() public {
        vm.prank(deployer);
        vm.expectRevert("Insufficient vault balance");
        vault.claimPrize(winner, 2_000_000 * 10 ** 18, bytes32("vault1"));
    }

    function test_Burn() public {
        vm.prank(deployer);
        token.burn(1000 * 10 ** 18);
        assertEq(token.totalSupply(), 100_000_000 * 10 ** 18 - 1000 * 10 ** 18);
    }

    function test_EmergencyWithdraw() public {
        vm.prank(deployer);
        vault.emergencyWithdraw(deployer, 500_000 * 10 ** 18);
        assertEq(vault.vaultBalance(), 500_000 * 10 ** 18);
    }
}
