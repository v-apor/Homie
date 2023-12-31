import { ObjectId } from "bson";
import { User } from "../models/index.js";
import { CONNECTION_STATUSES } from "../constants.js";

const getUserDetails = async (currentUser, homieId) => {
  const aggregateResult = await User.aggregate([
    {
      $match: {
        _id: new ObjectId(homieId),
      },
    },
    {
      $limit: 1,
    },
    {
      $addFields: {
        age: {
          $subtract: [
            {
              $dateDiff: {
                startDate: "$dateOfBirth",
                endDate: "$$NOW",
                unit: "year",
              },
            },
            {
              $cond: {
                if: {
                  $gte: [
                    {
                      $dateFromParts: {
                        year: { $year: "$$NOW" },
                        month: { $month: "$dateOfBirth" },
                        day: { $dayOfMonth: "$dateOfBirth" },
                      },
                    },
                    "$$NOW",
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "connections",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  // users records size should be 2
                  { $eq: [{ $size: "$users" }, 2] },
                  // users array should have 2 objects with userId. Each userId should equal to current user and other user
                  {
                    $eq: [
                      {
                        $size: {
                          $filter: {
                            input: "$users",
                            as: "user",
                            cond: {
                              $eq: ["$$user.userId", currentUser._id],
                            },
                          },
                        },
                      },
                      1,
                    ],
                  },
                  {
                    $eq: [
                      {
                        $size: {
                          $filter: {
                            input: "$users",
                            as: "user",
                            cond: {
                              $ne: ["$$user.userId", "$$userId"],
                            },
                          },
                        },
                      },
                      1,
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              currentUser: {
                $cond: {
                  if: {
                    $eq: [
                      { $arrayElemAt: ["$users.userId", 0] },
                      currentUser._id,
                    ],
                  },
                  then: {
                    $arrayElemAt: ["$users", 0],
                  },
                  else: {
                    $arrayElemAt: ["$users", 1],
                  },
                },
              },
              otherUser: {
                $cond: {
                  if: {
                    $eq: [
                      { $arrayElemAt: ["$users.userId", 0] },
                      currentUser._id,
                    ],
                  },
                  then: {
                    $arrayElemAt: ["$users", 1],
                  },
                  else: {
                    $arrayElemAt: ["$users", 0],
                  },
                },
              },
              messages: 1,
              hasUnreadMessages: 1,
            },
          },
        ],
        as: "connection",
      },
    },
    {
      $lookup: {
        from: "homes",
        let: { homeOwnerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$homeOwnerId"] },
                  { $eq: ["$listed", true] },
                ],
              },
            },
          },
        ],
        as: "homes",
      },
    },
    {
      $lookup: {
        from: "images",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$imageableId", new ObjectId(homieId)] },
                  { $eq: ["$imageableType", "User"] },
                ],
              },
            },
          },
        ],
        as: "images",
      },
    },
    {
      $unwind: {
        path: "$connection",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        isMatched: {
          $cond: {
            if: {
              $and: [
                {
                  $eq: [
                    "$connection.otherUser.status",
                    CONNECTION_STATUSES.FAVORITE,
                  ],
                },
                {
                  $eq: [
                    "$connection.currentUser.status",
                    CONNECTION_STATUSES.FAVORITE,
                  ],
                },
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        myContactsVisible: 1,
        email: {
          $cond: {
            if: {
              $and: [
                { $eq: ["$connection.otherUser.showUserData", true] },
                { $eq: ["$isMatched", true] },
              ],
            },
            then: "$email",
            else: "",
          },
        },
        phone: {
          $cond: {
            if: {
              $and: [
                { $eq: ["$connection.otherUser.showUserData", true] },
                { $eq: ["$isMatched", true] },
              ],
            },
            then: "$phone",
            else: "",
          },
        },
        age: 1,
        location: 1,
        gender: 1,
        preferences: 1,
        homes: 1,
        images: 1,
        connection: 1,
        bio: 1,
        dateOfBirth: 1,
      },
    },
  ]).exec();

  if (!aggregateResult || !aggregateResult.length) {
    throw { status: 400, message: "User not found" };
  }

  return aggregateResult[0];
};

export default getUserDetails;
