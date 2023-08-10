import {
  Flex,
  Textarea,
  Stack,
  IconButton,
  Image,
  useToast,
  Box,
  Spinner,
  Text,
  Button,
  Tooltip,
} from "@chakra-ui/react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useNetwork } from "wagmi";
import { parseUnits } from "viem";
import copy from "copy-to-clipboard";

import {
  CommandData,
  InteractionType,
  USER_APPROVAL_AMOUNT,
} from "../../constants";
import Commands from "./Commands";
import { EmojiType } from "../../constants/types/chat";
import { useChannelContext } from "../../hooks/context/useChannel";
import { useUser } from "../../hooks/context/useUser";
import EmojiButton from "./emoji/EmojiButton";
import { useApproval } from "../../hooks/contracts/useApproval";
import { getContractFromNetwork } from "../../utils/contract";
import { NETWORKS } from "../../constants/networks";
import CreatorTokenAbi from "../../constants/abi/CreatorToken.json";
import { formatIncompleteNumber } from "../../utils/validation/input";
import { useUseFeature } from "../../hooks/contracts/useArcadeContract";
import centerEllipses from "../../utils/centerEllipses";
import { ChatBot } from "../../constants/types";

type Props = {
  sendChatMessage: (message: string, isGif: boolean, body?: string) => void;
  inputBox: HTMLTextAreaElement | null;
  mobile?: boolean;
  additionalChatCommands?: CommandData[];
  addToChatbot?: (chatBotMessageToAdd: ChatBot) => void;
};

const PRICE = "2";

