import { Flex, Text } from "@chakra-ui/react";
import { Channel } from "../../generated/graphql";
import LiveChannelCard from "./LiveChannelCard";

type Props = {
  channels: Channel[];
};

const LiveChannelList: React.FunctionComponent<Props> = ({ channels }) => {
  const liveChannels = channels?.filter((channel: Channel) => channel.isLive);

  return (
    <>
      {liveChannels && liveChannels.length > 0 && (
        <Flex
        direction="row"
        overflowX="scroll"
        overflowY="clip"
        width="100%"
        height={{
          base: "14rem",
          sm: "19rem",
          md: "19rem",
          lg: "19rem",
        }}
      >
        <Flex w="100%" justifyContent="left">
          <Text
            color="black"
            fontSize={{ base: "20px", md: "30px", lg: "40px" }}
            lineHeight={{ base: "40px", md: "60px", lg: "80px" }}
            fontWeight="bold"
            textAlign="left"
          >
            🔴 Live Now!
          </Text>
        </Flex>
      {channels?.map((channel: Channel) =>
          channel.isLive ? (
            <LiveChannelCard key={channel.id} channel={channel} />
          ) : null,
        )}
      </Flex>
      )}
    </>
  );
};

export default LiveChannelList;
