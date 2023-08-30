import React from "react";
import { Text, Flex } from "@chakra-ui/react";
import { FaBars } from "react-icons/fa";
import { TfiPlus } from "react-icons/tfi";

import { TransactionModalTemplate } from "../../transactions/TransactionModalTemplate";

interface Props {
  closePrompt: () => void;
}

export default function AddToSamsung(props: Props) {
  const { closePrompt } = props;

  return (
    <TransactionModalTemplate
      size="xs"
      isModalLoading={false}
      isOpen={true}
      handleClose={closePrompt}
      hideFooter={true}
      cannotClose
    >
      <Flex direction="column" alignItems={"center"} gap="10px">
        <Text textAlign={"center"}>
          For the best experience, we recommend adding the Unlonely app to your
          home screen!
        </Text>
        <Flex alignItems={"center"} gap="5px">
          <p>Click the</p> <FaBars /> <p>icon</p>
        </Flex>
        <Flex alignItems={"center"} gap="5px">
          <p>
            Scroll down and then click <TfiPlus />
          </p>
        </Flex>
        <Flex direction="column">
          <Text textAlign={"center"}>Then click</Text>
          <Text textAlign={"center"}>“Home Screen”</Text>
        </Flex>
        <Text textAlign={"center"} color="black" fontSize="12px" mt="10px">
          (Can't find the "add to home screen" button? make sure you're not in
          an in-app browser!)
        </Text>
      </Flex>
    </TransactionModalTemplate>
  );
}