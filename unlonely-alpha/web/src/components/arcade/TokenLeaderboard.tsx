import { useQuery } from "@apollo/client";
import {
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Box,
  useBreakpointValue,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { GET_TOKEN_LEADERBOARD_QUERY } from "../../constants/queries";
import { GetTokenLeaderboardQuery } from "../../generated/graphql";
import centerEllipses from "../../utils/centerEllipses";

const headers = [
  "rank",
  "token name",
  "price (ETH)",
  "# hodlers",
  "channel owner",
];

const TokenLeaderboard = ({ callback }: { callback?: () => void }) => {
  const { loading, error, data } = useQuery<GetTokenLeaderboardQuery>(
    GET_TOKEN_LEADERBOARD_QUERY
  );

  const dataset = useMemo(() => data?.getTokenLeaderboard ?? [], [data]);

  const visibleColumns = useBreakpointValue({
    base: [1, 2],
    sm: [0, 1, 2],
    md: [0, 1, 2, 3],
    lg: [0, 1, 2, 3, 4],
  });
  const router = useRouter();

  const handleRowClick = (rowIndex: string) => {
    callback?.();
    router.push(`/channels/${rowIndex}`);
  };

  const [itemsShown, setItemsShown] = useState(10);

  const datasetCapped = useMemo(
    () =>
      dataset.map((d, i) => {
        return {
          data: [
            `${i + 1}`,
            d.symbol,
            d.price,
            d.holders,
            d.channel.owner.username ??
              centerEllipses(d.channel.owner.address, 10),
          ],
          channelLink: d.channel.slug,
        };
      }),
    [dataset, itemsShown]
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
        fontFamily={"Neue Pixel Sans"}
      >
        channel token leaderboard
      </Text>
      <Text
        color={"#B6B6B6"}
        fontSize={"18px"}
        fontWeight="400"
        textAlign={"center"}
        mb="20px"
      >
        who has the most valuable token?
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
          <TableContainer overflowX={"auto"}>
            <Table variant="unstyled">
              <Thead>
                <Tr>
                  {visibleColumns &&
                    visibleColumns.map((i) => (
                      <Th
                        textTransform={"lowercase"}
                        fontSize={["20px", "24px"]}
                        p="10px"
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
                {datasetCapped.map((row, rowIndex) => (
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
                        </Td>
                      ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {itemsShown < dataset.length && (
              <Flex justifyContent={"center"} p="5px">
                <Flex
                  borderRadius={"5px"}
                  p="1px"
                  bg={
                    "repeating-linear-gradient(#E2F979 0%, #B0E5CF 34.37%, #BA98D7 66.67%, #D16FCE 100%)"
                  }
                >
                  <Button
                    bg={"#131323"}
                    _hover={{ opacity: 0.9 }}
                    _focus={{}}
                    _active={{}}
                    onClick={() => setItemsShown((prev) => prev + 10)}
                  >
                    <Text fontFamily="Neue Pixel Sans" fontWeight="light">
                      See More
                    </Text>
                  </Button>
                </Flex>
              </Flex>
            )}
          </TableContainer>
        )}
      </Box>
    </Flex>
  );
};
export default TokenLeaderboard;
