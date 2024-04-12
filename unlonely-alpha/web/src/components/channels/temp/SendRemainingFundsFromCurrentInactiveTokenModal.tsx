import { Button, Flex, Input, Spinner, Text } from "@chakra-ui/react";
import { isAddress } from "viem";
import { useChannelContext } from "../../../hooks/context/useChannel";
import { TransactionModalTemplate } from "../../transactions/TransactionModalTemplate";
import { useSendRemainingFundsToWinnerState } from "../../../hooks/internal/temp-token/useSendRemainingFundsToWinnerState";

export const SendRemainingFundsFromCurrentInactiveTokenModal = ({
  title,
  handleClose,
  isOpen,
  callbackOnTxSuccess,
}: {
  title: string;
  handleClose: () => void;
  isOpen: boolean;
  callbackOnTxSuccess: () => void;
}) => {
  const { channel } = useChannelContext();
  const { currentTempTokenContract } = channel;

  const {
    sendRemainingFundsToWinnerAfterTokenExpiration,
    sendRemainingFundsToWinnerAfterTokenExpirationTxLoading,
    handleWinnerAddressChange,
    winnerAddress,
  } = useSendRemainingFundsToWinnerState(
    currentTempTokenContract,
    callbackOnTxSuccess
  );

  return (
    <TransactionModalTemplate
      title={title}
      handleClose={handleClose}
      isOpen={isOpen}
      hideFooter
      bg={"#18162F"}
    >
      <Flex direction="column" gap="5px">
        <Text>Please provide an address to send it</Text>
        <Input
          variant="glow"
          value={winnerAddress}
          onChange={(e) => handleWinnerAddressChange(e.target.value)}
        />
        <Button
          isDisabled={
            !isAddress(winnerAddress) ||
            sendRemainingFundsToWinnerAfterTokenExpirationTxLoading ||
            !sendRemainingFundsToWinnerAfterTokenExpiration
          }
          onClick={sendRemainingFundsToWinnerAfterTokenExpiration}
        >
          {sendRemainingFundsToWinnerAfterTokenExpirationTxLoading ? (
            <Spinner />
          ) : (
            "send"
          )}
        </Button>
      </Flex>
    </TransactionModalTemplate>
  );
};