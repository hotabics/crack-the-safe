// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BLUFF.sol";
import "../src/PrizeVault.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // 1. Deploy token
        BLUFF token = new BLUFF();

        // 2. Deploy vault
        PrizeVault vault = new PrizeVault(address(token));

        // 3. Transfer 1M BLUFF to vault for first round
        token.transfer(address(vault), 1_000_000 * 10 ** 18);

        vm.stopBroadcast();

        console.log("BLUFF Token:", address(token));
        console.log("PrizeVault:", address(vault));
        console.log("Vault balance:", vault.vaultBalance());
    }
}
