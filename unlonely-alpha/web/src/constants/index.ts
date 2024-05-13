import Ably from "ably/promises";

import { COLORS } from "../styles/Colors";
import { ContractData } from "./types";

export enum InteractionType {
  CONTROL = "control-text-interaction",
  TIP = "tip-interaction",
  BUY = "buy-tokens-interaction",
  CUSTOM = "custom-action-interaction",
  BLAST = "blast-emoji-interaction",
  CLIP = "clip-interaction",

  BUY_VOTES = "buy-votes-interaction",
  SELL_VOTES = "sell-votes-interaction",

  BUY_BADGES = "buy-badges-interaction",
  SELL_BADGES = "sell-badges-interaction",

  BUY_VIBES = "buy-vibes-interaction",
  SELL_VIBES = "sell-vibes-interaction",

  BUY_TEMP_TOKENS = "buy-temp-tokens-interaction",
  SELL_TEMP_TOKENS = "sell-temp-tokens-interaction",
  CREATE_TEMP_TOKEN = "create-temp-token-interaction",
  CREATE_MULTIPLE_TEMP_TOKENS = "create-multiple-temp-tokens-interaction",
  TEMP_TOKEN_EXPIRED = "expired-temp-token-interaction",
  TEMP_TOKEN_EXPIRATION_WARNING = "temp-token-expiration-warning-interaction",
  TEMP_TOKEN_REACHED_THRESHOLD = "temp-token-reached-threshold-interaction",
  TEMP_TOKEN_DURATION_INCREASED = "temp-token-duration-increased-interaction",
  TEMP_TOKEN_BECOMES_ALWAYS_TRADEABLE = "temp-token-becomes-always-tradeable-interaction",
  TEMP_TOKEN_THRESHOLD_INCREASED = "temp-token-threshold-increased-interaction",
  SEND_REMAINING_FUNDS_TO_WINNER_AFTER_TEMP_TOKEN_EXPIRATION = "send-remaining-funds-to-winner-after-temp-token-expiration-interaction",
  VERSUS_SET_WINNING_TOKEN_TRADEABLE_AND_TRANSFER_LIQUIDITY = "versus-set-winning-token-tradeable-and-transfer-liquidity-interaction",
  VERSUS_WINNER_TOKENS_MINTED = "versus-winner-tokens-minted-interaction",

  EVENT_LIVE = "event-live-interaction",
  EVENT_LOCK = "event-lock-interaction",
  EVENT_UNLOCK = "event-unlock-interaction",
  EVENT_PAYOUT = "event-payout-interaction",
}

export enum BaseChatCommand {
  COMMANDS = "!commands",
  CHATBOT = "!chatbot",
  RULES = "!rules",
  CLIP = "!clip",
}

export enum EventTypeForContract {
  YAY_NAY_VOTE = 0,
  VIP_BADGE = 1,
  SIDE_BET = 2,
}

export enum Contract {
  TEMP_TOKEN_FACTORY_V1 = "tempTokenFactoryV1",
  VIBES_TOKEN_V1 = "vibesTokenV1",
  SHARES_V2 = "unlonelySharesV2",
  TOURNAMENT = "unlonelyTournament",
}

export const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
export const NULL_ADDRESS_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const USER_APPROVAL_AMOUNT = "10000";

export const RANDOM_CHAT_COLOR =
  COLORS[Math.floor(Math.random() * COLORS.length)];

export const CHAT_MESSAGE_EVENT = "chat-message";
export const CHANGE_USER_ROLE_EVENT = "change-user-role";
export const CHANGE_CHANNEL_DETAILS_EVENT = "change-channel-details";
export const VIBES_TOKEN_PRICE_RANGE_EVENT = "vibes-token-price-range";
export const TOKEN_TRANSFER_EVENT = "token-transfer";
export const PINNED_CHAT_MESSAGES_EVENT = "pinned-chat-messages";

export type CommandData = {
  command: string;
  response: string;
};

export type AblyChannelPromise = Ably.Types.RealtimeChannelPromise;

export const MAX_VIBES_PRICE = 399999999934464;

export const IPFS_PROJECT_ID = "2L4KPgsXhXNwOtkELX7xt2Sbrl4";
export const IPFS_PROJECT_SECRET = "7d400aacc9bc6c0f0d6e59b65a83d764";

export const CREATION_BLOCK = BigInt(9018023); // vibes token creation block number

export const SECONDS_IN_A_MINUTE = 60;
export const MINUTES_IN_AN_HOUR = 60;
export const HOURS_IN_A_DAY = 24;
export const DAYS_IN_A_WEEK = 7;
export const AVERAGE_BLOCK_TIME_SECS = 2;
export const SECONDS_PER_HOUR = MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE;
export const SECONDS_PER_DAY = HOURS_IN_A_DAY * SECONDS_PER_HOUR;
export const DESKTOP_VIDEO_VH = 80;
export const MOBILE_VIDEO_VH = 25;

export const NEW_STREAMER_URL_QUERY_PARAM = "new";
export const STREAMER_MIGRATION_URL_QUERY_PARAM = "migrate";

export const CHANNEL_IDS_ALLOWED_TO_DESKTOP_CHANNEL_TEMP_TOKEN = [
  "3",
  "15",
  "29",
  "483",
  "182",
  "138",
  "27",
  "32",
  "426",
  "478",
  "191",
  "525",
  "554",
  "127",
  "496",
  "688"
];

export const CAN_USE_VERSUS_MODE_SLUGS = [
  // "danny",
  "versus", 
  "brian"];

export type VersusTokenDataType = {
  symbol: string;
  address: string;
  totalSupply: bigint;
  isAlwaysTradeable: boolean;
  highestTotalSupply: bigint;
  contractData: ContractData;
  creationBlockNumber: bigint;
  transferredLiquidityOnExpiration: bigint;
  endTimestamp?: bigint;
};

export const versusTokenDataInitial: VersusTokenDataType = {
  transferredLiquidityOnExpiration: BigInt(0),
  symbol: "",
  address: "",
  totalSupply: BigInt(0),
  isAlwaysTradeable: false,
  highestTotalSupply: BigInt(0),
  contractData: {
    address: NULL_ADDRESS,
    chainId: 0,
    abi: undefined,
  },
  creationBlockNumber: BigInt(0),
  endTimestamp: undefined,
};