const ChatForm = ({
  sendChatMessage,
  inputBox,
  mobile,
  additionalChatCommands,
  addToChatbot,
}: Props) => {
  const { user, walletIsConnected, userAddress: address } = useUser();
  const network = useNetwork();

  const toast = useToast();
  const { channel: channelContext, token } = useChannelContext();
  const { channelQueryData } = channelContext;
  const { userTokenBalance, refetchUserTokenBalance } = token;

  const [messageText, setMessageText] = useState<string>("");
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [txTransition, setTxTransition] = useState(false);
  const [error, setError] = useState<string>("");
  const [tooltipError, setTooltipError] = useState<string>("");
  const [gifInTransaction, setGifInTransaction] = useState<string>("");
  const transitioningTxFromApprovalToExec = useRef(false);

  const [blastMode, setBlastMode] = useState(false);

  const localNetwork = useMemo(() => {
    return (
      NETWORKS.find((n) => n.config.chainId === network.chain?.id) ??
      NETWORKS[0]
    );
  }, [network]);
  const contract = getContractFromNetwork("unlonelyArcade", localNetwork);

  const {
    requiresApproval,
    writeApproval,
    isTxLoading: isApprovalLoading,
    isTxSuccess: isApprovalSuccess,
    refetchAllowance,
  } = useApproval(
    channelQueryData?.token?.address as `0x${string}`,
    CreatorTokenAbi,
    user?.address as `0x${string}`,
    contract?.address as `0x${string}`,
    contract?.chainId as number,
    parseUnits(PRICE as `${number}`, 18),
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
        useFeature?.();
        refetchAllowance();
      },
    }
  );

  const tokenAmount_bigint = useMemo(
    () =>
      requiresApproval
        ? BigInt(0)
        : parseUnits(formatIncompleteNumber(PRICE) as `${number}`, 18),
    [requiresApproval]
  );

  const { useFeature, useFeatureTxLoading } = useUseFeature(
    {
      creatorTokenAddress: channelQueryData?.token?.address as `0x${string}`,
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
        setTxTransition(false);
      },
      onWriteError: (error) => {
        toast({
          duration: 9000,
          isClosable: true,
          position: "top-right",
          render: () => (
            <Box as="button" borderRadius="md" bg="#bd711b" px={4} h={8}>
              useFeature cancelled
            </Box>
          ),
        });
        setTxTransition(false);
        setError(error);
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
        sendChatMessage(
          gifInTransaction !== ""
            ? gifInTransaction
            : messageText.replace(/^\s*\n|\n\s*$/g, ""),
          gifInTransaction !== "",
          `${InteractionType.BLAST}:`
        );
        setGifInTransaction("");
        setTxTransition(false);
        setBlastMode(false);
        refetchUserTokenBalance?.();
        refetchAllowance();
        setMessageText("");
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              useFeature error
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        setBlastMode(false);
        setGifInTransaction("");
        setTxTransition(false);
        setError(error);
      },
    }
  );

  const txLoading = useMemo(() => {
    return isApprovalLoading || useFeatureTxLoading;
  }, [isApprovalLoading, useFeatureTxLoading]);

  const messageTextIsEmpty =
    messageText.trim().length === 0 || messageText.trim() === "";

  const addEmoji = (emoji: EmojiType) => {
    setMessageText(`${messageText}${emoji.unicodeString}`);
  };

  const sendGif = (gif: string) => {
    if (!blastMode) {
      sendChatMessage(gif, true);
      setMessageText("");
    } else {
      if (tooltipError !== "") return;
      if (channelQueryData?.token?.address) {
        setTxTransition(true);
        setGifInTransaction(gif);
        if (requiresApproval && writeApproval) {
          writeApproval();
        } else {
          useFeature?.();
        }
      } else {
        sendChatMessage(gif, true, `${InteractionType.BLAST}:`);
        setBlastMode(false);
      }
    }
  };

  const handleKeyPress = useCallback(
    async (event: any) => {
      if (event.charCode !== 13 || messageTextIsEmpty) {
        if (event.charCode === 33) {
          setCommandsOpen(true);
        }
        return;
      }
      if (event.charCode === 13) {
        setCommandsOpen(false);
      }
      event.preventDefault();
      if (!blastMode) {
        sendChatMessage(messageText.replace(/^\s*\n|\n\s*$/g, ""), false);
        setMessageText("");
      } else {
        if (tooltipError !== "") return;
        if (channelQueryData?.token?.address) {
          setTxTransition(true);
          setGifInTransaction("");
          if (requiresApproval && writeApproval) {
            writeApproval();
          } else {
            useFeature?.();
          }
        } else {
          sendChatMessage(
            messageText.replace(/^\s*\n|\n\s*$/g, ""),
            false,
            `${InteractionType.BLAST}:`
          );
          setBlastMode(false);
        }
      }
    },
    [
      blastMode,
      messageText,
      requiresApproval,
      writeApproval,
      useFeature,
      messageTextIsEmpty,
      tooltipError,
    ]
  );

  const handleFormSubmission = useCallback(
    async (event: { preventDefault: () => void }) => {
      event.preventDefault();
      if (!blastMode) {
        sendChatMessage(messageText.replace(/^\s*\n|\n\s*$/g, ""), false);
        setMessageText("");
      } else {
        if (channelQueryData?.token?.address) {
          setTxTransition(true);
          setGifInTransaction("");
          if (requiresApproval && writeApproval) {
            writeApproval();
          } else {
            useFeature?.();
          }
        } else {
          sendChatMessage(
            messageText.replace(/^\s*\n|\n\s*$/g, ""),
            false,
            `${InteractionType.BLAST}:`
          );
          setBlastMode(false);
        }
      }
    },
    [blastMode, messageText, requiresApproval, writeApproval, useFeature]
  );

  useEffect(() => {
    if (
      blastMode &&
      (!userTokenBalance?.value ||
        (userTokenBalance?.value &&
          parseUnits(PRICE, 18) > userTokenBalance?.value))
    ) {
      setTooltipError(
        `you don't have enough ${channelQueryData?.token?.symbol} to spend`
      );
    } else {
      setTooltipError("");
    }
  }, [channelQueryData, userTokenBalance?.value, blastMode]);

  useEffect(() => {
    if (
      isApprovalSuccess &&
      useFeature &&
      !transitioningTxFromApprovalToExec.current
    ) {
      transitioningTxFromApprovalToExec.current = true;
      useFeature();
    }
  }, [isApprovalSuccess, useFeature]);

  const toastSignIn = () => {
    toast({
      title: "Sign in first.",
      description: "Please sign into your wallet first.",
      status: "warning",
      duration: 9000,
      isClosable: true,
      position: "top",
    });
  };

  return (
    <>
      <form
        onSubmit={handleFormSubmission}
        className="xeedev-form-i"
        style={{ width: "100%" }}
      >
        <Stack direction={"row"} spacing={"10px"}>
          {!walletIsConnected ? (
            <Flex justifyContent={"center"} margin="auto">
              <Text>you must sign in to chat</Text>
            </Flex>
          ) : error ? (
            <Flex direction="column" gap="10px">
              <Text textAlign={"center"} color="#fa8a29">
                There was an error when trying to send your blast message
              </Text>
              <Flex gap="10px">
                <Button
                  width="100%"
                  bg="#b82929"
                  onClick={() => copy(error)}
                  _focus={{}}
                  _hover={{ background: "#f25719" }}
                >
                  copy error
                </Button>
                <Button
                  opacity={"0.5"}
                  border={"1px solid white"}
                  bg={"transparent"}
                  width="100%"
                  onClick={() => setError("")}
                  _focus={{}}
                  _hover={{ opacity: "1" }}
                  _active={{}}
                >
                  close
                </Button>
              </Flex>
            </Flex>
          ) : txLoading ? (
            <Flex direction="column" gap="20px">
              <Flex justifyContent={"center"} p="10px">
                {gifInTransaction !== "" ? (
                  <Image
                    src={gifInTransaction}
                    height="80px"
                    className="zooming-text"
                  />
                ) : (
                  <Spinner size="xl" />
                )}
              </Flex>
              <Text textAlign={"center"}>
                {isApprovalLoading
                  ? "Approving transaction, please do not exit this page..."
                  : "Executing transaction, please do not exit this page..."}
              </Text>
            </Flex>
          ) : txTransition ? (
            <Flex>
              <Text textAlign={"center"} color="#ffe120">
                Please complete the transaction in your wallet.
              </Text>
            </Flex>
          ) : (
            <>
              <Flex
                width="100%"
                position="relative"
                direction="column"
                border={blastMode ? "2px solid red" : "2px solid white"}
                px="10px"
                py="5px"
                borderRadius="12px"
                background={
                  mobile
                    ? "rgba(34, 34, 34, 0.35)"
                    : blastMode
                    ? "rgba(255, 108, 108, 0.35)"
                    : "rgba(255, 255, 255, 0.35)"
                }
              >
                {blastMode && (
                  <Text
                    color={"#b82929"}
                    fontSize="12px"
                    position="absolute"
                    top={-5}
                    whiteSpace="nowrap"
                  >
                    chat blast mode enabled{" "}
                    {channelQueryData?.token?.symbol &&
                      `(cost: ${PRICE} $${channelQueryData?.token?.symbol})`}
                  </Text>
                )}
                <Textarea
                  variant="unstyled"
                  ref={(element) => {
                    inputBox = element;
                  }}
                  value={messageText}
                  color={"white"}
                  fontWeight="medium"
                  placeholder={
                    blastMode
                      ? "blast a message to everyone watching!"
                      : "say something in chat!"
                  }
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  enterKeyHint="send"
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setCommandsOpen(false);
                    }
                    setMessageText(e.target.value);
                  }}
                  onKeyPress={handleKeyPress}
                  style={{ zIndex: 0, minHeight: mobile ? "68px" : "50px" }}
                  height={"100%"}
                />
                <Flex justifyContent={"flex-end"}>
                  <Tooltip
                    label="clipping is now free!"
                    background="#1db57d"
                    placement="left"
                    defaultIsOpen
                    hasArrow
                  >
                    <IconButton
                      icon={<Image src="/svg/cut.svg" />}
                      aria-label="clip stream"
                      bg="transparent"
                      _focus={{}}
                      _hover={{ transform: "scale(1.15)" }}
                      _active={{ transform: "scale(1.3)" }}
                      onClick={() => {
                        if (user) {
                          window.open(
                            `/clip?arn=${channelQueryData?.channelArn || ""}`,
                            "_blank"
                          );
                          addToChatbot?.({
                            username: user?.username ?? "",
                            address: user?.address ?? "",
                            taskType: InteractionType.CLIP,
                            title: `${
                              user?.username ?? centerEllipses(address, 15)
                            } has just clipped a highlight from this stream!`,
                            description: "",
                          });
                        } else {
                          toastSignIn();
                        }
                      }}
                    />
                  </Tooltip>
                  <Tooltip
                    label="chat blast!"
                    background="#ac1c09"
                    defaultIsOpen
                    hasArrow
                  >
                    <IconButton
                      icon={<Image src="/svg/blast.svg" />}
                      aria-label="clip stream"
                      bg={blastMode ? "red" : "transparent"}
                      _focus={{}}
                      _hover={{ transform: "scale(1.15)" }}
                      _active={{ transform: "scale(1.3)" }}
                      onClick={() => {
                        if (blastMode) {
                          setBlastMode(false);
                        } else {
                          if (user) {
                            setBlastMode(true);
                          } else {
                            toastSignIn();
                          }
                        }
                      }}
                    />
                  </Tooltip>
                  <EmojiButton
                    mobile={mobile}
                    onSelectEmoji={(emoji) => addEmoji(emoji)}
                    onSelectGif={(gif) => sendGif(gif)}
                  />
                </Flex>
                <Flex
                  position="absolute"
                  zIndex={3}
                  bottom="5px"
                  left="8px"
                  pt="2px"
                  pb="1px"
                  pl="2px"
                  pr="2px"
                  borderRadius="2rem"
                >
                  <Commands
                    chat={messageText}
                    open={commandsOpen}
                    onClose={() => setCommandsOpen(false)}
                    onCommandClick={(text: string) => {
                      setMessageText(text);
                      setCommandsOpen(false);
                    }}
                    additionalChatCommands={additionalChatCommands}
                  />
                </Flex>
              </Flex>
              <Stack direction="column">
                <Flex justifyContent="right">
                  <Tooltip
                    isOpen={tooltipError !== ""}
                    label={tooltipError}
                    placement="left"
                    shouldWrapChildren
                  >
                    <IconButton
                      type="submit"
                      disabled={messageTextIsEmpty || tooltipError !== ""}
                      icon={
                        blastMode ? (
                          <Image src="/svg/blast-send.svg" />
                        ) : (
                          <Image src="/svg/send.svg" />
                        )
                      }
                      aria-label="clip stream"
                      bg="transparent"
                      _focus={{}}
                      _hover={{ transform: "scale(1.15)" }}
                      _active={{ transform: "scale(1.3)" }}
                    />
                  </Tooltip>
                </Flex>
              </Stack>
            </>
          )}
        </Stack>
      </form>
    </>
  );
};

export default ChatForm;
