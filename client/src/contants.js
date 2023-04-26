export const CONNECTION_TYPES = {
  MATCHED: "Matched",
  FAVORITES: "Favorites",
  IGNORED: "Ignored",
  ADMIRERS: "Admirers",
};

export const CONNECTION_STATUSES = {
  FAVORITE: "favorite",
  MATCHED: "matched",
  IGNORED: "ignored",
  BLOCKED: "blocked",
};

export const CONNECTION_TYPES_TO_STATUSES = {
  [CONNECTION_TYPES.MATCHED]: CONNECTION_STATUSES.MATCHED,
  [CONNECTION_TYPES.FAVORITES]: CONNECTION_STATUSES.FAVORITE,
  [CONNECTION_TYPES.IGNORED]: CONNECTION_STATUSES.IGNORED,
  [CONNECTION_TYPES.ADMIRERS]: null,
};