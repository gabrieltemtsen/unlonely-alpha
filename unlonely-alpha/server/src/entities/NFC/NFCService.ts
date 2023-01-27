import { User } from "@prisma/client";
import * as AWS from "aws-sdk";

import { Context } from "../../context";
import opensea from "./opensea.json";

export interface IPostNFCInput {
  title: string;
  videoLink: string;
  videoThumbnail: string;
}

export const postNFC = async (
  data: IPostNFCInput,
  ctx: Context,
  user: User
) => {
  return await ctx.prisma.nFC.create({
    data: {
      title: data.title,
      videoLink: data.videoLink,
      videoThumbnail: data.videoThumbnail,
      owner: {
        connect: {
          address: user.address,
        },
      },
    },
  });
};

export const createClip = async () => {
  const channelArn = "arn:aws:ivs:us-west-2:500434899882:channel/8e2oKm7LXNGq";
  const recordingConfigArn =
    "arn:aws:ivs:us-west-2:500434899882:recording-configuration/vQ227qqHmVtp";
  // first call lambda
  const lambda = new AWS.Lambda({
    region: "us-west-2",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  const params = {
    FunctionName: "sendClipToMediaConvert",
    Payload: JSON.stringify({
      detail: {
        "channel-arn": channelArn,
        "recording-config-arn": recordingConfigArn,
      },
    }),
  };

  let lambdaResponse: any;
  try {
    lambdaResponse = await lambda.invoke(params).promise();
    console.log(lambdaResponse);
    const response = JSON.parse(lambdaResponse.Payload);
    // if response contains "errorMessage" field, then there was an error and return message
    if (response.errorMessage) {
      return { errorMessage: response.errorMessage };
    }
    const url = response.body.url;
    const thumbnail = response.body.thumbnail;
    return { url, thumbnail };
  } catch (e) {
    console.log(e);
    lambdaResponse = "Error invoking lambda";
  }
  if (lambdaResponse === "Error invoking lambda") {
    return "Error invoking lambda";
  }
};

export interface IGetNFCFeedInput {
  offset: number;
  limit: number;
  orderBy: "createdAt" | "score";
}

export const getNFCFeed = (data: IGetNFCFeedInput, ctx: Context) => {
  if (data.orderBy === "createdAt") {
    return ctx.prisma.nFC.findMany({
      take: data.limit,
      skip: data.offset,
      // where videoLink is not empty
      where: {
        videoLink: {
          not: "",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else if (data.orderBy === "score") {
    return ctx.prisma.nFC.findMany({
      take: data.limit,
      skip: data.offset,
      where: {
        videoLink: {
          not: "",
        },
      },
      orderBy: {
        score: "desc",
      },
    });
  }
};

export const getNFC = ({ id }: { id: number }, ctx: Context) => {
  return ctx.prisma.nFC.findUnique({
    where: { id: Number(id) },
  });
};

export const getOwner = (
  { ownerAddr }: { ownerAddr: string },
  ctx: Context
) => {
  return ctx.prisma.user.findUnique({ where: { address: ownerAddr } });
};

export const openseaNFCScript = async (ctx: Context) => {
  // where videoThumbnail is empty
  const nfc = await ctx.prisma.nFC.findMany({
    where: {
      openseaLink: {
        equals: "",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const assets = opensea.assets;
  console.log("num of NFCs ", assets.length);

  // compare each nfc to each opensea asset where nfc.title === asset.name and update nfc.videoLink and nfc.videoThumbnail
  try {
    for (let i = 0; i < nfc.length; i++) {
      for (let j = 0; j < assets.length; j++) {
        if (nfc[i].title?.trim() === assets[j].name?.trim()) {
          console.log("match found", nfc[i].title, assets[j].name);
          await ctx.prisma.nFC.update({
            where: {
              id: nfc[i].id,
            },
            data: {
              videoLink: assets[j].animation_url,
              videoThumbnail: assets[j].image_thumbnail_url,
              openseaLink: assets[j].permalink,
            },
          });
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};
