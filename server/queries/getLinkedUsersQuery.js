import { CONNECTION_STATUSES, CONNECTION_TYPES } from "../constants.js";
import { User } from "../models/index.js";

const getLinkedUsersQuery = async (currentUser, connectionType, search) => {
  const pipeline = [];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { firstName: new RegExp(search, "i") },
          { lastName: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
        ],
      },
    });
  }
  pipeline.push({
    $lookup: {
      from: "connections",
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              ...(connectionType === CONNECTION_TYPES.MATCHED
                ? {
                    $and: [
                      { $eq: ["$status", CONNECTION_STATUSES.MATCHED] },
                      {
                        $or: [
                          {
                            $and: [
                              { $eq: ["$createdByUserId", currentUser._id] },
                              { $eq: ["$createdForUserId", "$$userId"] },
                            ],
                          },
                          {
                            $and: [
                              { $eq: ["$createdForUserId", currentUser._id] },
                              { $eq: ["$createdByUserId", "$$userId"] },
                            ],
                          },
                        ],
                      },
                    ],
                  }
                : connectionType === CONNECTION_TYPES.FAVORITES
                ? {
                    $and: [
                      { $eq: ["$status", CONNECTION_STATUSES.FAVORITE] },
                      { $eq: ["$createdByUserId", currentUser._id] },
                      { $eq: ["$createdForUserId", "$$userId"] },
                    ],
                  }
                : connectionType === CONNECTION_TYPES.IGNORED
                ? {
                    $or: [
                      {
                        $and: [
                          {
                            $eq: ["$status", CONNECTION_STATUSES.BOTH_IGNORED],
                          },
                          {
                            $or: [
                              {
                                $and: [
                                  {
                                    $eq: ["$createdByUserId", currentUser._id],
                                  },
                                  { $eq: ["$createdForUserId", "$$userId"] },
                                ],
                              },
                              {
                                $and: [
                                  {
                                    $eq: ["$createdForUserId", currentUser._id],
                                  },
                                  { $eq: ["$createdByUserId", "$$userId"] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ["$status", CONNECTION_STATUSES.IGNORED] },
                          { $eq: ["$createdByUserId", currentUser._id] },
                          { $eq: ["$createdForUserId", "$$userId"] },
                        ],
                      },
                    ],
                  }
                : connectionType === CONNECTION_TYPES.ADMIRERS
                ? {
                    $and: [
                      { $eq: ["$status", CONNECTION_STATUSES.FAVORITE] },
                      { $eq: ["$createdForUserId", currentUser._id] },
                      { $eq: ["$createdByUserId", "$$userId"] },
                    ],
                  }
                : {}),
            },
          },
        },
      ],
      as: "connection",
    },
  });
  pipeline.push({
    $match: {
      "connection._id": { $exists: true },
      _id: { $ne: currentUser._id },
    },
  });
  pipeline.push({
    $addFields: { connection: { $arrayElemAt: ["$connection", 0] } },
  });
  pipeline.push({
    $lookup: {
      from: "images",
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$imageableId", currentUser._id] },
                { $eq: ["$imageableType", "User"] },
              ],
            },
          },
        },
      ],
      as: "images",
    },
  });

  return User.aggregate(pipeline);
};

export default getLinkedUsersQuery;
