import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Button,
  Flex,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Box,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChatBot } from "../../constants/types";
import { ModalButton } from "../general/button/ModalButton";
import { useChannelContext } from "../../hooks/context/useChannel";
import { useUser } from "../../hooks/context/useUser";
import useUpdateChannelCustomButton from "../../hooks/server/useUpdateChannelCustomButton";
import {
  filteredInput,
  formatIncompleteNumber,
} from "../../utils/validation/input";
import { TransactionModalTemplate } from "./TransactionModalTemplate";
import { useUseFeature } from "../../hooks/contracts/useArcadeContract";
import { useApproval } from "../../hooks/contracts/useApproval";
import CreatorTokenAbi from "../../constants/abi/CreatorToken.json";
import { NETWORKS } from "../../constants/networks";
import { useNetwork } from "wagmi";
import { getContractFromNetwork } from "../../utils/contract";
import { parseUnits } from "viem";
import { InteractionType, USER_APPROVAL_AMOUNT } from "../../constants";
import centerEllipses from "../../utils/centerEllipses";
import { truncateValue } from "../../utils/tokenDisplayFormatting";
import Link from "next/link";

const CUSTOM = "custom";
const SAMPLE1 = "pushup";
const SAMPLE2 = "product review";
const SAMPLE3 = "song request";

const sampleArray = [SAMPLE1, SAMPLE2, SAMPLE3];

