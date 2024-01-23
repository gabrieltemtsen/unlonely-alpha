import { Box, Flex } from "@chakra-ui/react";

import NextHead from "../layout/NextHead";
import { TabsComponent } from "./StandAloneChatComponent";
import VibesTokenInterface from "../chat/VibesTokenInterface";
import { useChat } from "../../hooks/chat/useChat";

const styles = `
  html, body {
    background: transparent !important;
  }

  *, *:before, *:after {
    -webkit-user-select: none !important;
    user-select: none !important;
    -webkit-touch-callout: none !important;
    -webkit-user-drag: none !important;  
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }
`;

const PopOutChatComponent = () => {
  const chat = useChat();

  return (
    <Box flexDirection="column" height="100dvh" flexWrap="nowrap">
      <style>{styles}</style>
      <NextHead title="Unlonely Chat" description="" image="">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </NextHead>
      <div
        // chat area wrapper
        style={{
          // backgroundColor: "red",
          height: "100svh",
          position: "relative",
        }}
      >
        <Flex bg={"#19162F"} h={"100%"} direction="column">
          <Flex
            height="20vh"
            gap="5px"
            justifyContent={"space-between"}
            bg="#131323"
            p="5px"
          >
            <VibesTokenInterface ablyChannel={chat.channel} />
          </Flex>
          <TabsComponent chat={chat} />
        </Flex>
      </div>
    </Box>
  );
};

export default PopOutChatComponent;
