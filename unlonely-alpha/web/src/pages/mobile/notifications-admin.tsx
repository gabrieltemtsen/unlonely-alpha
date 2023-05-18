import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Image,
  Input,
  Progress,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import { gql, useLazyQuery } from "@apollo/client";

import NextHead from "../../components/layout/NextHead";
import { splitArray } from "../../utils/splitArray";
import AppLayout from "../../components/layout/AppLayout";

type DeviceNotificationsType = {
  address: string | null;
  token: string;
  notificationsLive: boolean;
  notificationsNFCs: boolean;
};

const GET_ALL_DEVICE_TOKENS = gql`
  query GetAllDevices {
    getAllDevices {
      token
      notificationsLive
      notificationsNFCs
      address
    }
  }
`;

export default function MobileNotifications() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const [isSending, setIsSending] = useState(false);
  const [selectedType, setSelectedType] = useState("live");
  const placeholderTitleLive = "🔴 brian is live on unlonely!";
  const placeholderBodyLive = "join the stream and hang out";
  const placeholderTitleNFCs = "new NFCs just dropped";
  const placeholderBodyNFCs = "watch some highlights from recent streams";
  const [titleLive, setTitleLive] = useState(placeholderTitleLive);
  const [titleNFCs, setTitleNFCs] = useState(placeholderTitleNFCs);
  const [bodyLive, setBodyLive] = useState(placeholderBodyLive);
  const [bodyNFCs, setBodyNFCs] = useState(placeholderBodyNFCs);
  const [getAllDeviceTokens, { loading, data }] = useLazyQuery(
    GET_ALL_DEVICE_TOKENS,
    {
      fetchPolicy: "no-cache",
    }
  );
  const devices = data?.getAllDevices;

  const devicesWithLive = devices?.filter((device: DeviceNotificationsType) => {
    if (device.notificationsLive) return device;
  });
  const devicesWithNFCs = devices?.filter((device: DeviceNotificationsType) => {
    if (device.notificationsNFCs) return device;
  });

  const sendNotifications = async () => {
    if (isSending) return;
    let devices: any;

    if (selectedType === "live") {
      devices = devicesWithLive;
    }

    if (selectedType === "nfc") {
      devices = devicesWithNFCs;
    }

    // all users are split into arrays of 20
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const deviceChunks = splitArray([devices], 20);

    // each array of 20 users is being looped over
    deviceChunks.forEach(async (chunk) => {
      const tokens: any[] = [];
      const templates: any[] = [];

      // looping through each user in the array of 20
      chunk.forEach((deviceChunk: any, index: number) => {
        // looping through each token in the user
        deviceChunk.forEach(
          (device: DeviceNotificationsType, deviceIndex: number) => {
            const deviceToken = device.token;
            tokens.push(deviceToken);
          }
        );
      });

      // preparing notification templates for every token from a single chunk
      // sending requests to all tokens of 20 users at once from a single chunk
      tokens.forEach((device) => {
        templates.push({
          to: device,
          title: selectedType === "live" ? titleLive : titleNFCs,
          body: selectedType === "live" ? bodyLive : bodyNFCs,
          sound: "default",
          data: {
            redirect: selectedType === "live" ? "live" : "nfc",
          },
          channelId: selectedType === "live" ? "Live" : "NFC",
        });
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const chunkedTemplates = splitArray(templates, 100);

      chunkedTemplates.forEach(async (template, index) => {
        const req = await fetch(
          "https://mysterious-stream-82183.herokuapp.com/https://exp.host/--/api/v2/push/send",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(template),
          }
        );

        if (req.ok) {
          toast({
            id: new Date().getMilliseconds(),
            title: `batch notification sent to ${template.length} devices`,
            status: "success",
            duration: 6000,
            isClosable: true,
          });

          if (chunkedTemplates.length === index + 1) {
            setIsSending(false);
            onClose();
          }
        }

        if (!req.ok) {
          toast({
            id: new Date().getMilliseconds(),
            title: `failed to send notifications to ${template.length} devices`,
            status: "error",
            duration: 6000,
            isClosable: true,
          });
        }
      });
    });
  };

  return (
    <AppLayout isCustomHeader={false}>
      <Flex direction={"column"} alignItems="center">
        <NextHead
          title="Push Notifications"
          description="send em"
          image=""
        ></NextHead>
        <Flex
          padding={[4, 16]}
          justifyContent="center"
          maxW="1200px"
          w={"100%"}
        >
          <Stack
            direction={["column", "row"]}
            spacing="24px"
            alignItems="flex-start"
            w={"100%"}
          >
            <Box borderWidth="1px" padding="16px" w={["100%", "60%"]}>
              {!loading && data ? (
                <>
                  <Flex direction="row" justifyContent="space-between" pb="4px">
                    <p>users w/ notifications on</p>
                    <Text pl="24px">{devices?.length}</Text>
                  </Flex>
                  <Divider></Divider>
                  <Flex direction="row" justifyContent="space-between" pb="4px">
                    <p>going live</p>
                    <Text pl="24px">{devicesWithLive?.length}</Text>
                  </Flex>
                  <Divider></Divider>
                </>
              ) : (
                <Button
                  onClick={() => {
                    getAllDeviceTokens();
                  }}
                  isLoading={loading}
                  loadingText="fetching users"
                  disabled={loading || isSending}
                >
                  fetch users
                </Button>
              )}
              {loading && (
                <Progress
                  size="sm"
                  isIndeterminate
                  width="300px"
                  height="6px"
                  borderRadius="32px"
                  mt={"48px"}
                />
              )}
            </Box>
            <Box w={"100%"} position="sticky" display={"block"} top="32px">
              <Box borderWidth="1px" bg="white" padding="32px" w={"100%"}>
                <Heading size="md" paddingBottom="16px">
                  send notification
                </Heading>
                <Tabs
                  variant="soft-rounded"
                  colorScheme="green"
                  defaultIndex={0}
                  onChange={(index) => {
                    if (index === 0) {
                      setSelectedType("live");
                    } else {
                      setSelectedType("nfc");
                    }
                  }}
                >
                  <TabList>
                    <Tab>going live</Tab>
                    {/* <Tab>new NFCs</Tab> */}
                  </TabList>
                  <TabPanels>
                    <TabPanel padding={0} pt={3}>
                      <Input
                        mb={2}
                        color="gray.500"
                        defaultValue={titleLive}
                        onChange={(event) => setTitleLive(event.target.value)}
                      />
                      <Input
                        defaultValue={bodyLive}
                        color="gray.500"
                        onChange={(event) => setBodyLive(event.target.value)}
                      />
                    </TabPanel>
                    {/* <TabPanel padding={0} pt={3}>
                          <Input
                            defaultValue={titleNFCs}
                            mb={2}
                            color="gray.500"
                            onChange={(event) => setTitleNFCs(event.target.value)}
                          />
                          <Input
                            defaultValue={bodyNFCs}
                            color="gray.500"
                            onChange={(event) => setBodyNFCs(event.target.value)}
                          />
                        </TabPanel> */}
                  </TabPanels>
                </Tabs>
                <Button
                  onClick={() => {
                    getAllDeviceTokens();
                  }}
                  isLoading={loading}
                  loadingText=""
                  colorScheme={"gray"}
                  mt={3}
                  mr={3}
                  disabled={!data || loading || isSending}
                >
                  refetch user list
                </Button>
                <Button
                  onClick={onOpen}
                  isLoading={loading}
                  loadingText="fetching users"
                  colorScheme={"blue"}
                  mt={3}
                  disabled={!data || loading || isSending}
                >
                  send to{" "}
                  {selectedType === "live"
                    ? devicesWithLive?.length
                    : devicesWithNFCs?.length}{" "}
                  users
                </Button>
              </Box>
              <Text pb={5} pt={5} textAlign="center">
                preview
              </Text>
              <Flex justifyContent={"center"}>
                <PreviewNotification
                  selectedType={selectedType}
                  titleLive={titleLive}
                  titleNFCs={titleNFCs}
                  bodyLive={bodyLive}
                  bodyNFCs={bodyNFCs}
                />
              </Flex>
            </Box>
          </Stack>
        </Flex>
        <AlertDialog
          motionPreset="slideInBottom"
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          leastDestructiveRef={cancelRef}
          onClose={onClose}
          isOpen={isOpen}
          isCentered
        >
          <AlertDialogOverlay />

          <AlertDialogContent>
            <AlertDialogHeader>send notifications</AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              are you sure you wanna blast all these{" "}
              {selectedType === "live"
                ? devicesWithLive?.length
                : devicesWithNFCs?.length}{" "}
              users with a push notification?
              <Box h={4}></Box>
              <PreviewNotification
                selectedType={selectedType}
                titleLive={titleLive}
                titleNFCs={titleNFCs}
                bodyLive={bodyLive}
                bodyNFCs={bodyNFCs}
              />
              {isSending && (
                <Box pt={5}>
                  <Progress
                    size="sm"
                    isIndeterminate
                    width="100%"
                    height="6px"
                    borderRadius="32px"
                  />
                  <Text fontSize="sm" color="red">
                    sending. do not close this window!
                  </Text>
                </Box>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                ref={cancelRef}
                onClick={onClose}
                disabled={isSending}
              >
                cancel
              </Button>
              <Button
                colorScheme="red"
                ml={3}
                onClick={() => {
                  setIsSending(true);
                  sendNotifications();
                }}
                disabled={isSending}
                isLoading={isSending}
                loadingText="sending..."
              >
                fully send it
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Flex>
    </AppLayout>
  );
}

const PreviewNotification = ({
  selectedType,
  titleLive,
  titleNFCs,
  bodyLive,
  bodyNFCs,
}: {
  selectedType: string;
  titleLive: string;
  titleNFCs: string;
  bodyLive: string;
  bodyNFCs: string;
}) => (
  <Box
    backdropBlur={"6px"}
    backgroundColor="rgba(0,0,0,0.8)"
    padding="16px"
    borderRadius={"26px"}
    width={["100%", "390px"]}
  >
    <Flex alignItems={"center"}>
      <Image
        src="https://imgur.com/RiQqM30.png"
        w="40px"
        borderRadius={"10px"}
      ></Image>
      <Box pl={3} w="100%">
        <Flex justifyContent={"space-between"} w="100%">
          <Text
            fontSize="md"
            color="gray.500"
            fontWeight={"bold"}
            fontFamily="system-ui"
            lineHeight={1.2}
            noOfLines={1}
          >
            {selectedType === "live" ? titleLive : titleNFCs}
          </Text>
          <Text
            fontSize="md"
            color="gray.700"
            fontFamily="system-ui"
            lineHeight={1.2}
            textAlign={"right"}
            pl="30px"
          >
            now
          </Text>
        </Flex>
        <Text
          fontSize="md"
          color="gray.500"
          fontFamily="system-ui"
          lineHeight={1.2}
          noOfLines={4}
          pt={"2px"}
          pr={
            bodyLive.length > 75
              ? "56px"
              : "0px" || bodyNFCs.length > 75
              ? "56px"
              : "0px"
          }
        >
          {selectedType === "live" ? bodyLive : bodyNFCs}
        </Text>
      </Box>
    </Flex>
  </Box>
);
