import { PrismaClient } from "@prisma/client";

import { getEnsName } from "./ens";
import { lensClient, LENS_GET_DEFAULT_PROFILE } from "./lens/client";

const prisma = new PrismaClient();

export const findOrCreateUser = async ({ address }: { address: string }) => {
  let user = await prisma.user.findUnique({
    where: {
      address: address,
    },
  });

  if (!user) {
    try {
      const username = await getEnsName(address);

      const { data } = await lensClient.query({
        query: LENS_GET_DEFAULT_PROFILE,
        variables: {
          ethereumAddress: address,
        },
      });

      user = await prisma.user.create({
        data: {
          address: address,
          username: username,
          isLensUser: data && data.defaultProfile ? true : false,
          lensHandle:
            data && data.defaultProfile ? data.defaultProfile.handle : "",
          lensImageUrl:
            data && data.defaultProfile
              ? data.defaultProfile.picture.original.url
              : "",
        },
      });
    } catch (e) {
      console.log(e);
    }
  }

  return user;
};
