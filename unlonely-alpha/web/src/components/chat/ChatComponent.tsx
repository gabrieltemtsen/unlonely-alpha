import { ChevronDownIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { decodeEventLog, formatUnits } from "viem";
import {
  Flex,
  Box,
  Text,
  Container,
  Table,
  Image,
  TableContainer,
  Tbody,
  Td,
  Tr,
  IconButton,
  Button,
  useToast,
  Input,
  Spinner,
  Tooltip,
} from "@chakra-ui/react";
import {
  useEffect,
  useRef,
  useState,
  CSSProperties,
  useMemo,
  useCallback,
} from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useBalance, useBlockNumber } from "wagmi";

import {
  ADD_REACTION_EVENT,
  InteractionType,
  NULL_ADDRESS,
} from "../../constants";
import { ChatReturnType, useChatBox } from "../../hooks/chat/useChat";
import { useChannelContext } from "../../hooks/context/useChannel";
import { useNetworkContext } from "../../hooks/context/useNetwork";
import {
  useBuyVotes,
  useGetPriceAfterFee,
  useReadMappings,
  useGenerateKey,
  useSellVotes,
  useGetHolderBalances,
  useClaimVotePayout,
} from "../../hooks/contracts/useSharesContractV2";
import useUserAgent from "../../hooks/internal/useUserAgent";
import usePostBetTrade from "../../hooks/server/gamblable/usePostBetTrade";
import { getContractFromNetwork } from "../../utils/contract";
import { truncateValue } from "../../utils/tokenDisplayFormatting";
import { filteredInput } from "../../utils/validation/input";
import { OuterBorder, BorderType } from "../general/OuterBorder";
import ChatForm from "./ChatForm";
import MessageList from "./MessageList";
import { useUser } from "../../hooks/context/useUser";
import centerEllipses from "../../utils/centerEllipses";
import { getTimeFromMillis } from "../../utils/time";
import { GamblableEvent, SharesEventState } from "../../generated/graphql";
import Participants from "../presence/Participants";
import { getSortedLeaderboard } from "../../utils/getSortedLeaderboard";