export default function CustomTransactionModal({
  title,
  isOpen,
  icon,
  handleClose,
  addToChatbot,
}: {
  title: string;
  isOpen: boolean;
  icon?: JSX.Element;
  handleClose: () => void;
  addToChatbot?: (chatBotMessageToAdd: ChatBot) => void;
}) {
  const { user, userAddress, walletIsConnected } = useUser();
  const network = useNetwork();
  const toast = useToast();
  const localNetwork = useMemo(() => {
    return (
      NETWORKS.find((n) => n.config.chainId === network.chain?.id) ??
      NETWORKS[0]
    );
  }, [network]);
  const contract = getContractFromNetwork("unlonelyArcade", localNetwork);
  const { channel, token } = useChannelContext();
  const { channelBySlug } = channel;
  const { userTokenBalance, refetchUserTokenBalance } = token;

  const isOwner = useMemo(
    () => user?.address === channelBySlug?.owner.address,
    [user, channelBySlug]
  );

  const [currentRequest, setCurrentRequest] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<string>("0");

  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [newPrice, setNewPrice] = useState<string>(
    String(channelBySlug?.customButtonPrice ?? "0")
  );
  const [chosenRequest, setChosenRequest] = useState<string>("");
  const [customRequest, setCustomRequest] = useState<string>(
    String(channelBySlug?.customButtonAction ?? "")
  );

  useEffect(() => {
    setCurrentPrice(String(channelBySlug?.customButtonPrice ?? "0"));
    setCurrentRequest(String(channelBySlug?.customButtonAction ?? ""));
  }, [channelBySlug?.customButtonAction, channelBySlug?.customButtonPrice]);

  const { updateChannelCustomButton, loading: updateLoading } =
    useUpdateChannelCustomButton({});

  const callChange = useCallback(() => {
    updateChannelCustomButton({
      id: channelBySlug?.id,
      customButtonPrice: Number(newPrice),
      customButtonAction:
        chosenRequest === CUSTOM ? customRequest : chosenRequest,
    });
    setIsEditing(false);
  }, [channelBySlug, newPrice, chosenRequest, customRequest]);

  const {
    requiresApproval,
    writeApproval,
    isTxLoading: isApprovalLoading,
    refetchAllowance,
  } = useApproval(
    channelBySlug?.token?.address as `0x${string}`,
    CreatorTokenAbi,
    user?.address as `0x${string}`,
    contract?.address as `0x${string}`,
    contract?.chainId as number,
    parseUnits(currentPrice as `${number}`, 18),
    parseUnits(USER_APPROVAL_AMOUNT, 18),
    {
      onWriteSuccess: (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
              <Link
                target="_blank"
                href={`https://etherscan.io/tx/${data.hash}`}
                passHref
              >
                approve pending, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
      onTxSuccess: (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`https://etherscan.io/tx/${data.transactionHash}`}
                passHref
              >
                approve success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        refetchAllowance();
      },
    }
  );

  const tokenAmount_bigint = useMemo(
    () =>
      requiresApproval
        ? BigInt(0)
        : parseUnits(formatIncompleteNumber(currentPrice) as `${number}`, 18),
    [currentPrice, requiresApproval]
  );

  const { useFeature, useFeatureTxLoading } = useUseFeature(
    {
      creatorTokenAddress: channelBySlug?.token?.address as `0x${string}`,
      featurePrice: tokenAmount_bigint,
    },
    {
      onWriteSuccess: (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
              <Link
                target="_blank"
                href={`https://etherscan.io/tx/${data.hash}`}
                passHref
              >
                useFeature pending, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
      onTxSuccess: (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`https://etherscan.io/tx/${data.transactionHash}`}
                passHref
              >
                useFeature success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        addToChatbot?.({
          username: user?.username ?? "",
          address: user?.address ?? "",
          taskType: InteractionType.CUSTOM,
          title: `${
            user?.username ?? centerEllipses(user?.address, 15)
          } paid for ${currentRequest}!`,
          description: "",
        });
        refetchUserTokenBalance?.();
        handleClose();
      },
    }
  );

  const inputStyle = {
    borderWidth: "1px",
    borderRadius: "10px",
    borderColor: "#244FA7",
    bg: "rgba(36, 79, 167, 0.05)",
    variant: "unstyled",
    px: "16px",
    py: "10px",
  };

  const canOwnerSend = useMemo(() => {
    if (!isOwner) return false;
    if (Number(formatIncompleteNumber(newPrice)) === 0) return false;
    if (chosenRequest === CUSTOM && customRequest.length === 0) return false;
    if (
      chosenRequest === CUSTOM &&
      channelBySlug?.customButtonAction === customRequest
    )
      return false;
    if (chosenRequest !== CUSTOM && chosenRequest.length === 0) return false;
    return true;
  }, [isOwner, newPrice, chosenRequest, customRequest, channelBySlug]);

  const canViewerSend = useMemo(() => {
    if (requiresApproval) return false;
    if (!userAddress) return false;
    if (!useFeature) return false;
    return true;
  }, [useFeature, userAddress, requiresApproval]);

  const determinedBg = useMemo(() => {
    const defaultBg = "#244FA7";
    const customBg = "rgb(214, 98, 20)";
    if (chosenRequest.length > 0) {
      if (chosenRequest === CUSTOM) {
        if (customRequest.length > 0) {
          return customBg;
        }
        return defaultBg;
      }
      return defaultBg;
    } else {
      if (customRequest.length > 0) {
        return customBg;
      }
      return defaultBg;
    }
  }, [chosenRequest, customRequest]);

  const _handleClose = () => {
    setIsEditing(false);
    handleClose();
  };

  useEffect(() => {
    if (!walletIsConnected) {
      setErrorMessage("connect wallet first");
    } else if (
      !userTokenBalance?.value ||
      (userTokenBalance?.value &&
        parseUnits(currentPrice as `${number}`, 18) > userTokenBalance?.value)
    ) {
      setErrorMessage(
        `you don't have enough ${channelBySlug?.token?.symbol} to spend`
      );
    } else {
      setErrorMessage("");
    }
  }, [
    walletIsConnected,
    userTokenBalance,
    channelBySlug,
    currentPrice as `${number}`,
  ]);

  const txnLoading = useMemo(() => {
    return (useFeatureTxLoading ?? false) || isApprovalLoading;
  }, [useFeatureTxLoading, isApprovalLoading]);

  return (
    <TransactionModalTemplate
      title={title}
      confirmButton={isOwner ? "set" : "send"}
      isOpen={isOpen}
      icon={icon}
      isModalLoading={txnLoading || updateLoading}
      loadingText={updateLoading ? "updating..." : undefined}
      canSend={isOwner ? canOwnerSend : canViewerSend}
      onSend={isOwner ? callChange : useFeature}
      handleClose={_handleClose}
      hideFooter={!isEditing && isOwner}
      needsApproval={!isOwner && requiresApproval}
      approve={writeApproval}
    >
      <Flex direction={"column"} gap="16px">
        {isOwner ? (
          <>
            {isEditing && (
              <>
                <Flex gap="10px" alignItems="center">
                  <Text>action</Text>
                  <Menu>
                    <MenuButton
                      as={Button}
                      rightIcon={<ChevronDownIcon />}
                      borderWidth="3px"
                      borderRadius="25px"
                      borderColor={determinedBg}
                      bg={determinedBg}
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                    >
                      {chosenRequest ||
                        channelBySlug?.customButtonAction ||
                        "select option"}
                    </MenuButton>
                    <MenuList bg="#000" border="none">
                      {sampleArray.map((sample) => (
                        <MenuItem
                          bg={"rgb(36, 79, 167)"}
                          opacity="0.8"
                          _hover={{ opacity: "1" }}
                          _focus={{ opacity: "1" }}
                          _active={{ opacity: "1" }}
                          onClick={() => setChosenRequest(sample)}
                        >
                          {sample}
                        </MenuItem>
                      ))}
                      <MenuItem
                        bg={"rgb(214, 98, 20)"}
                        opacity="0.8"
                        _hover={{ opacity: "1" }}
                        _focus={{ opacity: "1" }}
                        _active={{ opacity: "1" }}
                        onClick={() => setChosenRequest(CUSTOM)}
                      >
                        {CUSTOM}
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
                {chosenRequest === CUSTOM && (
                  <Input
                    {...inputStyle}
                    placeholder='e.g. "do 10 situps"'
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                  />
                )}
                <Flex gap="10px" alignItems="center">
                  <Text>price</Text>
                  <Input
                    width="100px"
                    {...inputStyle}
                    value={newPrice}
                    onChange={(e) =>
                      setNewPrice(filteredInput(e.target.value, false))
                    }
                  />
                </Flex>
              </>
            )}
            {!isEditing && (
              <>
                <Flex gap="10px" alignItems="center" justifyContent={"center"}>
                  <Text fontSize="30px" fontFamily={"Neue Pixel Sans"}>
                    action:
                  </Text>
                  <Text fontSize="30px">{currentRequest}</Text>
                </Flex>
                <Flex gap="10px" alignItems="center" justifyContent={"center"}>
                  <Text fontSize="30px" fontFamily={"Neue Pixel Sans"}>
                    price:
                  </Text>
                  <Text fontSize="30px">{currentPrice}</Text>
                </Flex>
                <ModalButton onClick={() => setIsEditing(true)}>
                  edit
                </ModalButton>
              </>
            )}
          </>
        ) : (
          <>
            {channelBySlug?.customButtonAction ? (
              <>
                <Text textAlign={"center"} fontSize="25px" color="#BABABA">
                  you own{" "}
                  {`${truncateValue(userTokenBalance?.formatted ?? "0", 3)} $${
                    channelBySlug?.token?.symbol
                  }`}
                </Text>
                <Flex gap="10px" alignItems="center" justifyContent={"center"}>
                  <Text fontSize="30px" fontFamily={"Neue Pixel Sans"}>
                    action:
                  </Text>
                  <Text fontSize="30px">{currentRequest}</Text>
                </Flex>
                <Flex gap="10px" alignItems="center" justifyContent={"center"}>
                  <Text fontSize="30px" fontFamily={"Neue Pixel Sans"}>
                    price:
                  </Text>
                  <Text fontSize="30px">{currentPrice}</Text>
                </Flex>
                {errorMessage && (
                  <Text textAlign={"center"} color="red.400">
                    {errorMessage}
                  </Text>
                )}
              </>
            ) : (
              <Text fontSize="20px" textAlign={"center"}>
                streamer hasn't set a custom action yet
              </Text>
            )}
          </>
        )}
      </Flex>
    </TransactionModalTemplate>
  );
}