import { useApolloClient } from "@apollo/client";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Flex,
  Table,
  TableContainer,
  Tbody,
  Th,
  Thead,
  Tr,
  Text,
  Box,
  useBreakpointValue,
  Spinner,
  Td,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useContractReads } from "wagmi";

import { NULL_ADDRESS } from "../../constants";
import { NETWORKS } from "../../constants/networks";
import { CHANNEL_DETAIL_QUERY } from "../../constants/queries";
import centerEllipses from "../../utils/centerEllipses";
import { getContractFromNetwork } from "../../utils/contract";
import { tournamentDates } from "../layout/TournamentSection";

const headers = ["rank", "channel", "# badges", "streamer"];

const slugs = tournamentDates.flatMap((date) =>
  date.data.flatMap((match) => [match.contestant1.slug, match.contestant2.slug])
);

export const useMultipleChannelQueries = (slugs: string[]) => {
  const apolloClient = useApolloClient();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          slugs.map((slug) =>
            apolloClient.query({
              query: CHANNEL_DETAIL_QUERY,
              variables: { slug },
            })
          )
        );
        setData(results.map((result) => result.data.getChannelBySlug));
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slugs, apolloClient]);

  return { data, loading, error };
};

const tournamentContract = getContractFromNetwork(
  "unlonelyTournament",
  NETWORKS[0]
);

const vipBadgeSupplyContractConfig = {
  ...tournamentContract,
  functionName: "getSupply",
};

const Leaderboard = ({ callback }: { callback?: () => void }) => {
  const { data, loading, error } = useMultipleChannelQueries(slugs);

  const { data: contractData } = useContractReads({
    contracts: slugs.map((slug, i: number) => ({
      ...vipBadgeSupplyContractConfig,
      args: [data[i]?.owner?.address ?? NULL_ADDRESS, 0, 1],
    })),
  });

  const visibleColumns = useBreakpointValue({
    base: [1, 2],
    sm: [0, 1, 2],
    md: [0, 1, 2, 3],
    lg: [0, 1, 2, 3],
  });
  const router = useRouter();

  const handleRowClick = (slug: string) => {
    callback?.();
    router.push(`/channels/${slug}`);
  };

  const cleanedData = useMemo(
    () =>
      data
        .map((d, i) => {
          return {
            data: [
              `${i + 1}`,
              d?.slug,
              String(contractData?.[i].result as bigint),
              d?.owner?.username ?? centerEllipses(d?.owner?.address, 10),
            ],
            channelLink: d?.slug,
          };
        })
        .sort((a, b) => {
          return Number(b.data[2]) - Number(a.data[2]);
        }),
    [data, contractData]
  );

  return (
    <Flex
      borderWidth="1px"
      borderRadius={"10px"}
      p="12px"
      bg={
        "repeating-linear-gradient(#E2F979 0%, #B0E5CF 34.37%, #BA98D7 66.67%, #D16FCE 100%)"
      }
      boxShadow="0px 4px 16px rgba(208, 234, 53, 0.4)"
      background={"#19162F"}
      direction="column"
      width="100%"
    >
      <Text
        fontSize={{ base: "30px", lg: "40px" }}
        fontWeight="400"
        textAlign={"center"}
        fontFamily={"LoRes15"}
      >
        leaderboard
      </Text>
      <Text
        color={"#B6B6B6"}
        fontSize={"18px"}
        fontWeight="400"
        textAlign={"center"}
        mb="20px"
      >
        who has the most badges?
      </Text>
      <Box borderWidth="1px" borderColor="#615C5C" borderRadius={10}>
        {error ? (
          <Flex justifyContent={"center"} p="10px">
            <Text>Cannot fetch data</Text>
          </Flex>
        ) : loading ? (
          <Flex justifyContent={"center"} p="10px">
            <Spinner />
          </Flex>
        ) : (
          <TableContainer
            overflowX={"auto"}
            maxHeight={"50vh"}
            overflowY={"scroll"}
          >
            <Table variant="unstyled">
              <Thead position={"sticky"} top="0">
                <Tr>
                  {visibleColumns &&
                    visibleColumns.map((i) => (
                      <Th
                        textTransform={"lowercase"}
                        fontSize={["20px", "24px"]}
                        p="10px"
                        background={"#19162F"}
                        textAlign="center"
                        borderBottom="1px solid #615C5C"
                        key={i}
                      >
                        {headers[i]}
                      </Th>
                    ))}
                </Tr>
              </Thead>
              <Tbody>
                {cleanedData.map((row, rowIndex) => (
                  <Tr
                    onClick={() => handleRowClick(row.channelLink)}
                    _hover={{ background: "#615C5C" }}
                    cursor="pointer"
                    key={rowIndex}
                  >
                    {visibleColumns &&
                      visibleColumns.map((index) => (
                        <Td
                          fontSize={["20px", "24px"]}
                          p="10px"
                          textAlign="center"
                          key={index}
                        >
                          {row.data[index]}
                          {index === 1 && row.data[index] && (
                            <ExternalLinkIcon height="0.8rem" />
                          )}
                        </Td>
                      ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Flex>
  );
};
export default Leaderboard;