const ChatComponent = ({ chat }: { chat: ChatReturnType }) => {
  const { isStandalone } = useUserAgent();
  const [selectedTab, setSelectedTab] = useState<"chat" | "trade" | "vip">(
    "chat"
  );
  const { channel: channelContext, leaderboard: leaderboardContext } =
    useChannelContext();
  const { channelQueryData } = channelContext;

  const { network } = useNetworkContext();
  const { localNetwork } = network;

  const {
    data: leaderboardData,
    loading: leaderboardLoading,
    error: leaderboardError,
    refetchGamblableEventLeaderboard,
  } = leaderboardContext;

  const [leaderboard, setLeaderboard] = useState<
    { name: string; totalFees: number }[]
  >([]);
  const [leaderboardIsCollapsed, setLeaderboardIsCollapsed] = useState(true);

  const doesEventExist = useMemo(() => {
    if (!channelQueryData?.sharesEvent?.[0]?.sharesSubjectAddress) return false;
    if (!channelQueryData?.sharesEvent?.[0]?.id) return false;
    return true;
  }, [channelQueryData?.sharesEvent]);

  useEffect(() => {
    refetchGamblableEventLeaderboard?.();
  }, [localNetwork]);

  useEffect(() => {
    if (!leaderboardLoading && !leaderboardError && leaderboardData) {
      const _leaderboard: { name: string; totalFees: number }[] =
        getSortedLeaderboard(
          leaderboardData.getGamblableEventLeaderboardByChannelId
        );
      setLeaderboard(_leaderboard);
    }
  }, [leaderboardLoading, leaderboardError, leaderboardData]);

  return (
    <Flex
      height={!isStandalone ? { base: "80vh" } : "100%"}
      position={"relative"}
    >
      <OuterBorder type={BorderType.OCEAN} p={"0"}>
        <Container centerContent maxW="100%" h="100%" alignSelf="end" p="0">
          <Flex width="100%">
            <OuterBorder
              cursor={"pointer"}
              type={BorderType.OCEAN}
              zIndex={selectedTab === "chat" ? 4 : 2}
              onClick={() => setSelectedTab("chat")}
              noborder
              pb={selectedTab === "chat" ? "0px" : undefined}
            >
              <Flex
                bg={selectedTab === "chat" ? "#1b9d9d" : "rgba(19, 18, 37, 1)"}
                width="100%"
                justifyContent={"center"}
              >
                <Text fontFamily="LoRes15" fontSize="20px" fontWeight={"bold"}>
                  chat
                </Text>
              </Flex>
            </OuterBorder>
            <OuterBorder
              cursor={"pointer"}
              type={BorderType.OCEAN}
              zIndex={selectedTab === "trade" ? 4 : 2}
              onClick={() => setSelectedTab("trade")}
              noborder
              pb={selectedTab === "trade" ? "0px" : undefined}
            >
              <Flex
                bg={selectedTab === "trade" ? "#1b9d9d" : "rgba(19, 18, 37, 1)"}
                width="100%"
                justifyContent={"center"}
                alignItems={"center"}
              >
                {doesEventExist && (
                  <Text className="zooming-text" fontSize="10px">
                    🔴
                  </Text>
                )}
                <Text
                  alignItems={"center"}
                  fontFamily="LoRes15"
                  fontSize="20px"
                  fontWeight={"bold"}
                >
                  vote
                </Text>
              </Flex>
            </OuterBorder>
            <OuterBorder
              cursor={"pointer"}
              type={BorderType.OCEAN}
              zIndex={selectedTab === "vip" ? 4 : 2}
              onClick={() => setSelectedTab("vip")}
              noborder
              pb={selectedTab === "vip" ? "0px" : undefined}
            >
              <Flex
                bg={
                  selectedTab === "vip"
                    ? "#1b9d9d"
                    : "linear-gradient(163deg, rgba(255,255,255,1) 1%, rgba(255,227,143,1) 13%, rgba(255,213,86,1) 14%, rgba(246,190,45,1) 16%, rgba(249,163,32,1) 27%, rgba(231,143,0,1) 28%, #2e1405 30%, #603208 100%)"
                }
                width="100%"
                justifyContent={"center"}
                alignItems={"center"}
                gap="5px"
              >
                <Text fontFamily="LoRes15" fontSize="20px" fontWeight={"bold"}>
                  vip
                </Text>
                <Tooltip
                  label="buy a vip badge to get access to the VIP chat!"
                  shouldWrapChildren
                >
                  <Image src="/svg/info.svg" width="16px" height="16px" />
                </Tooltip>
              </Flex>
            </OuterBorder>
          </Flex>
          <OuterBorder
            type={BorderType.OCEAN}
            width={"100%"}
            zIndex={3}
            alignSelf="flex-end"
            noborder
            pt="0px"
          >
            <Flex
              bg="rgba(24, 22, 47, 1)"
              p={"0.5rem"}
              width={"100%"}
              direction="column"
            >
              <Participants />
              <Flex
                mt={"0.5rem"}
                borderRadius={"5px"}
                p="1px"
                zIndex={3}
                mb="30px"
              >
                <Flex
                  direction="column"
                  position="absolute"
                  bg="rgba(24, 22, 47, 1)"
                  left={"10px"}
                  right={"10px"}
                  border={"1px solid rgba(255, 255, 255, 0.1)"}
                >
                  <Text
                    fontSize={"20px"}
                    textAlign={"center"}
                    fontFamily={"LoRes15"}
                  >
                    leaderboard
                  </Text>
                  <IconButton
                    aria-label="show leaderboard"
                    _hover={{}}
                    _active={{}}
                    _focus={{}}
                    bg="transparent"
                    icon={<ChevronDownIcon />}
                    onClick={() => {
                      setLeaderboardIsCollapsed(!leaderboardIsCollapsed);
                    }}
                    position="absolute"
                    right="-10px"
                    top="-10px"
                    transform={!leaderboardIsCollapsed ? "rotate(180deg)" : ""}
                  />
                  {leaderboardIsCollapsed && (
                    <Box
                      position="absolute"
                      bg={"linear-gradient(to bottom, transparent 75%, black)"}
                      width="100%"
                      height="100%"
                      pointerEvents={"none"}
                    />
                  )}
                  {leaderboard.length > 0 && (
                    <TableContainer
                      overflowY={leaderboardIsCollapsed ? "hidden" : "scroll"}
                      maxHeight={
                        leaderboardIsCollapsed
                          ? leaderboard.length === 0
                            ? "30px"
                            : "45px"
                          : "150px"
                      }
                      transition={"max-height 0.2s ease-in-out"}
                    >
                      <Table variant="unstyled" size="xs">
                        <Tbody>
                          {leaderboard.map((holder, index) => (
                            <Tr>
                              <Td fontSize={"20px"} p="4px" textAlign="center">
                                <Text fontSize="14px">{index + 1}</Text>
                              </Td>
                              <Td fontSize={"20px"} p="4px" textAlign="center">
                                <Text fontSize="14px">{holder.name}</Text>
                              </Td>
                              <Td
                                fontSize={"20px"}
                                p="4px"
                                textAlign="center"
                                isNumeric
                              >
                                <Text fontSize="14px">
                                  {truncateValue(holder.totalFees, 2)}
                                </Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                  {leaderboard.length === 0 && (
                    <Text fontSize="10px" textAlign={"center"}>
                      no one is on the leaderboard for this channel yet! 👀
                    </Text>
                  )}
                  {leaderboardLoading && (
                    <Flex justifyContent={"center"} p="20px">
                      <Spinner />
                    </Flex>
                  )}
                </Flex>
              </Flex>
              {selectedTab === "chat" && <Chat chat={chat} />}
              {selectedTab === "trade" && <Trade chat={chat} />}
              {selectedTab === "vip" && <Chat chat={chat} isVipChat />}
            </Flex>
          </OuterBorder>
        </Container>
      </OuterBorder>
    </Flex>
  );
};

export const Trade = ({ chat }: { chat: ChatReturnType }) => {
  const { userAddress, walletIsConnected, user } = useUser();
  const { channel, chat: chatContext } = useChannelContext();
  const { channelQueryData, refetch } = channel;
  const { addToChatbot } = chatContext;

  const { network } = useNetworkContext();
  const { matchingChain, localNetwork, explorerUrl } = network;

  const [isBuying, setIsBuying] = useState<boolean>(true);
  const [isYay, setIsYay] = useState<boolean>(true);
  const [amountOfVotes, setAmountOfVotes] = useState<string>("0");

  const amount_bigint = useMemo(
    () => BigInt(amountOfVotes as `${number}`),
    [amountOfVotes]
  );

  const { data: userEthBalance, refetch: refetchUserEthBalance } = useBalance({
    address: userAddress as `0x${string}`,
  });

  const toast = useToast();

  const handleInputChange = (event: any) => {
    const input = event.target.value;
    const filtered = filteredInput(input);
    setAmountOfVotes(filtered);
  };

  const { postBetTrade } = usePostBetTrade({
    onError: (err) => {
      console.log(err);
    },
  });

  const v2contract = getContractFromNetwork("unlonelySharesV2", localNetwork);

  const {
    refetch: refetchBalances,
    yayVotesBalance,
    nayVotesBalance,
  } = useGetHolderBalances(
    (channelQueryData?.sharesEvent?.[0]
      ?.sharesSubjectAddress as `0x${string}`) ?? NULL_ADDRESS,
    Number(channelQueryData?.sharesEvent?.[0]?.id ?? "0"),
    userAddress as `0x${string}`,
    isYay,
    v2contract
  );

  const { priceAfterFee: votePrice, refetch: refetchVotePrice } =
    useGetPriceAfterFee(
      channelQueryData?.owner?.address as `0x${string}`,
      Number(channelQueryData?.sharesEvent?.[0]?.id ?? "0"),
      BigInt(amountOfVotes),
      isYay,
      isBuying,
      v2contract
    );

  const { key: generatedKey } = useGenerateKey(
    channelQueryData?.owner?.address as `0x${string}`,
    Number(channelQueryData?.sharesEvent?.[0]?.id ?? "0"),
    v2contract
  );

  const {
    yayVotesSupply,
    nayVotesSupply,
    eventEndTimestamp,
    votingPooledEth,
    userPayout,
    eventVerified,
    eventResult,
    refetch: refetchMappings,
  } = useReadMappings(
    generatedKey,
    (channelQueryData?.sharesEvent?.[0]
      ?.sharesSubjectAddress as `0x${string}`) ?? NULL_ADDRESS,
    Number(channelQueryData?.sharesEvent?.[0]?.id ?? "0"),
    v2contract
  );

  const {
    buyVotes,
    refetch: refetchBuyVotes,
    isRefetchingBuyVotes,
  } = useBuyVotes(
    {
      eventAddress:
        (channelQueryData?.sharesEvent?.[0]
          ?.sharesSubjectAddress as `0x${string}`) ?? NULL_ADDRESS,
      eventId: Number(channelQueryData?.sharesEvent?.[0]?.id ?? "0"),
      isYay,
      amountOfVotes: amount_bigint,
      value: votePrice,
    },
    v2contract,
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
                buyVotes pending, click to view
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
              buyVotes cancelled
            </Box>
          ),
        });
      },
      onTxSuccess: async (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                buyVotes success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        setAmountOfVotes("0");
        const topics = decodeEventLog({
          abi: v2contract.abi,
          data: data.logs[0].data,
          topics: data.logs[0].topics,
        });
        const args: any = topics.args;
        const title = `${user?.username ?? centerEllipses(userAddress, 15)} ${
          args.trade.isBuy ? "bought" : "sold"
        } ${args.trade.shareAmount} ${args.trade.isYay ? "yes" : "no"} votes!`;
        addToChatbot({
          username: user?.username ?? "",
          address: userAddress ?? "",
          taskType: InteractionType.BUY_VOTES,
          title,
          description: `${user?.username ?? userAddress ?? ""}:${
            args.trade.shareAmount
          }:${args.trade.isYay ? "yay" : "nay"}`,
        });
        await postBetTrade({
          channelId: channelQueryData?.id as string,
          userAddress: userAddress as `0x${string}`,
          chainId: localNetwork.config.chainId,
          type: args.trade.isYay
            ? GamblableEvent.BetYesBuy
            : GamblableEvent.BetNoBuy,
          fees: Number(formatUnits(args.trade.subjectEthAmount, 18)),
        });
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              buyVotes error
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
    }
  );

  const {
    sellVotes,
    refetch: refetchSellVotes,
    isRefetchingSellVotes,
  } = useSellVotes(
    {
      eventAddress: channelQueryData?.sharesEvent?.[0]
        ?.sharesSubjectAddress as `0x${string}`,
      eventId: Number(channelQueryData?.sharesEvent?.[0]?.id ?? "0"),
      isYay,
      amountOfVotes: amount_bigint,
    },
    v2contract,
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
                sellVotes pending, click to view
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
              sellVotes cancelled
            </Box>
          ),
        });
      },
      onTxSuccess: async (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                sellVotes success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        setAmountOfVotes("0");
        const topics = decodeEventLog({
          abi: v2contract.abi,
          data: data.logs[0].data,
          topics: data.logs[0].topics,
        });
        const args: any = topics.args;
        const title = `${user?.username ?? centerEllipses(userAddress, 15)} ${
          args.trade.isBuy ? "bought" : "sold"
        } ${args.trade.shareAmount} ${args.trade.isYay ? "yes" : "no"} votes!`;
        addToChatbot({
          username: user?.username ?? "",
          address: userAddress ?? "",
          taskType: InteractionType.SELL_VOTES,
          title,
          description: `${user?.username ?? userAddress ?? ""}:${
            args.trade.shareAmount
          }:${args.trade.isYay ? "yay" : "nay"}`,
        });
        await postBetTrade({
          channelId: channelQueryData?.id as string,
          userAddress: userAddress as `0x${string}`,
          chainId: localNetwork.config.chainId,
          type: args.trade.isYay
            ? GamblableEvent.BetYesSell
            : GamblableEvent.BetNoSell,
          fees: Number(formatUnits(args.trade.subjectEthAmount, 18)),
        });
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              sellVotes error
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
    }
  );

  const { claimVotePayout, refetch: refetchClaimVotePayout } =
    useClaimVotePayout(
      {
        eventAddress: channelQueryData?.sharesEvent?.[0]
          ?.sharesSubjectAddress as `0x${string}`,
        eventId: Number(channelQueryData?.sharesEvent?.[0]?.id ?? "0"),
      },
      v2contract,
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
                  claimVotePayout pending, click to view
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
                claimVotePayout cancelled
              </Box>
            ),
          });
        },
        onTxSuccess: async (data) => {
          toast({
            render: () => (
              <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
                <Link
                  target="_blank"
                  href={`${explorerUrl}/tx/${data.transactionHash}`}
                  passHref
                >
                  claimVotePayout success, click to view
                </Link>
              </Box>
            ),
            duration: 9000,
            isClosable: true,
            position: "top-right",
          });
        },
        onTxError: (error) => {
          toast({
            render: () => (
              <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
                claimVotePayout error
              </Box>
            ),
            duration: 9000,
            isClosable: true,
            position: "top-right",
          });
        },
      }
    );

  const tradeMessages = useMemo(() => {
    const tradeMessages = chat.receivedMessages.filter(
      (m) =>
        m.data.body?.split(":")[0] === InteractionType.BUY_VOTES ||
        m.data.body?.split(":")[0] === InteractionType.SELL_VOTES
    );
    const tradeData = tradeMessages.map((m) => {
      const splitMessage = m.data.body?.split(":");
      return {
        taskType: splitMessage?.[0],
        trader: splitMessage?.[1],
        amount: splitMessage?.[2],
        isYay: splitMessage?.[3] === "yay",
      };
    });
    return tradeData;
  }, [chat.receivedMessages]);

  const blockNumber = useBlockNumber({
    watch: true,
  });

  const doesEventExist = useMemo(() => {
    if (!channelQueryData?.sharesEvent?.[0]?.sharesSubjectAddress) return false;
    if (!channelQueryData?.sharesEvent?.[0]?.id) return false;
    return true;
  }, [channelQueryData?.sharesEvent]);

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [dateNow, setDateNow] = useState<number>(Date.now());
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollRef = useRef<VirtuosoHandle>(null);
  const isFetching = useRef(false);

  const isEventOver = useMemo(() => {
    return (
      Number(eventEndTimestamp) * 1000 <= dateNow ||
      channelQueryData?.sharesEvent?.[0]?.eventState === SharesEventState.Payout
    );
  }, [
    eventEndTimestamp,
    dateNow,
    channelQueryData?.sharesEvent?.[0]?.eventState,
  ]);

  const eventEndTimestampPassed = useMemo(
    () => Number(eventEndTimestamp) * 1000 <= dateNow,
    [eventEndTimestamp, dateNow]
  );

  useEffect(() => {
    if (!blockNumber.data || isFetching.current) return;
    const fetch = async () => {
      isFetching.current = true;
      try {
        await Promise.all([
          refetchBalances(),
          refetchVotePrice(),
          refetchBuyVotes(),
          refetchSellVotes(),
          refetchMappings(),
          refetchClaimVotePayout(),
          refetchUserEthBalance(),
        ]);
      } catch (err) {
        console.log("vote fetching error", err);
      }
      setDateNow(Date.now());
      isFetching.current = false;
    };
    fetch();
  }, [blockNumber.data]);

  useEffect(() => {
    const fetch = async () => {
      if (chat.receivedMessages.length > 0) {
        const latestMessage =
          chat.receivedMessages[chat.receivedMessages.length - 1];
        if (
          latestMessage.data.body &&
          (latestMessage.data.body.split(":")[0] ===
            InteractionType.EVENT_LIVE ||
            latestMessage.data.body.split(":")[0] ===
              InteractionType.EVENT_LOCK ||
            latestMessage.data.body.split(":")[0] ===
              InteractionType.EVENT_PAYOUT ||
            latestMessage.data.body.split(":")[0] ===
              InteractionType.EVENT_END) &&
          Date.now() - latestMessage.timestamp < 12000
        ) {
          await refetch();
        }
      }
    };
    fetch();
  }, [chat.receivedMessages]);

  useEffect(() => {
    if (!walletIsConnected) {
      setErrorMessage("connect wallet first");
    } else if (!matchingChain) {
      setErrorMessage("wrong network");
    } else if (
      !isBuying &&
      ((isYay && Number(yayVotesBalance) < Number(amountOfVotes)) ||
        (!isYay && Number(nayVotesBalance) < Number(amountOfVotes))) &&
      doesEventExist &&
      !isEventOver
    ) {
      setErrorMessage("insufficient votes to sell");
    } else if (
      isBuying &&
      userEthBalance?.value &&
      votePrice > userEthBalance?.value &&
      doesEventExist &&
      !isEventOver
    ) {
      setErrorMessage("insufficient ETH to spend");
    } else if (
      isBuying &&
      Number(amountOfVotes) === 0 &&
      doesEventExist &&
      !isEventOver
    ) {
      setErrorMessage("enter amount first");
    } else {
      setErrorMessage("");
    }
  }, [
    walletIsConnected,
    matchingChain,
    userEthBalance,
    isBuying,
    votePrice,
    yayVotesBalance,
    nayVotesBalance,
    amountOfVotes,
    dateNow,
    eventEndTimestamp,
    doesEventExist,
    isEventOver,
  ]);

  const getColor = (taskType: InteractionType, isYay: boolean) => {
    if (taskType === InteractionType.BUY_VOTES && !isYay) return "#ff321f";
    if (taskType === InteractionType.SELL_VOTES && isYay) return "#fe6715";
    if (taskType === InteractionType.SELL_VOTES && !isYay) return "#bbd400";
    return "#14de02";
  };

  const handleIsAtBottom = useCallback((value: boolean) => {
    setIsAtBottom(value);
  }, []);

  const handleScrollToPresent = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToIndex(tradeMessages.length - 1);
    }
  }, [tradeMessages.length]);

  useEffect(() => {
    const scrollable = document.getElementById("scrollable");
    if (!scrollable) return;
    if (isAtBottom) handleScrollToPresent();
  }, [isAtBottom]);

  return (
    <>
      {doesEventExist && (
        <>
          <Text textAlign={"center"} fontSize={"20px"} fontWeight={"bold"}>
            {channelQueryData?.sharesEvent?.[0]?.sharesSubjectQuestion}
          </Text>
          <Text textAlign={"center"} fontSize="14px" color="#f8f53b">
            {truncateValue(formatUnits(votingPooledEth, 18), 4)} ETH in the pool
          </Text>
        </>
      )}
      {errorMessage && (
        <Text textAlign={"center"} color="red.400">
          {errorMessage}
        </Text>
      )}
      {!doesEventExist ? (
        <Text textAlign={"center"}>there is no event at the moment</Text>
      ) : isEventOver ? (
        <Text textAlign={"center"}>event is over</Text>
      ) : null}
      {doesEventExist &&
        !eventEndTimestampPassed &&
        channelQueryData?.sharesEvent?.[0]?.eventState === "LIVE" && (
          <>
            <Flex justifyContent={"space-around"} gap="5px">
              <Flex gap="5px">
                <Button
                  bg={isYay ? "#46a800" : "transparent"}
                  border={!isYay ? "1px solid #46a800" : undefined}
                  _focus={{}}
                  _hover={{}}
                  _active={{}}
                  onClick={() => setIsYay(true)}
                >
                  <Flex alignItems={"center"} gap="2px">
                    <Text>YES</Text>
                    {/* {truncateValue(String(yayVotesSupply), 0, true)} */}
                  </Flex>
                </Button>
                <Button
                  bg={!isYay ? "#fe2815" : "transparent"}
                  border={isYay ? "1px solid #fe2815" : undefined}
                  _focus={{}}
                  _hover={{}}
                  _active={{}}
                  onClick={() => setIsYay(false)}
                >
                  <Flex alignItems={"center"} gap="2px">
                    <Text>NO</Text>
                    {/* {truncateValue(String(nayVotesSupply), 0, true)} */}
                  </Flex>
                </Button>
              </Flex>
              <Flex bg={"#131323"} borderRadius="15px">
                <Button
                  bg={isBuying ? "#46a800" : "transparent"}
                  border={!isBuying ? "1px solid #46a800" : undefined}
                  _focus={{}}
                  _hover={{}}
                  _active={{}}
                  onClick={() => setIsBuying(true)}
                >
                  BUY
                </Button>
                <Button
                  bg={!isBuying ? "#fe2815" : "transparent"}
                  border={isBuying ? "1px solid #fe2815" : undefined}
                  _focus={{}}
                  _hover={{}}
                  _active={{}}
                  onClick={() => setIsBuying(false)}
                >
                  SELL
                </Button>
              </Flex>
            </Flex>
            <Flex direction="column" borderRadius="15px" p="1rem">
              <Flex justifyContent={"space-between"} mb="5px">
                <Flex direction="column">
                  <Text fontSize="10px" textAlign="center">
                    #
                  </Text>
                  <Flex alignItems={"center"}>
                    <Input
                      textAlign="center"
                      width={"70px"}
                      value={amountOfVotes}
                      onChange={handleInputChange}
                    />
                  </Flex>
                </Flex>
                <Flex direction="column">
                  <Text fontSize="10px" textAlign="center">
                    ETH {isBuying ? "price" : "return"}
                  </Text>
                  <Text whiteSpace={"nowrap"} margin="auto">
                    {truncateValue(formatUnits(votePrice, 18), 4)}
                  </Text>
                </Flex>
                <Flex direction="column">
                  <Text fontSize="10px" textAlign="center">
                    own
                  </Text>
                  <Text whiteSpace={"nowrap"} margin="auto">
                    {isYay ? yayVotesBalance : nayVotesBalance}
                  </Text>
                </Flex>
              </Flex>
              <Text>
                Time to close:{" "}
                {getTimeFromMillis(Number(eventEndTimestamp) * 1000 - dateNow)}
              </Text>
              {errorMessage && (
                <Text textAlign={"center"} color="red.400">
                  {errorMessage}
                </Text>
              )}
              <Button
                bg={
                  isBuying && isYay
                    ? "#46a800"
                    : isBuying && !isYay
                    ? "#fe2815"
                    : !isBuying && !isYay
                    ? "#46a800"
                    : "#fe2815"
                }
                _focus={{}}
                _hover={{}}
                _active={{}}
                onClick={() => (isBuying ? buyVotes?.() : sellVotes?.())}
                disabled={
                  (isBuying && !buyVotes) ||
                  (!isBuying && !sellVotes) ||
                  isRefetchingBuyVotes ||
                  isRefetchingSellVotes
                }
              >
                {isRefetchingBuyVotes || isRefetchingSellVotes ? (
                  <Spinner />
                ) : isBuying ? (
                  "BUY"
                ) : (
                  "SELL"
                )}
              </Button>
            </Flex>
          </>
        )}
      {doesEventExist &&
        eventEndTimestampPassed &&
        channelQueryData?.sharesEvent?.[0]?.eventState === "LIVE" && (
          <>
            <Flex justifyContent={"space-evenly"} my="10px">
              <Text color="#35b657" fontWeight="bold" fontSize="25px">
                {truncateValue(String(yayVotesSupply), 0, true)} YES
              </Text>
              <Text color="#ff623b" fontWeight="bold" fontSize="25px">
                {truncateValue(String(nayVotesSupply), 0, true)} NO
              </Text>
            </Flex>
            <Text textAlign={"center"} fontSize="14px">
              The time for voting has ended
            </Text>
          </>
        )}
      {doesEventExist &&
        channelQueryData?.sharesEvent?.[0]?.eventState === "LOCK" && (
          <>
            <Flex justifyContent={"space-evenly"} my="10px">
              <Text color="#35b657" fontWeight="bold" fontSize="25px">
                {truncateValue(String(yayVotesSupply), 0, true)} YES
              </Text>
              <Text color="#ff623b" fontWeight="bold" fontSize="25px">
                {truncateValue(String(nayVotesSupply), 0, true)} NO
              </Text>
            </Flex>
            <Text textAlign={"center"} fontSize="14px" color="#e49c16">
              voting disabled
            </Text>
          </>
        )}
      {doesEventExist &&
        channelQueryData?.sharesEvent?.[0]?.eventState === "PAYOUT" &&
        eventVerified && (
          <>
            <Flex justifyContent="space-between">
              <Text fontSize="18px">event outcome</Text>
              <Text
                fontSize="18px"
                fontWeight="bold"
                color={eventResult === true ? "#02f042" : "#ee6204"}
              >
                {eventResult ? "Yes" : "No"}
              </Text>
            </Flex>
            <Flex justifyContent="space-between">
              <Text fontSize="18px">your winnings</Text>
              <Text fontSize="18px">
                {truncateValue(formatUnits(userPayout, 18))} ETH
              </Text>
            </Flex>
            {userPayout > BigInt(0) && (
              <Button
                _hover={{}}
                _focus={{}}
                _active={{}}
                bg={"#E09025"}
                borderRadius="25px"
                isDisabled={!claimVotePayout}
                onClick={claimVotePayout}
              >
                <Text fontSize="20px">get payout</Text>
              </Button>
            )}
          </>
        )}
      {doesEventExist && (
        <Flex
          direction="column"
          overflowX="auto"
          height="100%"
          width="100%"
          mt="8px"
          position="relative"
        >
          <Flex
            direction="column"
            overflowX="auto"
            height="100%"
            id={"scrollable"}
            position="relative"
            mt="8px"
          >
            <Virtuoso
              ref={scrollRef}
              followOutput={"auto"}
              style={{
                height: "100%",
                overflowY: "scroll",
              }}
              className="hide-scrollbar"
              data={tradeMessages}
              atBottomStateChange={(isAtBottom) => handleIsAtBottom(isAtBottom)}
              initialTopMostItemIndex={tradeMessages.length - 1}
              itemContent={(index, data) => {
                const color = getColor(
                  data.taskType as InteractionType.BUY_VOTES,
                  data.isYay as boolean
                );
                return (
                  <Flex justifyContent={"space-between"} px="4px">
                    <Text>{data.trader}</Text>
                    <Text
                      color={color}
                      fontStyle={
                        (data.taskType === InteractionType.BUY_VOTES &&
                          !data.isYay) ||
                        (data.taskType === InteractionType.SELL_VOTES &&
                          data.isYay)
                          ? "italic"
                          : "unset"
                      }
                    >
                      {data.taskType === InteractionType.BUY_VOTES
                        ? "bought"
                        : "sold"}{" "}
                      {data.amount} {data.isYay ? "YES" : "NO"}
                    </Text>
                  </Flex>
                );
              }}
            />
          </Flex>
          <Flex justifyContent="center">
            {!isAtBottom && tradeMessages.length > 0 && (
              <Box
                bg="rgba(98, 98, 98, 0.6)"
                p="4px"
                borderRadius="4px"
                _hover={{
                  background: "rgba(98, 98, 98, 0.3)",
                  cursor: "pointer",
                }}
                onClick={handleScrollToPresent}
              >
                <Text fontSize="12px" textAlign={"center"}>
                  scroll to present
                </Text>
              </Box>
            )}
          </Flex>
        </Flex>
      )}
    </>
  );
};

