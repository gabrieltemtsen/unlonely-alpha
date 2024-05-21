import { useToast, Box } from "@chakra-ui/react";
import Link from "next/link";
import { decodeEventLog } from "viem";
import { useNetworkContext } from "../../../context/useNetwork";
import useUpdateTempTokenHasHitTotalSupplyThreshold from "../../../server/temp-token/useUpdateTempTokenHasHitTotalSupplyThreshold";
import { useCallback, useEffect, useState } from "react";
import { useUpdateTotalSupplyThreshold } from "../../../contracts/useTempTokenV1";
import { useTempTokenContext } from "../../../context/useTempToken";
import { useChannelContext } from "../../../context/useChannel";
import { InteractionType } from "../../../../constants";
import { useUser } from "../../../context/useUser";

export const useOwnerUpdateTotalSupplyThresholdState = (
  onSuccess?: () => void
) => {
  const { userAddress, user } = useUser();

  const { tempToken } = useTempTokenContext();
  const { gameState, currentTempTokenContract } = tempToken;
  const { currentActiveTokenSymbol } = gameState;
  const { chat } = useChannelContext();
  const { addToChatbot } = chat;
  const { network } = useNetworkContext();
  const { localNetwork, explorerUrl } = network;
  const toast = useToast();

  const [newSupplyThreshold, setNewSupplyThreshold] = useState<bigint>(
    BigInt(0)
  );

  const {
    updateTempTokenHasHitTotalSupplyThreshold:
      call_updateDb_hasHitTotalSupplyThreshold,
    loading: updateTempTokenHasHitTotalSupplyThresholdLoading,
  } = useUpdateTempTokenHasHitTotalSupplyThreshold({
    onError: (e) => {
      console.log("useUpdateTempTokenHasHitTotalSupplyThreshold", e);
    },
  });

  const {
    updateTotalSupplyThreshold,
    updateTotalSupplyThresholdData,
    updateTotalSupplyThresholdTxData,
    updateTotalSupplyThresholdTxLoading,
    isRefetchingUpdateTotalSupplyThreshold,
  } = useUpdateTotalSupplyThreshold(
    {
      newThreshold: newSupplyThreshold,
    },
    currentTempTokenContract,
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
                setTotalSupplyThresholdForTokens pending, click to view
              </Link>
            </Box>
          ),
          duration: 3000, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
        setNewSupplyThreshold(BigInt(0));
      },
      onWriteError: (error) => {
        console.log("setTotalSupplyThresholdForTokens error", error);
        toast({
          duration: 3000, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
          render: () => (
            <Box as="button" borderRadius="md" bg="#bd711b" px={4} h={8}>
              setTotalSupplyThresholdForTokens cancelled
            </Box>
          ),
        });
        setNewSupplyThreshold(BigInt(0));
      },
      onTxSuccess: async (data) => {
        await call_updateDb_hasHitTotalSupplyThreshold({
          tokenAddressesSetTrue: [],
          tokenAddressesSetFalse: [currentTempTokenContract.address],
          chainId: localNetwork.config.chainId,
        });
        const topics = decodeEventLog({
          abi: currentTempTokenContract.abi,
          data: data.logs[0].data,
          topics: data.logs[0].topics,
        });
        const args: any = topics.args;
        console.log("setTotalSupplyThresholdForTokens success", data, args);
        const newThreshold = args.totalSupplyThreshold as bigint;
        setNewSupplyThreshold(BigInt(0));
        const title = `The $${currentActiveTokenSymbol} token's price goal is increased!`;
        addToChatbot({
          username: user?.username ?? "",
          address: userAddress ?? "",
          taskType: InteractionType.TEMP_TOKEN_THRESHOLD_INCREASED,
          title,
          description: `${userAddress}:${String(newThreshold)}`,
        });
        onSuccess && onSuccess();
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                setTotalSupplyThresholdForTokens success, click to view
              </Link>
            </Box>
          ),
          duration: 3000, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
      },
      onTxError: (error) => {
        console.log("setTotalSupplyThresholdForTokens error", error);
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              setTotalSupplyThresholdForTokens error
            </Box>
          ),
          duration: 3000, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
        setNewSupplyThreshold(BigInt(0));
      },
    }
  );

  const callSetTotalSupplyThresholdForTokens = useCallback(
    async (newSupplyThreshold: bigint) => {
      setNewSupplyThreshold(newSupplyThreshold);
    },
    []
  );

  useEffect(() => {
    if (newSupplyThreshold === BigInt(0)) return;
    updateTotalSupplyThreshold?.();
  }, [newSupplyThreshold, updateTotalSupplyThreshold]);

  return {
    callSetTotalSupplyThresholdForTokens,
    updateTotalSupplyThresholdData,
    updateTotalSupplyThresholdTxData,
    loading:
      isRefetchingUpdateTotalSupplyThreshold ||
      updateTotalSupplyThresholdTxLoading ||
      updateTempTokenHasHitTotalSupplyThresholdLoading,
  };
};
