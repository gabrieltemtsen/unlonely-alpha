import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Image,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import { useAccount, useEnsName } from "wagmi";
import BuyButton from "../../components/arcade/BuyButton";
import CoinButton from "../../components/arcade/CoinButton";
import ControlButton from "../../components/arcade/ControlButton";
import DiceButton from "../../components/arcade/DiceButton";
import SwordButton from "../../components/arcade/SwordButton";
import ChannelDesc from "../../components/channels/ChannelDesc";
import AblyChatComponent from "../../components/chat/ChatComponent";
import AppLayout from "../../components/layout/AppLayout";
import NextStreamTimer from "../../components/stream/NextStreamTimer";
import BuyTransactionModal from "../../components/transactions/BuyTransactionModal";
import ChanceTransactionModal from "../../components/transactions/ChanceTransactionModal";
import ControlTransactionModal from "../../components/transactions/ControlTransactionModal";
import PvpTransactionModal from "../../components/transactions/PvpTransactionModal";
import TipTransactionModal from "../../components/transactions/TipTransactionModal";
import { ChatBot } from "../../constants/types";
import {
  ChannelProvider,
  useChannelContext,
} from "../../hooks/context/useChannel";
import { useUser } from "../../hooks/context/useUser";
import { useWindowSize } from "../../hooks/internal/useWindowSize";
import centerEllipses from "../../utils/centerEllipses";

const ChannelDetail = () => {
  return (
    <ChannelProvider>
      <ChannelPage />
    </ChannelProvider>
  );
};