const Chat = ({
  chat,
  isVipChat,
}: {
  chat: ChatReturnType;
  isVipChat?: boolean;
}) => {
  const { channel, leaderboard } = useChannelContext();
  const { channelQueryData } = channel;
  const { isVip } = leaderboard;
  const { user } = useUser();

  const userIsChannelOwner = useMemo(
    () => user?.address === channelQueryData?.owner.address,
    [user, channelQueryData]
  );

  const userIsModerator = useMemo(
    () =>
      channelQueryData?.roles?.some(
        (m) => m?.userAddress === user?.address && m?.role === 2
      ),
    [user, channelQueryData]
  );

  const {
    scrollRef,
    isAtBottom,
    channelChatCommands,
    handleScrollToPresent,
    handleIsAtBottom,
    sendChatMessage,
  } = useChatBox(
    isVipChat ? "vip-chat" : "chat",
    chat.receivedMessages,
    chat.hasMessagesLoaded,
    chat.channel
  );

  const [emojisToAnimate, setEmojisToAnimate] = useState<
    { emoji: string; id: number }[]
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.offsetHeight);
    }
  }, [containerRef]);

  const handleAnimateReactionEmoji = (str: string) => {
    const id = Date.now();
    setEmojisToAnimate((prev) => [...prev, { emoji: str, id }]);

    // Remove the emoji from the state after the animation duration
    setTimeout(() => {
      setEmojisToAnimate((prev) => prev.filter((emoji) => emoji.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (!chat.allMessages || chat.allMessages.length === 0) return;
    const latestMessage = chat.allMessages[chat.allMessages.length - 1];
    if (
      Date.now() - latestMessage.timestamp < 2000 &&
      latestMessage.name === ADD_REACTION_EVENT &&
      latestMessage.data.body
    )
      handleAnimateReactionEmoji(latestMessage.data.body);
  }, [chat.allMessages]);

  return (
    <Flex
      mt="10px"
      direction="column"
      minW="100%"
      width="100%"
      h="100%"
      position={"relative"}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          pointerEvents: "none",
        }}
        ref={containerRef}
      >
        {emojisToAnimate.map(({ emoji, id }) => (
          <span
            key={id}
            className="floatingEmoji"
            style={
              {
                "--translateY": `${containerHeight - 120}px`,
              } as CSSProperties & { "--translateY": string }
            }
          >
            {emoji}
          </span>
        ))}
      </div>
      {!isVip && !userIsChannelOwner && !userIsModerator && isVipChat && (
        <Text textAlign={"center"}>
          You must have at least one VIP badge to use this chat.
        </Text>
      )}
      <Flex
        direction="column"
        overflowX="auto"
        height="100%"
        id={isVipChat ? "vip-chat" : "chat"}
        position="relative"
        mt="8px"
      >
        {!isVip && !userIsChannelOwner && !userIsModerator && isVipChat && (
          <Flex
            position="absolute"
            style={{ backdropFilter: "blur(6px)" }}
            left={"0"}
            right={"0"}
            top={"0"}
            bottom={"0"}
            zIndex={"1"}
          />
        )}
        <MessageList
          scrollRef={scrollRef}
          messages={chat.receivedMessages}
          channel={chat.channel}
          isAtBottomCallback={handleIsAtBottom}
          isVipChat={isVipChat}
        />
      </Flex>
      <Flex justifyContent="center">
        {!isAtBottom && chat.hasMessagesLoaded && (
          <Box
            bg="rgba(98, 98, 98, 0.6)"
            p="4px"
            borderRadius="4px"
            _hover={{
              background: "rgba(98, 98, 98, 0.3)",
              cursor: "pointer",
            }}
            onClick={handleScrollToPresent}
          >
            <Text fontSize="12px">
              scrolling paused. click to scroll to bottom.
            </Text>
          </Box>
        )}
      </Flex>
      {(userIsChannelOwner || userIsModerator || isVip || !isVipChat) && (
        <Flex w="100%">
          <ChatForm
            sendChatMessage={sendChatMessage}
            additionalChatCommands={channelChatCommands}
            allowPopout
            channel={chat.channel}
            isVipChat={isVipChat}
          />
        </Flex>
      )}
    </Flex>
  );
};

export default ChatComponent;
