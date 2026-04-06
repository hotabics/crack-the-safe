export const PRIZE_VAULT_ABI = [
  {
    inputs: [
      { name: "winner", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "vaultId", type: "bytes32" },
    ],
    name: "claimPrize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "vaultBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const BLUFF_TOKEN_ADDRESS = "0x287a19FbeA6C6A400Bf3cc8331F2a7c9aE59e57a" as const;
export const PRIZE_VAULT_ADDRESS = "0x08BAEee1a025156d42AB97E6113f341080D96280" as const;