const ChannelPage = () => {
  const { channel, recentStreamInteractions, chat } = useChannelContext();
  const {
    channelBySlug,
    loading: channelDataLoading,
    error: channelDataError,
  } = channel;
  const {
    loading: recentStreamInteractionsLoading,
    textOverVideo,
    socket,
  } = recentStreamInteractions;
  const { chatChannel, presenceChannel } = chat;

  const queryLoading = useMemo(
    () => channelDataLoading || recentStreamInteractionsLoading,
    [channelDataLoading, recentStreamInteractionsLoading]
  );

  const [width, height] = useWindowSize();
  const { user } = useUser();

  const [chatBot, setChatBot] = useState<ChatBot[]>([]);
  const [username, setUsername] = useState<string | null>();
  const [showTipModal, setShowTipModal] = useState<boolean>(false);
  const [showChanceModal, setShowChanceModal] = useState<boolean>(false);
  const [showPvpModal, setShowPvpModal] = useState<boolean>(false);
  const [showControlModal, setShowControlModal] = useState<boolean>(false);
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);

  const accountData = useAccount();

  //used on mobile view
  const [hideChat, setHideChat] = useState<boolean>(false);

  const showArcadeButtons = useBreakpointValue({ md: false, lg: true });

  const handleSendMessage = (message: string) => {
    if (!socket) return;
    socket.emit("send-message", {
      message,
      username: accountData?.address,
    });
  };

  const { data: ensData } = useEnsName({
    address: accountData?.address,
  });

  useEffect(() => {
    const fetchEns = async () => {
      if (accountData?.address) {
        const username = ensData ?? centerEllipses(accountData.address, 9);
        setUsername(username);
      }
    };

    fetchEns();
  }, [accountData?.address, ensData]);

  const isHidden = useCallback(
    (isChat: boolean) => {
      //checks if width is <= 48 em (base size) if so checks switch tab is disabled
      return width <= 768 && (isChat ? hideChat : !hideChat);
    },
    [width, hideChat]
  );

  const handleClose = useCallback(() => {
    setShowTipModal(false);
    setShowChanceModal(false);
    setShowPvpModal(false);
    setShowControlModal(false);
    setShowBuyModal(false);
  }, []);

  const addToChatbot = useCallback(
    (chatBotMessageToAdd: ChatBot) => {
      setChatBot((prev) => [...prev, chatBotMessageToAdd]);
    },
    [chatBot]
  );

  return (
    <AppLayout
      title={channelBySlug?.name}
      image={channelBySlug?.owner?.FCImageUrl}
      isCustomHeader={true}
    >
      {!queryLoading && !channelDataError ? (
        <>
          <ControlTransactionModal
            callback={(text: string) => handleSendMessage(text)}
            icon={
              <Image
                alt="control"
                src="/svg/control.svg"
                width="60px"
                height="60px"
              />
            }
            title="control the stream!"
            isOpen={showControlModal}
            handleClose={handleClose}
            addToChatbot={addToChatbot}
          />
          <BuyTransactionModal
            title=""
            icon={
              <BuyButton
                tokenName={`$${channelBySlug?.token?.symbol}`}
                noHover
              />
            }
            isOpen={showBuyModal}
            handleClose={handleClose}
            addToChatbot={addToChatbot}
          />
          <TipTransactionModal
            icon={
              <Image
                alt="coin"
                src="/svg/coin.svg"
                width="60px"
                height="60px"
              />
            }
            title="tip on the stream!"
            isOpen={showTipModal}
            handleClose={handleClose}
            addToChatbot={addToChatbot}
          />
          <ChanceTransactionModal
            icon={
              <Image
                alt="dice"
                src="/svg/dice.svg"
                width="60px"
                height="60px"
              />
            }
            title="feeling lucky? roll the die for a surprise!"
            isOpen={showChanceModal}
            handleClose={handleClose}
            addToChatbot={addToChatbot}
          />
          <PvpTransactionModal
            icon={
              <Image
                alt="sword"
                src="/svg/sword.svg"
                width="60px"
                height="60px"
              />
            }
            title="unlock player vs player features in chat"
            isOpen={showPvpModal}
            handleClose={handleClose}
            addToChatbot={addToChatbot}
          />
          <Stack direction="column" mt={"1rem"}>
            <Stack
              mx={[0, 8, 4]}
              alignItems={["center", "initial"]}
              mt="10px"
              spacing={[4, 8]}
              direction={["column", "column", "row", "row"]}
            >
              <Stack direction="column" width={"100%"}>
                <Flex width={"100%"} position="relative">
                  <Box
                    position="absolute"
                    zIndex={10}
                    maxHeight={{
                      base: "100%",
                      sm: "700px",
                      md: "700px",
                      lg: "700px",
                    }}
                    overflow="hidden"
                  >
                    {textOverVideo.map((data: string, index: number) => (
                      <Text key={index}>{data}</Text>
                    ))}
                  </Box>
                  <NextStreamTimer isTheatreMode />
                </Flex>
                <Grid templateColumns="repeat(3, 1fr)" gap={4} mt="20px">
                  <GridItem colSpan={showArcadeButtons ? 2 : 3}>
                    <ChannelDesc />
                  </GridItem>
                  {showArcadeButtons && (
                    <GridItem justifyItems={"center"}>
                      <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        gap={5}
                      >
                        {isAddress(String(channelBySlug?.token?.address)) && (
                          <>
                            <Grid
                              templateColumns="repeat(2, 1fr)"
                              templateRows="repeat(2, 1fr)"
                              gridGap={4}
                              alignItems="flex-start"
                              justifyItems="flex-start"
                            >
                              <ControlButton
                                callback={() => setShowControlModal(true)}
                              />
                              <CoinButton
                                callback={() => setShowTipModal(true)}
                              />
                              <Tooltip label={"coming soon"}>
                                <span>
                                  <DiceButton noHover />
                                </span>
                              </Tooltip>
                              <Tooltip label={"coming soon"}>
                                <span>
                                  <SwordButton noHover />
                                </span>
                              </Tooltip>
                            </Grid>
                            <BuyButton
                              tokenName={`$${channelBySlug?.token?.symbol}`}
                              callback={() => setShowBuyModal(true)}
                            />
                          </>
                        )}
                        {!isAddress(String(channelBySlug?.token?.address)) && (
                          <>
                            <Grid
                              templateColumns="repeat(2, 1fr)"
                              templateRows="repeat(2, 1fr)"
                              gridGap={4}
                              alignItems="flex-start"
                              justifyItems="flex-start"
                            >
                              <Tooltip label={"Not available"}>
                                <span>
                                  <ControlButton />
                                </span>
                              </Tooltip>
                              <Tooltip label={"Not available"}>
                                <span>
                                  <CoinButton />
                                </span>
                              </Tooltip>
                              <Tooltip label={"Not available"}>
                                <span>
                                  <DiceButton />
                                </span>
                              </Tooltip>
                              <Tooltip label={"Not available"}>
                                <span>
                                  <SwordButton />
                                </span>
                              </Tooltip>
                            </Grid>
                            <Tooltip label={"Not available"}>
                              <span>
                                <BuyButton tokenName={"token"} />
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </GridItem>
                  )}
                </Grid>
              </Stack>
              <Flex
                hidden={isHidden(true)}
                borderWidth="1px"
                borderRadius={"10px"}
                p="1px"
                bg={
                  "repeating-linear-gradient(#E2F979 0%, #B0E5CF 34.37%, #BA98D7 66.67%, #D16FCE 100%)"
                }
                width="100%"
                maxW={["768px", "100%", "380px"]}
                maxH={["500px", "850px"]}
                boxShadow="0px 4px 16px rgba(208, 234, 53, 0.4)"
              >
                <Container
                  borderRadius={10}
                  background={"#19162F"}
                  centerContent
                >
                  <AblyChatComponent
                    username={username}
                    chatBot={chatBot}
                    handleBuyModal={() => setShowBuyModal(true)}
                    handleTipModal={() => setShowTipModal(true)}
                    handleChanceModal={() => setShowChanceModal(true)}
                    handlePvpModal={() => setShowPvpModal(true)}
                    handleControlModal={() => setShowControlModal(true)}
                  />
                </Container>
              </Flex>
            </Stack>
          </Stack>
        </>
      ) : (
        <Flex
          alignItems={"center"}
          justifyContent={"center"}
          width="100%"
          height="calc(100vh - 64px)"
          fontSize="50px"
        >
          {!channelDataError ? (
            ["l", "o", "a", "d", "i", "n", "g", ".", ".", "."].map(
              (letter, index) => (
                <Text
                  className="bouncing-text"
                  key={index}
                  fontFamily="Neue Pixel Sans"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {letter}
                </Text>
              )
            )
          ) : (
            <Text fontFamily="Neue Pixel Sans">
              server error, please try again later
            </Text>
          )}
        </Flex>
      )}
    </AppLayout>
  );
};

export default ChannelDetail;
