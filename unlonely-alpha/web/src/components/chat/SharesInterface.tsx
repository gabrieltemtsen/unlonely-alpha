import {
  Box,
  Flex,
  IconButton,
  Button,
  Input,
  Text,
  Image,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GoPin } from "react-icons/go";
import Link from "next/link";
import { decodeEventLog, formatUnits } from "viem";
import { useBalance, useBlockNumber } from "wagmi";

import { useChannelContext } from "../../hooks/context/useChannel";
import { useUser } from "../../hooks/context/useUser";
import {
  useBuyShares,
  useClaimPayout,
  useGetHolderSharesBalances,
  useGetPrice,
  useGetPriceAfterFee,
  useReadPublic,
  useReadSharesSubject,
  useSellShares,
} from "../../hooks/contracts/useSharesContract";
import { filteredInput } from "../../utils/validation/input";
import { getContractFromNetwork } from "../../utils/contract";
import { truncateValue } from "../../utils/tokenDisplayFormatting";
import { InteractionType, NULL_ADDRESS } from "../../constants";
import centerEllipses from "../../utils/centerEllipses";
import { Message } from "../../constants/types/chat";
import { useNetworkContext } from "../../hooks/context/useNetwork";

export const SharesInterface = ({ messages }: { messages: Message[] }) => {
  const { channel } = useChannelContext();
  const { channelQueryData, refetch } = channel;
  const [showUi, setShowUi] = useState<boolean>(true);

  const handleShowUi = useCallback((value: boolean) => {
    setShowUi(value);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      if (messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        if (
          latestMessage.data.body &&
          (latestMessage.data.body.split(":")[0] ===
            InteractionType.EVENT_LIVE ||
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
  }, [messages]);

  return (
    <>
      {channelQueryData?.sharesEvent &&
        channelQueryData?.sharesEvent.length > 0 &&
        !showUi && (
          <Flex
            onClick={() => setShowUi(true)}
            mt="10px"
            bg="#c220c2"
            p="5px"
            borderRadius={"10px"}
            gap="5px"
            cursor={"pointer"}
            _hover={{ bg: "#d22fd2", transform: "scale(1.03)" }}
          >
            <GoPin />
            <Text noOfLines={1} fontSize="12px">
              {channelQueryData?.sharesEvent?.[0]?.sharesSubjectQuestion}
            </Text>
          </Flex>
        )}
      {channelQueryData?.sharesEvent &&
        channelQueryData?.sharesEvent.length > 0 &&
        showUi && <SharesUi showUi={showUi} handleShowUi={handleShowUi} />}
    </>
  );
};

const SharesUi = ({
  showUi,
  handleShowUi,
}: {
  showUi: boolean;
  handleShowUi: (value: boolean) => void;
}) => {
  const { userAddress, user, walletIsConnected } = useUser();
  const { channel, arcade } = useChannelContext();
  const { addToChatbot } = arcade;
  const { channelQueryData } = channel;
  const toast = useToast();
  const { network } = useNetworkContext();
  const { matchingChain, localNetwork, explorerUrl } = network;
  const sharesSubject = channelQueryData?.sharesEvent?.[0]
    ?.sharesSubjectAddress as `0x${string}`;

  const [selectedSharesOption, setSelectedSharesOption] = useState<
    string | undefined
  >(undefined);
  const [isBuying, setIsBuying] = useState<boolean>(true);
  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const isYay = selectedSharesOption === "yes";

  const { data: userEthBalance, refetch: refetchUserEthBalance } = useBalance({
    address: userAddress as `0x${string}`,
  });

  const amount_bigint = useMemo(
    () => BigInt(filteredInput(amount) as `${number}`),
    [amount]
  );
  const contract = getContractFromNetwork("unlonelySharesV1", localNetwork);

  const blockNumber = useBlockNumber({
    watch: true,
  });

  const {
    protocolFeeDestination,
    protocolFeePercent,
    subjectFeePercent,
    refetch: refetchPublic,
  } = useReadPublic(contract);

  const { price: yayBuyPriceForOne, refetch: refetchYayBuyPriceForOne } =
    useGetPrice(sharesSubject, BigInt(1), true, true, contract);

  const { price: nayBuyPriceForOne, refetch: refetchNayBuyPriceForOne } =
    useGetPrice(sharesSubject, BigInt(1), false, true, contract);

  const {
    priceAfterFee: yayBuyPriceAfterFee,
    refetch: refetchYayBuyPriceAfterFee,
  } = useGetPriceAfterFee(sharesSubject, amount_bigint, true, true, contract);

  const {
    priceAfterFee: yaySellPriceAfterFee,
    refetch: refetchYaySellPriceAfterFee,
  } = useGetPriceAfterFee(sharesSubject, amount_bigint, true, false, contract);

  const {
    priceAfterFee: nayBuyPriceAfterFee,
    refetch: refetchNayBuyPriceAfterFee,
  } = useGetPriceAfterFee(sharesSubject, amount_bigint, false, true, contract);

  const {
    priceAfterFee: naySellPriceAfterFee,
    refetch: refetchNaySellPriceAfterFee,
  } = useGetPriceAfterFee(sharesSubject, amount_bigint, false, false, contract);

  const {
    yaySharesBalance,
    naySharesBalance,
    refetch: refetchBalances,
  } = useGetHolderSharesBalances(
    sharesSubject,
    userAddress as `0x${string}`,
    contract
  );

  const {
    yaySharesSupply,
    naySharesSupply,
    eventVerified,
    eventResult,
    pooledEth,
    userPayout,
    refetch: refetchSharesSubject,
  } = useReadSharesSubject(sharesSubject, contract);

  const {
    claimPayout,
    claimPayoutTxLoading,
    refetch: refetchClaimPayout,
  } = useClaimPayout(
    {
      sharesSubject: sharesSubject,
    },
    contract,
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
                claimPayout pending, click to view
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
              claimPayout cancelled
            </Box>
          ),
        });
      },
      onTxSuccess: (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                claimPayout success, click to view
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
              claimPayout error
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
    buyShares,
    buySharesTxLoading,
    refetch: refetchBuyShares,
  } = useBuyShares(
    {
      sharesSubject: sharesSubject,
      amountOfShares: amount_bigint,
      value: isYay ? yayBuyPriceAfterFee : nayBuyPriceAfterFee,
      isYay: isYay,
    },
    contract,
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
                buyShares pending, click to view
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
              buyShares cancelled
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
                buyShares success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        setAmount("");
        const topics = decodeEventLog({
          abi: contract.abi,
          data: data.logs[0].data,
          topics: data.logs[0].topics,
        });
        const args: any = topics.args;
        const title = `${user?.username ?? centerEllipses(userAddress, 15)} ${
          args.isBuy ? "bought" : "sold"
        } ${args.shareAmount} ${args.isYay ? "yes" : "no"} votes!`;
        addToChatbot({
          username: user?.username ?? "",
          address: userAddress ?? "",
          taskType: InteractionType.BUY_SHARES,
          title,
          description: `${args.shareAmount}:${args.isYay ? "yay" : "nay"}`,
        });
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              buyShares error
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
    sellShares,
    sellSharesTxLoading,
    refetch: refetchSellShares,
  } = useSellShares(
    {
      sharesSubject: sharesSubject,
      amount: amount_bigint,
      isYay: isYay,
    },
    contract,
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
                sellShares pending, click to view
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
              sellShares cancelled
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
                sellShares success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        setAmount("");
        const topics = decodeEventLog({
          abi: contract.abi,
          data: data.logs[0].data,
          topics: data.logs[0].topics,
        });
        const args: any = topics.args;
        const title = `${user?.username ?? centerEllipses(userAddress, 15)} ${
          args.isBuy ? "bought" : "sold"
        } ${args.shareAmount} ${args.isYay ? "yes" : "no"} votes!`;
        addToChatbot({
          username: user?.username ?? "",
          address: userAddress ?? "",
          taskType: InteractionType.SELL_SHARES,
          title,
          description: `${args.shareAmount}:${args.isYay ? "yay" : "nay"}`,
        });
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              sellShares error
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
    if (!blockNumber.data) return;
    const fetch = async () => {
      await Promise.all([
        refetchUserEthBalance(),
        refetchPublic(),
        refetchYayBuyPriceForOne(),
        refetchNayBuyPriceForOne(),
        refetchYayBuyPriceAfterFee(),
        refetchYaySellPriceAfterFee(),
        refetchNayBuyPriceAfterFee(),
        refetchNaySellPriceAfterFee(),
        refetchSharesSubject(),
        refetchBalances(),
        refetchClaimPayout(),
        refetchBuyShares(),
        refetchSellShares(),
      ]);
    };
    fetch();
  }, [blockNumber.data]);

  const handleInputChange = (event: any) => {
    const input = event.target.value;
    const filtered = filteredInput(input);
    setAmount(filtered);
  };

  useEffect(() => {
    if (!walletIsConnected) {
      setErrorMessage("connect wallet first");
    } else if (!matchingChain) {
      setErrorMessage("wrong network");
    } else if (
      userEthBalance?.value &&
      (isYay ? yayBuyPriceAfterFee : nayBuyPriceAfterFee) >
        userEthBalance?.value
    ) {
      setErrorMessage("you don't have enough ETH to spend");
    } else {
      setErrorMessage("");
    }
  }, [
    walletIsConnected,
    matchingChain,
    userEthBalance,
    isYay,
    yayBuyPriceAfterFee,
    nayBuyPriceAfterFee,
  ]);

  return (
    <Box
      mt="10px"
      transition="all 0.5s ease"
      bg={"#1b183f"}
      borderRadius={"10px"}
      border="1px solid #ffffff"
      boxShadow={"0px 0px 10px #ffffff"}
      position="relative"
    >
      <Flex direction="column">
        <Flex justifyContent="center">
          <Text
            textAlign={"center"}
            width="90%"
            fontSize={"20px"}
            fontWeight={"bold"}
          >
            {channelQueryData?.sharesEvent?.[0]?.sharesSubjectQuestion}
          </Text>
        </Flex>
        {(selectedSharesOption !== undefined || showUi) && (
          <IconButton
            aria-label="close"
            _hover={{}}
            _active={{}}
            _focus={{}}
            bg="transparent"
            icon={<Image alt="close" src="/svg/close.svg" width="15px" />}
            onClick={() =>
              selectedSharesOption !== undefined
                ? setSelectedSharesOption(undefined)
                : handleShowUi(false)
            }
            position="absolute"
            right="-5px"
            top="-5px"
          />
        )}
        {protocolFeeDestination === NULL_ADDRESS ? (
          <>
            <Text textAlign={"center"} color="#d5d5d5" fontSize="15px">
              contract not ready yet
            </Text>
          </>
        ) : eventVerified ? (
          <Flex direction="column" p="0.5rem">
            {!claimPayoutTxLoading ? (
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
                    {truncateValue(formatUnits(userPayout, 18))}
                  </Text>
                </Flex>
                {userPayout > BigInt(0) && (
                  <Button
                    _hover={{}}
                    _focus={{}}
                    _active={{}}
                    bg={"#E09025"}
                    borderRadius="25px"
                    isDisabled={!claimPayout}
                    onClick={claimPayout}
                  >
                    <Text fontSize="20px">get payout</Text>
                  </Button>
                )}
              </>
            ) : (
              <Flex justifyContent="center">
                <Spinner />
              </Flex>
            )}
          </Flex>
        ) : (
          <>
            <Text textAlign={"center"} fontSize="14px" color="#f8f53b">
              {truncateValue(formatUnits(pooledEth, 18), 4)} ETH in the pool
            </Text>
            <Flex justifyContent={"center"} gap={"10px"} my="10px">
              <Text color="#35b657" fontWeight="bold" fontSize="25px">
                {truncateValue(String(yaySharesSupply), 0, true)}
              </Text>
              <Button
                _hover={{}}
                _focus={{}}
                _active={{}}
                transform={
                  selectedSharesOption === "no" ? "scale(0.95)" : undefined
                }
                opacity={selectedSharesOption === "no" ? 0.9 : 1}
                bg={selectedSharesOption === "no" ? "#909090" : "#009d2a"}
                onClick={() => setSelectedSharesOption("yes")}
              >
                <Flex direction="column">
                  <Text
                    fontFamily="Neue Pixel Sans"
                    fontWeight={"light"}
                    fontSize="15px"
                  >
                    YES
                  </Text>
                  <Text fontWeight={"light"} fontSize="12px">
                    {truncateValue(
                      formatUnits(yayBuyPriceForOne ?? BigInt(0), 18)
                    )}
                  </Text>
                </Flex>
              </Button>
              <Button
                _hover={{}}
                _focus={{}}
                _active={{}}
                transform={isYay ? "scale(0.95)" : undefined}
                opacity={isYay ? 0.9 : 1}
                bg={isYay ? "#909090" : "#da3b14"}
                onClick={() => setSelectedSharesOption("no")}
              >
                <Flex direction="column">
                  <Text
                    fontFamily="Neue Pixel Sans"
                    fontWeight={"light"}
                    fontSize="15px"
                  >
                    NO
                  </Text>
                  <Text fontWeight={"light"} fontSize="12px">
                    {truncateValue(
                      formatUnits(nayBuyPriceForOne ?? BigInt(0), 18)
                    )}
                  </Text>
                </Flex>
              </Button>
              <Text color="#ff623b" fontWeight="bold" fontSize="25px">
                {truncateValue(String(naySharesSupply), 0, true)}
              </Text>
            </Flex>
          </>
        )}
        {selectedSharesOption === undefined || eventVerified ? null : (
          <Flex direction="column" bg={"rgba(0, 0, 0, 0.258)"} p="0.5rem">
            {!buySharesTxLoading && !sellSharesTxLoading ? (
              <>
                <Flex justifyContent={"space-between"}>
                  <Text fontWeight="light" opacity="0.75">
                    enter amount of votes
                  </Text>
                  <Text fontWeight="light">
                    own: {isYay ? yaySharesBalance : naySharesBalance}
                  </Text>
                </Flex>
                <Flex>
                  <Button
                    width="60%"
                    borderTopRightRadius={"0"}
                    borderBottomRightRadius={"0"}
                    bg={isBuying ? "#009d2a" : "#da3b14"}
                    onClick={() => {
                      isBuying ? setIsBuying(false) : setIsBuying(true);
                    }}
                    _hover={{ bg: isBuying ? "#00ba32" : "#ff4e22" }}
                    _focus={{}}
                    _active={{}}
                  >
                    <Text>{isBuying ? "buy" : "sell"}</Text>
                  </Button>
                  <Input
                    borderTopLeftRadius={"0"}
                    borderBottomLeftRadius={"0"}
                    borderTopRightRadius={isBuying ? "10px" : "0"}
                    borderBottomRightRadius={isBuying ? "10px" : "0"}
                    variant="glow"
                    boxShadow={"unset"}
                    placeholder={"0"}
                    value={amount}
                    onChange={handleInputChange}
                  />
                  {!isBuying && (
                    <Button
                      _hover={{ bg: "rgba(54, 170, 212, 0.2)" }}
                      _focus={{}}
                      _active={{}}
                      borderTopLeftRadius={"0"}
                      borderBottomLeftRadius={"0"}
                      bg="transparent"
                      border="1px solid #3097bd"
                      boxShadow={"inset 0px 0px 5px #2f92b6"}
                      onClick={() => {
                        if (isBuying) return;
                        if (isYay) {
                          setAmount(String(yaySharesBalance));
                        } else {
                          setAmount(String(naySharesBalance));
                        }
                      }}
                    >
                      <Text fontWeight="light">MAX</Text>
                    </Button>
                  )}
                </Flex>
                <Flex justifyContent={"space-between"}>
                  <Text opacity="0.75" fontWeight="light">
                    {isBuying
                      ? `price + ${formatUnits(
                          subjectFeePercent + protocolFeePercent,
                          16
                        )}% fees`
                      : `return - ${formatUnits(
                          subjectFeePercent + protocolFeePercent,
                          16
                        )}% fees`}
                  </Text>
                  {isBuying && isYay && (
                    <Text fontWeight="light">
                      {formatUnits(yayBuyPriceAfterFee, 18)} ETH
                    </Text>
                  )}
                  {isBuying && !isYay && (
                    <Text fontWeight="light">
                      {formatUnits(nayBuyPriceAfterFee, 18)} ETH
                    </Text>
                  )}
                  {!isBuying && isYay && (
                    <Text fontWeight="light">
                      {formatUnits(yaySellPriceAfterFee, 18)} ETH
                    </Text>
                  )}
                  {!isBuying && !isYay && (
                    <Text fontWeight="light">
                      {formatUnits(naySellPriceAfterFee, 18)} ETH
                    </Text>
                  )}
                </Flex>
                {errorMessage && (
                  <Text textAlign={"center"} color="red.400">
                    {errorMessage}
                  </Text>
                )}
                {amount_bigint > 0 && (
                  <Button
                    _hover={{}}
                    _focus={{}}
                    _active={{}}
                    bg={"#E09025"}
                    borderRadius="25px"
                    onClick={isBuying ? buyShares : sellShares}
                    isDisabled={
                      (isBuying && !buyShares) || (!isBuying && !sellShares)
                    }
                  >
                    <Text fontSize="20px">
                      confirm {isBuying ? "buy" : "sell"}
                    </Text>
                  </Button>
                )}
              </>
            ) : (
              <Flex justifyContent="center">
                <Spinner />
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
};