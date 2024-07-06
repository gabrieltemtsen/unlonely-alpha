import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getAccessToken } from "@privy-io/react-auth";
import { useMemo } from "react";

export interface Context {
  signedMessage?: string;
}

let apolloClient: ApolloClient<NormalizedCacheObject>;
const server = String(process.env.NEXT_PUBLIC_DIGITAL_OCEAN_SERVER_URL);

const authLink = setContext(async (_, { headers }) => {
  const token = await getAccessToken();
  const latestVerifiedAddress = headers["latest-verified-address"];
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      "latest-verified-address": latestVerifiedAddress || "",
    },
  };
});

function createApolloClient() {
  const httpLink = new HttpLink({
    uri: "https://sea-lion-app-j3rts.ondigitalocean.app/graphql",
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        errorPolicy: "all",
      },
    },
    link: authLink.concat(httpLink),
  });
}

type InitialState = NormalizedCacheObject | null;

export function initializeApollo(
  initialState: InitialState = null,
  latestVerifiedAddress: string | null
) {
  const _apolloClient = apolloClient ?? createApolloClient();

  const contextLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        "latest-verified-address": latestVerifiedAddress || "",
      },
    };
  });

  _apolloClient.setLink(
    contextLink.concat(authLink).concat(
      new HttpLink({
        uri: "https://sea-lion-app-j3rts.ondigitalocean.app/graphql",
      })
    )
  );

  if (initialState) {
    const existingCache = _apolloClient.extract();
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }
  if (typeof window === "undefined") return _apolloClient;
  if (!apolloClient) apolloClient = _apolloClient;
  return _apolloClient;
}

export function useApollo(
  initialState: InitialState,
  latestVerifiedAddress: string | null
) {
  const store = useMemo(
    () => initializeApollo(initialState, latestVerifiedAddress),
    [initialState, latestVerifiedAddress]
  );
  return store;
}
