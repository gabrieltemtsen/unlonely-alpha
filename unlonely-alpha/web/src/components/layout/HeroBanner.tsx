import { Flex, Text } from "@chakra-ui/react";

const HeroBanner = () => {
  return (
    <Flex direction="column" mt="20px">
      <Text
        fontSize={["40px", "55px", "70px"]}
        fontFamily={"Neue Pixel Sans"}
        textAlign="center"
      >
        welcome to unlonely
      </Text>
      <Text
        fontSize={["20px", "24px"]}
        className="gradient-text"
        textAlign="center"
      >
        Something something something
      </Text>
    </Flex>
  );
};

export default HeroBanner;