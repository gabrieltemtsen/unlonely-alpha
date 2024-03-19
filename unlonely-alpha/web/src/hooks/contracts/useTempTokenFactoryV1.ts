import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";

import { NULL_ADDRESS } from "../../constants";
import { ContractData, WriteCallbacks } from "../../constants/types";
import { useWrite } from "./useWrite";
import { createCallbackHandler } from "../../utils/contract";

type TokenInfo = {
  tokenAddress: `0x${string}`;
  ownerAddress: `0x${string}`;
  name: string;
  symbol: string;
  endTimestamp: bigint;
  feeDestination: `0x${string}`;
  protocolFeePercent: bigint;
  subjectFeePercent: bigint;
};

const tokenInfoInitialState: TokenInfo = {
  tokenAddress: NULL_ADDRESS,
  ownerAddress: NULL_ADDRESS,
  name: "",
  symbol: "",
  endTimestamp: BigInt(0),
  feeDestination: NULL_ADDRESS,
  protocolFeePercent: BigInt(0),
  subjectFeePercent: BigInt(0),
};

export const useReadPublic = (contract: ContractData) => {
  const publicClient = usePublicClient();

  const [protocolFeeDestination, setProtocolFeeDestination] =
    useState<string>(NULL_ADDRESS);
  const [protocolFeePercent, setProtocolFeePercent] = useState<bigint>(
    BigInt(0)
  );
  const [subjectFeePercent, setSubjectFeePercent] = useState<bigint>(BigInt(0));

  const getData = useCallback(async () => {
    if (!contract.address || !contract.abi || !publicClient) {
      setProtocolFeeDestination(NULL_ADDRESS);
      setProtocolFeePercent(BigInt(0));
      setSubjectFeePercent(BigInt(0));
      return;
    }
    const [protocolFeeDestination, protocolFeePercent, subjectFeePercent] =
      await Promise.all([
        publicClient.readContract({
          address: contract.address,
          abi: contract.abi,
          functionName: "defaultFeeDestination",
          args: [],
        }),
        publicClient.readContract({
          address: contract.address,
          abi: contract.abi,
          functionName: "defaultProtocolFeePercent",
          args: [],
        }),
        publicClient.readContract({
          address: contract.address,
          abi: contract.abi,
          functionName: "defaultStreamerFeePercent",
          args: [],
        }),
      ]);
    setProtocolFeeDestination(String(protocolFeeDestination));
    setProtocolFeePercent(BigInt(String(protocolFeePercent)));
    setSubjectFeePercent(BigInt(String(subjectFeePercent)));
  }, [contract.address, publicClient]);

  useEffect(() => {
    getData();
  }, [getData]);

  return {
    refetch: getData,
    protocolFeeDestination,
    protocolFeePercent,
    subjectFeePercent,
  };
};

export const useReadIsPaused = (contract: ContractData) => {
  const publicClient = usePublicClient();

  const [isPaused, setIsPaused] = useState<boolean>(false);

  const getData = useCallback(async () => {
    if (!contract.address || !contract.abi || !publicClient) {
      setIsPaused(false);
      return;
    }
    const isPaused = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "isPaused",
      args: [],
    });
    setIsPaused(Boolean(isPaused));
  }, [contract.address, publicClient]);

  useEffect(() => {
    getData();
  }, [getData]);

  return {
    refetch: getData,
    isPaused,
  };
};

export const useReadDuration = (contract: ContractData) => {
  const publicClient = usePublicClient();

  const [duration, setDuration] = useState<bigint>(BigInt(0));

  const getData = useCallback(async () => {
    if (!contract.address || !contract.abi || !publicClient) {
      setDuration(BigInt(0));
      return;
    }
    const duration = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "duration",
      args: [],
    });
    setDuration(BigInt(String(duration)));
  }, [contract.address, publicClient]);

  useEffect(() => {
    getData();
  }, [getData]);

  return {
    refetch: getData,
    duration,
  };
};

export const useReadTokenInfo = (
  contract: ContractData,
  tokenAddress: `0x${string}`
) => {
  const publicClient = usePublicClient();

  const [tokenInfo, setTokenInfo] = useState<TokenInfo>(tokenInfoInitialState);

  const getData = useCallback(async () => {
    if (!contract.address || !contract.abi || !publicClient) {
      setTokenInfo(tokenInfoInitialState);
      return;
    }
    const tokenInfo = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getTokenInfo",
      args: [tokenAddress],
    });
    setTokenInfo({
      tokenAddress: tokenInfo[0] as `0x${string}`,
      ownerAddress: tokenInfo[1] as `0x${string}`,
      name: String(tokenInfo[2]),
      symbol: String(tokenInfo[3]),
      endTimestamp: BigInt(String(tokenInfo[4])),
      feeDestination: tokenInfo[5] as `0x${string}`,
      protocolFeePercent: BigInt(String(tokenInfo[6])),
      subjectFeePercent: BigInt(String(tokenInfo[7])),
    });
  }, [contract.address, publicClient]);

  useEffect(() => {
    getData();
  }, [getData]);

  return {
    refetch: getData,
    tokenInfo,
  };
};

export const useCreateTempToken = (
  args: {
    name: string;
    symbol: string;
  },
  contract: ContractData,
  callbacks?: WriteCallbacks
) => {
  const {
    writeAsync: createTempToken,
    writeData: createTempTokenData,
    txData: createTempTokenTxData,
    isTxLoading: isCreateTempTokenLoading,
  } = useWrite(
    contract,
    "createTempToken",
    [args.name, args.symbol],
    createCallbackHandler("useTempTokenFactoryV1 createTempToken", callbacks),
    { enabled: args.name.length > 0 && args.symbol.length > 0 }
  );

  return {
    createTempToken,
    createTempTokenData,
    createTempTokenTxData,
    isCreateTempTokenLoading,
  };
};