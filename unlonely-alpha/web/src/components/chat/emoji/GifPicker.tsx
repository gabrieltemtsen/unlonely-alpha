import React, { useState } from "react";
import { SimpleGrid, Flex, Text } from "@chakra-ui/react";
import Gif from "./Gif";

type Props = {
  onSelectGif: (gif: string) => void;
  gifs: string[];
};

const GifCategory = ({
  onSelectGif,
  gifs,
}: {
  gifs: Array<string>;
  onSelectGif: (gif: string) => void;
}) => {
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
  return (
    <Flex direction="column">
      <Text fontWeight={"bold"}>Power User Badge Hodlers</Text>
      <SimpleGrid minChildWidth="20px" spacing="4px" alignContent="center">
        {gifs.map((gif) => (
          <Gif
            key={gif}
            onClick={onSelectGif}
            gif={gif}
            buttonDisabled={buttonDisabled}
            setButtonDisabled={setButtonDisabled}
          />
        ))}
      </SimpleGrid>
    </Flex>
  );
};

const GifPicker = ({ onSelectGif, gifs }: Props) => {
  return (
    <Flex direction="column">
      <GifCategory
        onSelectGif={onSelectGif}
        gifs={gifs}
      />
    </Flex>
  );
};

export default GifPicker;