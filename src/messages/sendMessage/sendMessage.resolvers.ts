import client from "../../client";
import { Context } from "./../../server";
import { protectedResolver } from "./../../users/users.utils";

interface SendMessageInput {
  payload: string;
  roomId: number;
  userId: number;
}

const ResolverFn = async (
  _: any,
  { payload, roomId, userId }: SendMessageInput,
  { loggedInUser }: Context
) => {
  let room = null;
  if (userId) {
    const user = await client.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });
    if (!user) {
      return {
        ok: false,
        error: "This user does not exist.",
      };
    }
    room = await client.room.create({
      data: {
        users: {
          connect: [
            {
              id: userId,
            },
            {
              id: loggedInUser?.id,
            },
          ],
        },
      },
    });
  } else if (roomId) {
    room = await client.room.findUnique({
      where: {
        id: roomId,
      },
      select: {
        id: true,
      },
    });
    if (!room) {
      return {
        ok: false,
        error: "Room not found.",
      };
    }
  }
  await client.message.create({
    data: {
      payload,
      room: {
        connect: {
          id: room?.id,
        },
      },
      user: {
        connect: {
          id: loggedInUser?.id,
        },
      },
    },
  });
  return {
    ok: true,
  };
};

export default {
  Mutation: {
    sendMessage: protectedResolver(ResolverFn),
  },
};
