"use client";

import { useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { BLUFF_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/config";

export function useBluffBalance(address: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: BLUFF_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    chainId: BASE_CHAIN_ID,
    query: {
      enabled: !!address,
      refetchInterval: 30_000, // Refresh every 30s
    },
  });

  const balance = data ? Number(formatUnits(data, 18)) : 0;

  return { balance, isLoading, refetch };
}
