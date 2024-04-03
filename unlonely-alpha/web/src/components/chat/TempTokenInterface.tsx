import { useState, useEffect, useMemo } from "react";
import { formatUnits } from "viem";
import {
  Flex,
  Text,
  Spinner,
  Button,
  Tooltip as ChakraTooltip,
  Input,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";
import { getTimeFromMillis } from "../../utils/time";
import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Line,
  Tooltip,
  Brush,
  ReferenceLine,
} from "recharts";
import { truncateValue } from "../../utils/tokenDisplayFormatting";
import { useTradeTempTokenState } from "../../hooks/internal/temp-token/useTradeTempTokenState";
import { useChannelContext } from "../../hooks/context/useChannel";
import { formatIncompleteNumber } from "../../utils/validation/input";
import { FaMagnifyingGlassChart } from "react-icons/fa6";
import { useInterfaceChartMarkers } from "../../hooks/internal/temp-token/useInterfaceChartMarkers";
import { useInterfaceChartData } from "../../hooks/internal/temp-token/useInterfaceChartData";
import {
  blockNumberDaysAgo,
  blockNumberHoursAgo,
} from "../../hooks/internal/useVibesCheck";
import { useCacheContext } from "../../hooks/context/useCache";

const ZONE_BREADTH = 0.05;
const NUMBER_OF_HOURS_IN_DAY = 24;
const NUMBER_OF_DAYS_IN_MONTH = 30;

