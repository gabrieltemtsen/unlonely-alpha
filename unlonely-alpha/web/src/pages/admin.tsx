import {
  Button,
  Flex,
  Input,
  Spinner,
  Switch,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import { useUser } from "../hooks/context/useUser";
import AdminNotifications from "../components/general/AdminNotifications";
import useDeleteChannel from "../hooks/server/useDeleteChannel";

const admins = process.env.NEXT_PUBLIC_ADMINS?.split(",");

export default function AdminPage() {
  const { user } = useUser();

  const isAdmin = useMemo(() => {
    if (admins !== undefined && user?.address) {
      const userAddress = user.address;
      return admins.some((admin) => userAddress === admin);
    }
    return false;
  }, [user, admins]);

  return (
    <AppLayout isCustomHeader={false}>
      {isAdmin && <AdminContent />}
      {!isAdmin && <Text>You're not supposed to be here.</Text>}
    </AppLayout>
  );
}

const AdminContent = () => {
  const toast = useToast();

  const [channelSlugToDelete, setChannelSlugToDelete] = useState<string>("");
  const [softDeleteChannelSlug, setSoftDeleteChannelSlug] =
    useState<boolean>(true);

  const { deleteChannel, loading: deleteChannelLoading } = useDeleteChannel({
    onSuccess: () => {
      toast({
        title: "Success",
        description: softDeleteChannelSlug
          ? "Channel soft deleted"
          : "Channel deleted",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setChannelSlugToDelete("");
      setSoftDeleteChannelSlug(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete channel",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  return (
    <Flex direction="column" p="10px" gap="20px" bg="#131323">
      <Text fontSize="25px" fontFamily="Neue Pixel Sans">
        delete channel
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>slug</Text>
          <Input
            variant="glow"
            width="300px"
            isInvalid={channelSlugToDelete.length === 0}
            value={channelSlugToDelete}
            onChange={(e) => setChannelSlugToDelete(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>soft delete?</Text>
          <Switch
            isChecked={softDeleteChannelSlug}
            onChange={() => setSoftDeleteChannelSlug((prev) => !prev)}
          />
        </VStack>
        {deleteChannelLoading ? (
          <Spinner />
        ) : (
          <Button
            color="white"
            bg="#2562db"
            _hover={{}}
            _focus={{}}
            _active={{}}
            onClick={() =>
              deleteChannel({
                slug: channelSlugToDelete,
                softDelete: softDeleteChannelSlug,
              })
            }
            isDisabled={channelSlugToDelete.length === 0}
          >
            Send
          </Button>
        )}
      </Flex>
      <Text fontSize="25px" fontFamily="Neue Pixel Sans">
        admin notifications
      </Text>
      <AdminNotifications />
    </Flex>
  );
};
