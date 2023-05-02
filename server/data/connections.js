import { isValidObjectId } from "mongoose";
import Connection from "../models/connection.js";

export const findByUserIds = (currentUserId, otherUserId) => {
  if (!currentUserId || !otherUserId) {
    throw new Error("Invalid user ids!");
  }

  return Connection.findOne({
    $and: [
      {
        users: {
          $elemMatch: {
            userId: currentUserId,
          },
        },
      },
      {
        users: {
          $elemMatch: {
            userId: otherUserId,
          },
        },
      },
    ],
  });
};

export const getAllConnections = async () => {
  const connections = await Connection.find({});
  return connections;
};

export const getConnectionByCreatedForUserId = async (userId) => {
  if (!isValidObjectId(userId)) {
    throw { status: 400, message: "Error: Invalid User Id" };
  }

  const connection = await Connection.findOne(
    { createdForUserId: userId },
    "-__v"
  );
  return connection;
};

export const createConnection = async (createdForUserId, createdByUserId) => {
  if (!isValidObjectId(createdByUserId) || !isValidObjectId(createdForUserId)) {
    throw { status: 400, message: "Error: Invalid User Id" };
  }

  const connection = await Connection.create({
    createdByUserId: createdByUserId,
    createdForUserId: createdForUserId,
  });

  return connection;
};

export const addFavorite = async (userId, userBeingViewedId) => {
  try {
    const connection = await Connection.findByUserIds(
      userId,
      userBeingViewedId
    );
    if (connection) {
      const currentUserIndex = connection.users.findIndex(
        (user) => user.userId.toString() === userId
      );
      connection.users[currentUserIndex].status = "favorite";
      await connection.save();
    } else {
      const newConnection = new Connection({
        users: [
          { userId, status: "favorite" },
          { userId: userBeingViewedId, status: null },
        ],
      });
      await newConnection.save();
    }
  } catch (err) {
    console.error(err);
  }
};

export const swapConnectionUsers = async (connection) => {
  if (
    !connection ||
    !connection.createdByUserId ||
    !connection.createdForUserId
  ) {
    throw { status: 400, message: "Error: Invalid connection object" };
  }

  const temp = connection.createdByUserId;
  connection.createdByUserId = connection.createdForUserId;
  connection.createdForUserId = temp;
  return connection.save();
};

export const removeFavorite = async (user, userBeingViewed) => {
  try {
    const connection = await findConnection(user, userBeingViewed);

    if (!isValidObjectId(userBeingViewed) || !isValidObjectId(user)) {
      throw { status: 400, message: "Error: Invalid user ID" };
    }

    if (connection) {
      if (connection.status === "ignored") {
        connection.status = "both_ignored";
        await connection.save();
        return connection;
      } else if (connection.status === "favorite") {
        const swappedConnection = await swapConnectionUsers(connection);
        swappedConnection.status = "ignored";
        swappedConnection.save();
        return swappedConnection;
      } else {
        // Change this
        throw { status: 500, message: "Invalid connection status" };
      }
    } else {
      const newConnection = await createConnection(userBeingViewed, user);
      newConnection.status = "ignored";
      await newConnection.save();
      return newConnection;
    }
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "Internal server error",
    };
  }
};