export const TempTokenInterface = ({
  canPlayToken,
  handleCanPlayToken,
  customHeight,
}: {
  canPlayToken: boolean;
  handleCanPlayToken: (canPlay: boolean) => void;
  customHeight?: string;
}) => {
  const { channel } = useChannelContext();
  const { ethPriceInUsd } = useCacheContext();

  const {
    currentActiveTokenEndTimestamp,
    currentActiveTokenSymbol,
    currentActiveTokenHasHitTotalSupplyThreshold,
    currentActiveTokenHighestTotalSupply,
    currentActiveTokenIsAlwaysTradable,
    currentActiveTokenTotalSupply,
    currentActiveTokenTotalSupplyThreshold,
  } = channel;
  const [timeLeftForTempToken, setTimeLeftForTempToken] = useState<
    string | undefined
  >(undefined);

  const {
    chartTxs,
    loading,
    amount,
    handleAmount,
    mint,
    burn,
    errorMessage,
    tempTokenBalance,
    mintCostAfterFees,
    mintCostAfterFeesLoading,
    burnProceedsAfterFees,
    burnProceedsAfterFeesLoading,
    chartTimeIndexes,
    currentBlockNumberForTempTokenChart,
  } = useTradeTempTokenState();

  const {
    isChartPaused,
    formattedData,
    pausedDataForAllTime,
    pausedData_1h,
    pausedData_1d,
    timeFilter,
    handleTimeFilter,
    handleIsChartPaused,
  } = useInterfaceChartData({
    chartTimeIndexes,
    txs: chartTxs,
  });

  const [currentPriceInUsd, setCurrentPriceInUsd] = useState<
    string | undefined
  >(undefined);

  const formattedCurrentPrice = useMemo(
    () =>
      formattedData.length > 0
        ? formatUnits(BigInt(formattedData[formattedData.length - 1].price), 18)
        : "0",
    [formattedData]
  );

  useEffect(() => {
    if (ethPriceInUsd === undefined) return;
    setCurrentPriceInUsd(
      truncateValue(Number(formattedCurrentPrice) * Number(ethPriceInUsd), 4)
    );
  }, [formattedCurrentPrice, ethPriceInUsd]);

  const {
    CustomDot,
    CustomTooltip,
    formatYAxisTick,
    CustomLabel,
    customBrushFormatter,
  } = useInterfaceChartMarkers(chartTxs, timeFilter);

  useEffect(() => {
    // Function to update the countdown
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const duration = Number(currentActiveTokenEndTimestamp) - now;

      if (duration < 0) {
        // If the duration is negative, the countdown is over
        setTimeLeftForTempToken(undefined);
        return;
      }

      // Convert duration to a readable format, e.g., HH:MM:SS
      const str = getTimeFromMillis(duration * 1000, true, true);

      setTimeLeftForTempToken(str);
    };

    // Initial update
    updateCountdown();

    // Set the interval to update the countdown every X seconds
    const interval = setInterval(updateCountdown, 5 * 1000);

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, [currentActiveTokenEndTimestamp]);

  return (
    <>
      {loading ? (
        <Flex
          direction="column"
          alignItems="center"
          width="100%"
          gap="5px"
          justifyContent={"center"}
        >
          <Text>loading Temp Token chart</Text>
          <Spinner size="md" />
        </Flex>
      ) : (
        <Flex
          direction="column"
          justifyContent={"space-between"}
          width="100%"
          p={"10px"}
          h={customHeight ?? "100%"}
        >
          <Flex justifyContent={"space-between"} alignItems={"center"}>
            <Text fontSize={"20px"} color="#c6c3fc" fontWeight="bold">
              ${currentActiveTokenSymbol}
            </Text>
            <Text fontSize={"20px"} color="#c6c3fc" fontWeight="bold">
              {timeLeftForTempToken ?? "00:00"}
            </Text>
          </Flex>
          {canPlayToken && (
            <Flex gap="5px" alignItems={"center"}>
              <Button
                bg={timeFilter === "1h" ? "#7874c9" : "#403c7d"}
                p={3}
                height="20px"
                _focus={{}}
                onClick={() => handleTimeFilter("1h")}
              >
                1h
              </Button>
              <Button
                bg={timeFilter === "1d" ? "#7874c9" : "#403c7d"}
                p={3}
                height="20px"
                _active={{}}
                onClick={() => handleTimeFilter("1d")}
              >
                1d
              </Button>
              <Button
                bg={timeFilter === "all" ? "#7874c9" : "#403c7d"}
                p={3}
                height="20px"
                _hover={{}}
                onClick={() => handleTimeFilter("all")}
              >
                all
              </Button>
              <ChakraTooltip
                label="toggle chart zooming, will pause live updates when enabled"
                shouldWrapChildren
                openDelay={300}
              >
                <Button
                  color="#ffffff"
                  bg={isChartPaused ? "rgb(173, 169, 249)" : "#4741c1"}
                  _hover={{
                    transform: "scale(1.15)",
                  }}
                  _focus={{}}
                  _active={{}}
                  p={3}
                  height={"20px"}
                  onClick={() => handleIsChartPaused(!isChartPaused)}
                  boxShadow={
                    isChartPaused
                      ? "0px 0px 25px rgba(173, 169, 249, 0.847)"
                      : undefined
                  }
                >
                  {<FaMagnifyingGlassChart />}
                </Button>
              </ChakraTooltip>
            </Flex>
          )}
          <Flex gap="10px" flex="1" h="100%" direction="column">
            <Flex direction="column" w="100%" position="relative" h="70%">
              {chartTxs.length === 0 && (
                <Text
                  textAlign="center"
                  position="absolute"
                  color="gray"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                >
                  no txs
                </Text>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={
                    isChartPaused
                      ? timeFilter === "all"
                        ? pausedDataForAllTime
                        : timeFilter === "1h"
                        ? pausedData_1h
                        : pausedData_1d
                      : formattedData
                  }
                >
                  <XAxis
                    hide
                    dataKey="blockNumber"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    allowDataOverflow={false}
                  />
                  <YAxis
                    tickFormatter={formatYAxisTick}
                    domain={["dataMin", "dataMax"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {timeFilter === "all" && (
                    <>
                      {Array.from(chartTimeIndexes.keys())
                        .filter((i) => i.includes("d"))
                        .map((key) => {
                          return (
                            <ReferenceLine
                              key={key}
                              strokeDasharray="3 3"
                              x={
                                chartTimeIndexes.get(key)?.blockNumber as number
                              }
                              stroke="rgb(0, 211, 193)"
                              label={<CustomLabel value={`~${key}`} />}
                            />
                          );
                        })}
                      {[...Array(NUMBER_OF_DAYS_IN_MONTH).keys()]
                        .map((i) => i + 1)
                        .filter(
                          (d) =>
                            chartTimeIndexes.get(`${d}d`)?.blockNumber ===
                            undefined
                        )
                        .map((key) => {
                          return (
                            <ReferenceLine
                              key={key}
                              strokeDasharray="1 1"
                              x={Number(
                                blockNumberDaysAgo(
                                  key,
                                  currentBlockNumberForTempTokenChart
                                )
                              )}
                              stroke="rgba(0, 211, 193, 0.2)"
                            />
                          );
                        })}
                    </>
                  )}
                  {timeFilter === "1d" && (
                    <>
                      {Array.from(chartTimeIndexes.keys())
                        .filter((i) => i.includes("h"))
                        .map((key) => {
                          return (
                            <ReferenceLine
                              key={key}
                              strokeDasharray="3 3"
                              x={
                                chartTimeIndexes.get(key)?.blockNumber as number
                              }
                              stroke="#00d3c1"
                              label={<CustomLabel value={`~${key}`} />}
                            />
                          );
                        })}
                      {[...Array(NUMBER_OF_HOURS_IN_DAY).keys()]
                        .map((i) => i + 1)
                        .filter(
                          (h) =>
                            chartTimeIndexes.get(`${h}h`)?.blockNumber ===
                            undefined
                        )
                        .map((key) => {
                          return (
                            <ReferenceLine
                              key={key}
                              strokeDasharray="1 1"
                              x={Number(
                                blockNumberHoursAgo(
                                  key,
                                  currentBlockNumberForTempTokenChart
                                )
                              )}
                              stroke="rgba(0, 211, 193, 0.2)"
                            />
                          );
                        })}
                    </>
                  )}
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={"#8884d8"}
                    strokeWidth={2}
                    animationDuration={200}
                    dot={<CustomDot />}
                  />
                  {isChartPaused && (
                    <Brush
                      dataKey="blockNumber"
                      height={30}
                      fill={isChartPaused ? "#2c2970" : "transparent"}
                      stroke={isChartPaused ? "#ada9f9" : "#5e5e6a"}
                      tickFormatter={(tick) => customBrushFormatter(tick)}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Flex>
            {!canPlayToken && (
              <Button _focus={{}} _active={{}} _hover={{}} bg="#02b263" h="30%">
                <Text color="white" onClick={() => handleCanPlayToken(true)}>
                  PLAY NOW
                </Text>
              </Button>
            )}
            {canPlayToken && (
              <Flex
                direction="column"
                justifyContent={"flex-end"}
                gap="10px"
                h="30%"
              >
                <Flex position="relative" gap="5px" alignItems={"center"}>
                  <ChakraTooltip
                    label={errorMessage}
                    placement="bottom-start"
                    isOpen={errorMessage !== undefined}
                    bg="red.600"
                  >
                    <Input
                      variant={errorMessage.length > 0 ? "redGlow" : "glow"}
                      textAlign="center"
                      value={amount}
                      onChange={handleAmount}
                      mx="auto"
                      p="1"
                      fontSize={"14px"}
                    />
                  </ChakraTooltip>
                  <Popover trigger="hover" placement="top" openDelay={500}>
                    <PopoverTrigger>
                      <Button
                        bg={"#403c7d"}
                        color="white"
                        p={2}
                        height={"20px"}
                        _focus={{}}
                        _active={{}}
                        _hover={{
                          bg: "#8884d8",
                        }}
                        onClick={() => {
                          tempTokenBalance &&
                            handleAmount(tempTokenBalance.formatted);
                        }}
                      >
                        max
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      bg="#6c3daf"
                      border="none"
                      width="100%"
                      p="2px"
                    >
                      <PopoverArrow bg="#6c3daf" />
                      <Text fontSize="12px" textAlign={"center"}>
                        click to show max temp tokens u currently own
                      </Text>
                    </PopoverContent>
                  </Popover>
                </Flex>
                <Flex gap="2px" justifyContent={"center"} direction="column">
                  <Button
                    color="white"
                    _focus={{}}
                    _hover={{}}
                    _active={{}}
                    bg="#46a800"
                    isDisabled={
                      !mint ||
                      mintCostAfterFeesLoading ||
                      Number(formatIncompleteNumber(amount)) <= 0
                    }
                    onClick={mint}
                    p={"0px"}
                    w="100%"
                  >
                    <Flex direction="column">
                      <Text>BUY</Text>
                      <Text fontSize={"12px"} noOfLines={1} color="#eeeeee">
                        {`(${truncateValue(
                          formatUnits(mintCostAfterFees, 18),
                          4
                        )} ETH)`}
                      </Text>
                    </Flex>
                  </Button>
                  <Button
                    color="white"
                    _focus={{}}
                    _hover={{}}
                    _active={{}}
                    bg="#fe2815"
                    isDisabled={
                      !burn ||
                      burnProceedsAfterFeesLoading ||
                      Number(formatIncompleteNumber(amount)) <= 0
                    }
                    onClick={burn}
                    p={undefined}
                    w="100%"
                  >
                    <Flex direction="column">
                      <Text>SELL</Text>
                      <Text fontSize={"12px"} noOfLines={1} color="#eeeeee">
                        {`(${truncateValue(
                          formatUnits(burnProceedsAfterFees, 18),
                          4
                        )} ETH)`}
                      </Text>
                    </Flex>
                  </Button>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>
      )}
    </>
  );
};
