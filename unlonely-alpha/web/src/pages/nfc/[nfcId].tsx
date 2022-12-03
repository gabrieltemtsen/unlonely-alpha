import { GetServerSidePropsContext } from "next";
import { gql, useQuery } from "@apollo/client";

import { Flex } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/react";
import { NfcDetailQuery } from "../../generated/graphql";
import AppLayout from "../../components/layout/AppLayout";
import NfcDetailCard from "../../components/NFCs/NfcDetail";
import NfcList from "../../components/NFCs/NfcList";
import NfcCardSkeleton from "../../components/NFCs/NfcCardSkeleton";

type UrlParams = {
  nfcId: string;
};

const NFC_DETAIL_QUERY = gql`
  query NFCDetail($id: ID!) {
    getNFC(id: $id) {
      id
      title
      videoLink
      openseaLink
      videoThumbnail
      updatedAt
      owner {
        address
        FCImageUrl
        username
      }
    }
  }
`;

const NFC_RECOMMENDATIONS_QUERY = gql`
  query NFCRecommendations($data: NFCFeedInput!) {
    getNFCFeed(data: $data) {
      createdAt
      id
      videoLink
      owner {
        username
        address
        FCImageUrl
        powerUserLvl
        videoSavantLvl
      }
      title
    }
  }
`;

const NfcDetail = ({ nfcId }: UrlParams) => {
  const { data, loading, error } = useQuery<NfcDetailQuery>(
    NFC_DETAIL_QUERY,
    {
      variables: { id: nfcId },
    }
  );

  const {
    data: dataNFCs,
    loading: loadingNFCs,
    error: errorNFCs,
  } = useQuery(NFC_RECOMMENDATIONS_QUERY, {
    variables: {
      data: {
        limit: 9,
        orderBy: null,
      },
    },
  });

  const nfc = data?.getNFC;
  const nfcs = dataNFCs?.getNFCFeed;

  return (
    <>
      <AppLayout title={nfc?.title} image={nfc?.videoThumbnail}>
        <Flex justifyContent="center" mt="5rem" direction="column">
            {!nfc || loading ? (
              <Flex width="100%" justifyContent="center">
                <Spinner />
              </Flex>
            ) : (
              <Flex width="100%" justifyContent="center">
                <NfcDetailCard nfc={nfc} />
              </Flex>
            )}
          {!nfcs || loadingNFCs ? (
            <Flex
            direction="row"
            overflowX="scroll"
            width="100%"
            height="18rem"
            p="5rem"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <NfcCardSkeleton />
            ))}
          </Flex>
          ) : (
            <Flex
                    direction="row"
                    overflowX="scroll"
                    overflowY="clip"
                    width="100%"
                    height={{
                      base: "14rem",
                      sm: "18rem",
                      md: "18rem",
                      lg: "18rem",
                    }}
                  >
                    <NfcList nfcs={nfcs} />
                  </Flex>
          )}
          </Flex>
      </AppLayout>
    </>
  );
};

export default NfcDetail;

export async function getServerSideProps(
  context: GetServerSidePropsContext<UrlParams>
) {
  const { nfcId } = context.params!;

  return { props: { nfcId } };
}
