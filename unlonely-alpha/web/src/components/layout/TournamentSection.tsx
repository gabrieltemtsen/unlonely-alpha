import {
  Flex,
  Text,
  Image,
  Divider,
  useBreakpointValue,
} from "@chakra-ui/react";

import { VersusCard, VersusCardData } from "../tournament/VersusCard";

type TournamentDates = {
  date: string;
  data: VersusCardData;
}[];

export const tournamentDates: TournamentDates = [
  {
    date: "MON, NOV 20",
    data: [
      {
        contestant1: {
          name: "@seraphim",
          portrait: "/svg/temp/seraphim.svg",
          logo: "/svg/temp/logos/seraphim.svg",
          slug: "seraphim",
          logoSize: "60px",
        },
        contestant2: {
          name: "@jessjay.eth",
          portrait: "/svg/temp/jessjay.svg",
          logo: "/svg/temp/logos/jessjay.svg",
          slug: "wailoaloa",
          logoSize: "60px",
        },
        time: "3PM EST",
      },
      {
        contestant1: {
          name: "@cassie",
          portrait: "/svg/temp/cassie.svg",
          logo: "/svg/temp/logos/cassie.png",
          slug: "cassie",
          logoSize: "35px",
          logoBottom: "5px",
          rounded: true,
        },
        contestant2: {
          name: "@shoni",
          portrait: "/svg/temp/shoni.svg",
          logo: "/svg/temp/logos/shoni.svg",
          slug: "shoni",
          logoSize: "40px",
        },
        time: "8PM EST",
      },
    ],
  },
  {
    date: "TUE, NOV 21",
    data: [
      {
        contestant1: {
          name: "@azeemk_",
          portrait: "/svg/temp/azeemk_.svg",
          logo: "/svg/temp/logos/azeemk_.svg",
          slug: "azeem",
          logoSize: "60px",
        },
        contestant2: {
          name: "cybershakti.lens",
          portrait: "/svg/temp/cybershakti.svg",
          logo: "/svg/temp/logos/cybershakti.svg",
          slug: "cybershakti",
          logoSize: "60px",
        },
        time: "12PM EST",
      },
      {
        contestant1: {
          name: "@floguo",
          portrait: "/svg/temp/floguo.svg",
          logo: "/svg/temp/logos/floguo.svg",
          slug: "floguo",
          logoSize: "30px",
          logoLeft: "5px",
          logoBottom: "5px",
        },
        contestant2: {
          name: "@512mace",
          portrait: "/svg/temp/512mace.svg",
          logo: "/svg/temp/logos/512mace.svg",
          slug: "512mace",
          logoSize: "60px",
        },
        time: "3PM EST",
      },
      {
        contestant1: {
          name: "@cryptohun3y",
          portrait: "/svg/temp/cryptohun3y.svg",
          logo: "/svg/temp/logos/cryptohun3y.svg",
          slug: "hun3y",
          logoSize: "90px",
        },
        contestant2: {
          name: "@ivy",
          portrait: "/svg/temp/ivy.svg",
          logo: "/svg/temp/logos/ivy.svg",
          slug: "ivy",
          logoSize: "35px",
          logoLeft: "5px",
          logoBottom: "5px",
        },
        time: "8PM EST",
      },
    ],
  },
  {
    date: "WED, NOV 22",
    data: [
      {
        contestant1: {
          name: "@jackniewold",
          portrait: "/svg/temp/jackniewold.svg",
          logo: "/svg/temp/logos/jackniewold.svg",
          slug: "jackniewold",
          logoSize: "60px",
        },
        contestant2: {
          name: "@MichaelK",
          portrait: "/svg/temp/MichaelK.svg",
          logo: "/svg/temp/logos/MichaelK.svg",
          slug: "michaelk",
          logoSize: "70px",
          logoLeft: "-15px",
          logoBottom: "-15px",
        },
        time: "10AM EST",
      },
      {
        contestant1: {
          name: "@winny",
          portrait: "/svg/temp/winny.svg",
          logo: "/svg/temp/logos/winny.svg",
          slug: "winny",
          logoSize: "60px",
        },
        contestant2: {
          name: "@BeraMVP",
          portrait: "/svg/temp/bera.svg",
          logo: "/svg/temp/logos/bera.svg",
          slug: "beraMVP",
          logoSize: "35px",
          logoLeft: "-5px",
          logoBottom: "-5px",
        },
        time: "3PM EST",
      },
    ],
  },
];

const TournamentSection = () => {
  const shouldChangeToColumn = useBreakpointValue({
    base: true,
    sm: true,
    md: false,
    xl: false,
  });

  return (
    <Flex
      direction="column"
      bg={"#18162F"}
      p="3rem"
      gap="3rem"
      onClick={() => {
        window.open("/channels/brian", "_blank");
      }}
    >
      <Flex
        justifyContent={"center"}
        gap={"2rem"}
        direction={shouldChangeToColumn ? "column" : "row"}
      >
        <Image src="/svg/temp/rizz-olympics.svg" height="5rem" />
        <Flex gap="1rem" direction={["column", "column", "column", "row"]}>
          <Text
            fontSize="40px"
            color={"#37FF8B"}
            fontFamily="LoRes15"
            alignSelf="center"
            textAlign={"center"}
          >
            CURRENT TOURNAMENT:{" "}
          </Text>
          <Text
            fontSize="40px"
            color={"#37FF8B"}
            fontFamily="LoRes15"
            alignSelf="center"
            textAlign={"center"}
          >
            THE RIZZ OLYMPICS
          </Text>
        </Flex>
        <Image src="/svg/temp/rizz-olympics.svg" height="5rem" />
      </Flex>
      <Flex
        justifyContent={"space-evenly"}
        direction={shouldChangeToColumn ? "column" : "row"}
        gap={"2rem"}
      >
        {Array.from({ length: tournamentDates.length * 2 - 1 }).map((_, i) => (
          <>
            {i % 2 === 0 ? (
              <Flex direction="column" key={i} gap="2rem">
                <Text fontSize="30px" textAlign={"center"} fontFamily="LoRes15">
                  {tournamentDates[i / 2].date}
                </Text>
                <VersusCard data={tournamentDates[i / 2].data} />
              </Flex>
            ) : (
              <Flex key={i}>
                <Divider
                  orientation={shouldChangeToColumn ? "horizontal" : "vertical"}
                  borderColor={"#37FF8B"}
                  borderWidth={1}
                  height="100%"
                />
              </Flex>
            )}
          </>
        ))}
      </Flex>
    </Flex>
  );
};

export default TournamentSection;