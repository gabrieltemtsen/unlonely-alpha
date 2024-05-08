import { Box, Button, Spinner, useToast } from "@chakra-ui/react";
import { useMintWinnerTokens } from "../../../../hooks/contracts/useTempTokenFactoryV1";
import { useVersusTempTokenContext } from "../../../../hooks/context/useVersusTempToken";
import { useEffect, useState } from "react";
import { Contract, InteractionType } from "../../../../constants";
import { useNetworkContext } from "../../../../hooks/context/useNetwork";
import { getContractFromNetwork } from "../../../../utils/contract";
import { decodeEventLog, isAddress, isAddressEqual } from "viem";
import Link from "next/link";
import * as AWS from "aws-sdk";
import { usePublicClient } from "wagmi";
import { useUser } from "../../../../hooks/context/useUser";
import { useChannelContext } from "../../../../hooks/context/useChannel";

export const PermamintModule = (callbackOnTxSuccess?: any) => {
  const { userAddress, user } = useUser();

  const { gameState } = useVersusTempTokenContext();
  const {
    winningToken,
    losingToken,
    tokenA,
    tokenB,
    handleOwnerMustPermamint,
  } = gameState;

  const { chat } = useChannelContext();
  const { addToChatbot } = chat;
  const { network } = useNetworkContext();
  const { localNetwork, explorerUrl } = network;
  const toast = useToast();
  const publicClient = usePublicClient();

  const factoryContract = getContractFromNetwork(
    Contract.TEMP_TOKEN_FACTORY_V1,
    localNetwork
  );

  const [amountOfTokensToMint, setAmountOfTokensToMint] = useState<
    number | undefined
  >(undefined);
  const { mintWinnerTokens, isMintWinnerTokensLoading } = useMintWinnerTokens(
    {
      winnerTokenAddress: winningToken?.address as `0x${string}`,
      amountOfTokens: BigInt(amountOfTokensToMint ?? "0"),
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
                mint winner tokens pending, click to view
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
              mint winner tokens cancelled
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
        console.log("mint winner tokens success", data, args);
        const winnerTokenAddress = args.winnerTokenAddress as `0x${string}`;
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                mint winner tokens success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });

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

        const title = `The ${_winningToken.symbol} token's price increased!`;

        addToChatbot({
          username: user?.username ?? "",
          address: userAddress ?? "",
          taskType: InteractionType.VERSUS_WINNER_TOKENS_MINTED,
          title,
          description: `${userAddress}:${_tokenType}`,
        });
        callbackOnTxSuccess?.();
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              mint winner tokens error
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
    }
  );

  useEffect(() => {
    const calculateMaxWinnerTokensToMint = async () => {
      if (!isAddress(winningToken?.address) || !isAddress(losingToken?.address))
        return;
      const wei_amount = Number(losingToken.transferredLiquidityOnExpiration);
      const total_fee_percent: number = 10 * 10 ** 16; // 5% protocol fee and 5% streamer fee
      const winningTokenSupply = Number(winningToken.totalSupply);
      const lambda = new AWS.Lambda({
        region: "us-west-2",
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
      });

      const params = {
        FunctionName: "calcMaxNumTokensCanBuy",
        Payload: JSON.stringify({
          detail: {
            wei_amount: wei_amount,
            token_supply: winningTokenSupply,
            total_fee_percent: total_fee_percent,
          },
        }),
      };

      const maxNumTokensResponse = await lambda.invoke(params).promise();
      const parsedResponse = JSON.parse(maxNumTokensResponse.Payload as any);
      if (parsedResponse.errorMessage) {
        setAmountOfTokensToMint(undefined);
        console.error(
          "lambda calculate max tokens error:",
          parsedResponse.errorMessage
        );
      } else {
        const maxNumTokens: number = parsedResponse.body as number;
        setAmountOfTokensToMint(maxNumTokens);
        console.log(
          "max amount to mint winner tokens",
          maxNumTokens,
          wei_amount,
          winningTokenSupply,
          total_fee_percent
        );
        /**
         * If the maxNumTokens is 0, then the owner does not need to permamint and can skip this step
         */
        if (maxNumTokens === 0) {
          handleOwnerMustPermamint(false);
        }
      }
    };
    calculateMaxWinnerTokensToMint();
  }, [winningToken, losingToken, publicClient]);

  return (
    <Button
      onClick={mintWinnerTokens}
      isDisabled={
        isMintWinnerTokensLoading ||
        !mintWinnerTokens ||
        amountOfTokensToMint === 0 ||
        amountOfTokensToMint === undefined
      }
    >
      {isMintWinnerTokensLoading || amountOfTokensToMint === undefined ? (
        <Spinner />
      ) : (
        `Mint Winner Tokens (${amountOfTokensToMint})`
      )}
    </Button>
  );
};
