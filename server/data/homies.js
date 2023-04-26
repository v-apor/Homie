import { CONNECTION_STATUSES } from "../constants.js";
import Connection from "../models/connection.js";
import User from "../models/user.js";
import getFuzzyHomiesSearch from "../queries/getFuzzyHomiesSearch.js";
import getLinkedUsersQuery from "../queries/getLinkedUsersQuery.js";

import { validateLinkedHomiesBody } from "../validators/linkedHomiesValidator.js";
import getUserDetails from "../queries/getUserDetails.js";

// This is fuzzy search. This needs to be properly tested
export const getHomiesFuzzy = async (currentUser) => {
  if (!currentUser) {
    throw { status: 401, message: "Unauthorised request" };
  }

  let feed;

  try {
    feed = await getFuzzyHomiesSearch(currentUser, currentUser.preferences);
  } catch (error) {
    throw { status: 400, message: error.toString() };
  }

  if (!feed) {
    throw { status: 400, message: "Could not fetch homies" };
  }

  return feed;
};

// TODO: Needs Pagination
export const getLinkedHomies = async (currentUser, connectionType, search) => {
  if (!currentUser) {
    throw { status: 401, message: "Unauthorised request" };
  }

  const newValues = validateLinkedHomiesBody({ connectionType, search });
  connectionType = newValues.connectionType;
  search = newValues.search;

  let linkedHomies;

  try {
    linkedHomies = await getLinkedUsersQuery(
      currentUser,
      connectionType,
      search
    );
  } catch (error) {
    throw { status: 400, message: error.toString() };
  }

  if (!linkedHomies) {
    throw { status: 400, message: `Could not fetch ${connectionType} homies` };
  }

  return linkedHomies;
};

export const sendMessage = async (currentUser, homieId, message) => {
  if (!currentUser) {
    throw { status: 401, message: "Unauthorised request" };
  }

  if (!homieId) {
    throw { status: 400, message: "Missing userId" };
  }

  if (!message) {
    throw { status: 400, message: "Missing message" };
  }

  const homie = await User.findById(homieId);

  if (!homie) {
    throw { status: 400, message: "User not found" };
  }

  const connection = await Connection.findByUserIds(homie._id, currentUser._id);

  if (
    !connection ||
    (connection.status === CONNECTION_STATUSES.FAVORITE &&
      connection.createdForUserId.toString() === currentUser._id.toString())
  ) {
    throw { status: 400, message: "Connection not found" };
  }

  connection.messages.push({
    message,
    sentByUserId: currentUser._id,
  });

  await connection.save();

  return connection;
};

export const getHomie = async (currentUser, homieId) => {
  if (!currentUser) {
    throw { status: 401, message: "Unauthorised request" };
  }

  if (!homieId) {
    throw { status: 400, message: "Missing userId" };
  }

  const user = await getUserDetails(currentUser, homieId);

  if (!user) {
    throw { status: 400, message: "User not found" };
  }

  return user;
};