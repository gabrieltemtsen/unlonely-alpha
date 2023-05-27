import { User } from "@prisma/client";

import { Context } from "../../context";
// import publishCast from "../../utils/publishCast";
import verifyCast from "../../utils/farcaster/verifyCast";

export interface IPostChatInput {
  channelId: number;
  text: string;
}

export interface IPostChatByAwsIdInput {
  awsId: string;
  text: string;
}

export const postFirstChat = (
  data: IPostChatInput,
  user: User,
  ctx: Context
) => {
  return ctx.prisma.chat.create({
    data: {
      text: data.text,
      owner: {
        connect: { address: user.address },
      },
      channel: {
        connect: { id: data.channelId },
      },
    },
  });
};

export const postChatByAwsId = async (
  data: IPostChatByAwsIdInput,
  user: User,
  ctx: Context
) => {
  const channel = await ctx.prisma.channel.findUnique({
    where: {
      awsId: data.awsId,
    },
  });

  // If the channel does not exist, throw an error
  if (!channel) {
    throw new Error(`Channel with AWS ID: ${data.awsId} not found`);
  }

  // If channel exists, add a chat to it
  const newChat = await ctx.prisma.chat.create({
    data: {
      text: data.text,
      owner: {
        connect: { address: user.address },
      },
      channel: {
        connect: { id: channel.id },
      },
    },
  });

  return newChat;
};

export interface IGetChatInput {
  channelId: number;
  limit: number;
}

export const getRecentChats = async (data: IGetChatInput, ctx: Context) => {
  return ctx.prisma.chat.findMany({
    where: {
      channelId: data.channelId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: data.limit,
  });
};

export const firstChatExists = async (user: User, ctx: Context) => {
  const data = await ctx.prisma.chat.findFirst({
    where: {
      owner: {
        address: user.address,
      },
    },
  });
  return !data;
};

export const getOwner = (
  { ownerAddr }: { ownerAddr: string },
  ctx: Context
) => {
  return ctx.prisma.user.findUnique({ where: { address: ownerAddr } });
};

// export const chatbot = async (ctx: Context) => {
//   // run all this below code once every 30 seconds
//   while (true) {
//     // return all chats from the last 30 seconds
//     const data = await ctx.prisma.chat.findMany({
//       where: {
//         createdAt: {
//           gte: new Date(Date.now() - 30 * 1000),
//         },
//       },
//     });
//     console.log("1: get data", data);
//     // randomize the order of the chats, then check that verifyCast(chat.text) is true. if not true, try another chat
//     const shuffled = data.sort(() => 0.5 - Math.random());
//     let i = 0;
//     while (i < shuffled.length) {
//       if (verifyCast(shuffled[i].text)) {
//         console.log("2: verified text", shuffled[i].text);
//         publishCast(shuffled[i].text);
//       }
//       i++;
//     }

//     // wait 30 seconds
//     await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
//   }
// };
