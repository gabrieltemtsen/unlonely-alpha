import { useVersusTempTokenContext } from "../../../context/useVersusTempToken";
import { useSetWinningTokenTradeableAndTransferLiquidity } from "../../../contracts/useTempTokenFactoryV1";
import { decodeEventLog, isAddressEqual } from "viem";
import { Contract, InteractionType } from "../../../../constants";
import { getContractFromNetwork } from "../../../../utils/contract";
import { useNetworkContext } from "../../../context/useNetwork";
import { Box, useToast } from "@chakra-ui/react";
import Link from "next/link";
import useUpdateTempTokenTransferredLiquidityOnExpiration from "../../../server/temp-token/useUpdateTempTokenTransferredLiquidityOnExpiration";
import useUpdateTempTokenIsAlwaysTradeable from "../../../server/temp-token/useUpdateTempTokenIsAlwaysTradeable";
import { useChannelContext } from "../../../context/useChannel";
import { useUser } from "../../../context/useUser";
import { calculateMaxWinnerTokensToMint } from "../../../../utils/calculateMaxWinnerTokensToMint";

export const useSetWinningTokenTradeableAndTransferLiquidityState = (
  callbackOnTxSuccess?: any
) => {
  const { userAddress, user } = useUser();

  const toast = useToast();

  const { gameState } = useVersusTempTokenContext();
  const { tokenA, tokenB } = gameState;
  const { chat } = useChannelContext();
  const { addToChatbot } = chat;
  const { network } = useNetworkContext();
  const { localNetwork, explorerUrl } = network;

  const factoryContract = getContractFromNetwork(
    Contract.TEMP_TOKEN_FACTORY_V1,
    localNetwork
  );

  const { updateTempTokenTransferredLiquidityOnExpiration, loading } =
    useUpdateTempTokenTransferredLiquidityOnExpiration({});

  const { updateTempTokenIsAlwaysTradeable } =
    useUpdateTempTokenIsAlwaysTradeable({});

  const {
    setWinningTokenTradeableAndTransferLiquidity,
    refetchSetWinningTokenTradeableAndTransferLiquidity,
    setWinningTokenTradeableAndTransferLiquidityData,
    setWinningTokenTradeableAndTransferLiquidityTxData,
    isSetWinningTokenTradeableAndTransferLiquidityLoading,
  } = useSetWinningTokenTradeableAndTransferLiquidity(
    {
      tokenAddresses: [tokenA.address, tokenB.address],
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
                (1/4) transfer funds pending
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
              transfer funds cancelled
            </Box>
          ),
        });
      },
      onTxSuccess: async (data) => {
        const topics = decodeEventLog({
          abi: factoryContract.abi,
          data: data.logs[data.logs.length - 1].data,
          topics: data.logs[data.logs.length - 1].topics,
        });
        const args: any = topics.args;
        console.log("transfer funds success", data, args);
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                (2/4) transfer funds success
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        const winnerTokenAddress = args.winnerTokenAddress as `0x${string}`;
        const loserTokenAddress = args.loserTokenAddress as `0x${string}`;
        const transferredLiquidityInWei = args.transferredLiquidity as bigint;
        const winnerTotalSupply = args.winnerTotalSupply as bigint;
        await updateTempTokenTransferredLiquidityOnExpiration({
          losingTokenAddress: loserTokenAddress,
          chainId: localNetwork.config.chainId,
          finalLiquidityInWei: String(transferredLiquidityInWei),
        })
          .then(() => {
            toast({
              render: () => (
                <Box as="button" borderRadius="md" bg="#5058c8" px={4} h={8}>
                  (3/4) transfer loser liquidity update database success
                </Box>
              ),
              duration: 9000,
              isClosable: true,
              position: "top-right",
            });
          })
          .catch((err) => {
            console.log("transfer loser liquidity update database error", err);
            toast({
              render: () => (
                <Box as="button" borderRadius="md" bg="#c87850" px={4} h={8}>
                  transfer loser liquidity update database error
                </Box>
              ),
              duration: 9000,
              isClosable: true,
              position: "top-right",
            });
          });
        await updateTempTokenIsAlwaysTradeable({
          tokenAddressesSetTrue: [winnerTokenAddress],
          tokenAddressesSetFalse: [],
          chainId: localNetwork.config.chainId,
        })
          .then(() => {
            toast({
              render: () => (
                <Box as="button" borderRadius="md" bg="#5058c8" px={4} h={8}>
                  (4/4) transfer loser liquidity update database success
                </Box>
              ),
              duration: 9000,
              isClosable: true,
              position: "top-right",
            });
          })
          .catch((err) => {
            console.log("transfer loser liquidity update database error", err);
            toast({
              render: () => (
                <Box as="button" borderRadius="md" bg="#c87850" px={4} h={8}>
                  transfer loser liquidity update database error
                </Box>
              ),
              duration: 9000,
              isClosable: true,
              position: "top-right",
            });
          });
        const { error: lambdaError, maxNumTokens } =
          await calculateMaxWinnerTokensToMint(
            Number(transferredLiquidityInWei),
            Number(winnerTotalSupply)
          );

        if (lambdaError) {
          toast({
            render: () => (
              <Box as="button" borderRadius="md" bg="#c87850" px={4} h={8}>
                cannot get max winner tokens, defaulting to 0: {lambdaError}
              </Box>
            ),
            duration: 9000,
            isClosable: true,
            position: "top-right",
          });
        }

        let _winningToken = tokenA;
        let _tokenType: "a" | "b" = "a";

        if (
          tokenA.address &&
          isAddressEqual(
            winnerTokenAddress as `0x${string}`,
            tokenA.address as `0x${string}`
          )
        ) {
          _winningToken = tokenA;
        }
        if (
          tokenB.address &&
          isAddressEqual(
            winnerTokenAddress as `0x${string}`,
            tokenB.address as `0x${string}`
          )
        ) {
          _winningToken = tokenB;
          _tokenType = "b";
        }

        const title = `The ${_winningToken.symbol} token is now tradeable!`;
        addToChatbot({
          username: user?.username ?? "",
          address: userAddress ?? "",
          taskType:
            InteractionType.VERSUS_SET_WINNING_TOKEN_TRADEABLE_AND_TRANSFER_LIQUIDITY,
          title,
          description: `${userAddress}:${winnerTokenAddress}:${loserTokenAddress}:${String(
            transferredLiquidityInWei
          )}:${_tokenType}:${String(maxNumTokens)}`,
        });
        callbackOnTxSuccess?.();
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              transfer funds error
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
    }
  );

  return {
    setWinningTokenTradeableAndTransferLiquidity,
    refetchSetWinningTokenTradeableAndTransferLiquidity,
    setWinningTokenTradeableAndTransferLiquidityData,
    setWinningTokenTradeableAndTransferLiquidityTxData,
    loading: loading || isSetWinningTokenTradeableAndTransferLiquidityLoading,
  };
};
