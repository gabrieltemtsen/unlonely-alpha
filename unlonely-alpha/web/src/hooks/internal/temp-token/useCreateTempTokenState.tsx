import { useCallback, useState } from "react";
import { useToast, Box } from "@chakra-ui/react";
import Link from "next/link";
import { decodeEventLog, encodeAbiParameters } from "viem";
import { useNetworkContext } from "../../context/useNetwork";
import { useCreateTempToken } from "../../contracts/useTempTokenFactoryV1";
import { verifyTempTokenV1OnBase } from "../../../utils/contract-verification/tempToken";
import usePostTempToken from "../../server/temp-token/usePostTempToken";
import { Contract } from "../../../constants";
import { getContractFromNetwork } from "../../../utils/contract";
import { useChannelContext } from "../../context/useChannel";

export type UseCreateTempTokenStateType = {
  newTokenName: string;
  newTokenSymbol: string;
  newTokenDuration: bigint;
  createTempToken?: () => Promise<any>;
  createTempTokenData: any;
  createTempTokenTxData: any;
  isCreateTempTokenLoading: boolean;
  handleNewTokenName: (name: string) => void;
  handleNewTokenSymbol: (symbol: string) => void;
  handleNewTokenDuration: (duration: bigint) => void;
};

export const useCreateTempTokenInitialState: UseCreateTempTokenStateType = {
  newTokenName: "temp",
  newTokenSymbol: "temp",
  newTokenDuration: BigInt(3600),
  createTempToken: undefined,
  createTempTokenData: undefined,
  createTempTokenTxData: undefined,
  isCreateTempTokenLoading: false,
  handleNewTokenName: () => undefined,
  handleNewTokenSymbol: () => undefined,
  handleNewTokenDuration: () => undefined,
};

export const useCreateTempTokenState = (): UseCreateTempTokenStateType => {
  const { channel } = useChannelContext();
  const { network } = useNetworkContext();
  const { localNetwork, explorerUrl } = network;
  const toast = useToast();

  const [newTokenName, setNewTokenName] = useState<string>("name");
  const [newTokenSymbol, setNewTokenSymbol] = useState<string>("symbol");
  const [newTokenDuration, setNewTokenDuration] = useState<bigint>(
    BigInt(1800)
  );

  const { postTempToken } = usePostTempToken({});

  const factoryContract = getContractFromNetwork(
    Contract.TEMP_TOKEN_FACTORY_V1,
    localNetwork
  );

  const {
    createTempToken: _createTempToken,
    createTempTokenData,
    createTempTokenTxData,
    isCreateTempTokenLoading,
  } = useCreateTempToken(
    {
      name: newTokenName,
      symbol: newTokenSymbol,
      duration: newTokenDuration,
    },
    factoryContract,
    {
      onWriteSuccess: (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.hash}`}
                passHref
              >
                createTempToken pending, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
      onWriteError: (error) => {
        toast({
          duration: 9000,
          isClosable: true,
          position: "top-right",
          render: () => (
            <Box as="button" borderRadius="md" bg="#bd711b" px={4} h={8}>
              createTempToken cancelled
            </Box>
          ),
        });
      },
      onTxSuccess: async (data) => {
        const topics = decodeEventLog({
          abi: factoryContract.abi,
          data: data.logs[2].data,
          topics: data.logs[2].topics,
        });
        const args: any = topics.args;
        const encoded = encodeAbiParameters(
          [
            {
              name: "name",
              type: "string",
            },
            {
              name: "symbol",
              type: "string",
            },
            {
              name: "_endTimestamp",
              type: "uint256",
            },
            {
              name: "_protocolFeeDestination",
              type: "address",
            },
            {
              name: "_protocolFeePercent",
              type: "uint256",
            },
            {
              name: "_streamerFeePercent",
              type: "uint256",
            },
            {
              name: "_totalSupplyThreshold",
              type: "uint256",
            },
            {
              name: "_factoryAddress",
              type: "address",
            },
            {
              name: "_creationBlockNumber",
              type: "uint256",
            },
          ],
          [
            args.name as string,
            args.symbol as string,
            args.endTimestamp as bigint,
            args.protocolFeeDestination as `0x${string}`,
            args.protocolFeePercent as bigint,
            args.streamerFeePercent as bigint,
            args.totalSupplyThreshold as bigint,
            factoryContract.address as `0x${string}`,
            args.creationBlockNumber as bigint,
          ]
        );
        console.log("createTempToken success", data, args, encoded);
        await postTempToken({
          tokenAddress: args.tokenAddress as `0x${string}`,
          symbol: args.symbol as string,
          streamerFeePercentage: args.streamerFeePercent as bigint,
          protocolFeePercentage: args.protocolFeePercent as bigint,
          ownerAddress: args.owner as `0x${string}`,
          name: args.name as string,
          endUnixTimestamp: args.endTimestamp as bigint,
          channelId: Number(channel.channelQueryData?.id),
          chainId: localNetwork.config.chainId as number,
          highestTotalSupply: BigInt(0),
          creationBlockNumber: args.creationBlockNumber as bigint,
        });
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                createTempToken success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        // wait for 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000));
        // verify the contract on base
        await verifyTempTokenV1OnBase(
          args.tokenAddress as `0x${string}`,
          encoded
        );
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              createTempToken error
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
    }
  );

  const handleNewTokenName = useCallback((name: string) => {
    setNewTokenName(name);
  }, []);

  const handleNewTokenSymbol = useCallback((symbol: string) => {
    setNewTokenSymbol(symbol);
  }, []);

  const handleNewTokenDuration = useCallback((duration: bigint) => {
    setNewTokenDuration(duration);
  }, []);

  return {
    newTokenName,
    newTokenSymbol,
    newTokenDuration,
    createTempToken: _createTempToken,
    createTempTokenData,
    createTempTokenTxData,
    isCreateTempTokenLoading,
    handleNewTokenName,
    handleNewTokenSymbol,
    handleNewTokenDuration,
  };
};
