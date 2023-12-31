import React, { useMemo } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
// import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
// import MoreVertIcon from "@mui/icons-material/MoreVert";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import { Box, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { NoImage } from "../assets";
import { getFullName } from "../utils";
import { CONNECTION_STATUSES } from "../contants";

import Toast from "./Toast";
import useHomieInteractions from "../useUserInteractions";
import HomieActions from "./HomieActions";
import NameAvatar from "./NameAvatar";
import DisplayImage from "./DisplayImage";

const HomieCard = ({
  user,
  variant = "large",
  matchedPreferences,
  onActionsClick,
}) => {
  const isLarge = variant === "large";

  const { error, resetError, handleActionClick } = useHomieInteractions({
    user,
  });

  const onFavoriteClick = async () =>
    handleActionClick("addFavorite", onActionsClick);

  const removeFavoriteClick = async () =>
    handleActionClick("removeFavorite", onActionsClick);

  const status = useMemo(() => {
    if (!user) return;
    if (!user.connection) return;

    if (
      user.connection.currentUser.status === CONNECTION_STATUSES.FAVORITE &&
      user.connection.otherUser.status === CONNECTION_STATUSES.FAVORITE
    ) {
      return CONNECTION_STATUSES.MATCHED;
    }

    return user.connection?.currentUser?.status;
  }, [user]);

  return (
    <Card elevation={4}>
      <Toast
        open={error}
        handleClose={resetError}
        message={error}
        variant="error"
      />
      <CardHeader
        avatar={<NameAvatar user={user} isLarge={isLarge} />}
        title={
          <Link component={RouterLink} to={`/homies/${user._id}`}>
            {getFullName(user)}
          </Link>
        }
        subheader={isLarge ? `${user.gender} | ${user.age} YO` : null}
        titleTypographyProps={{ variant: "body1" }}
      />
      {isLarge ? (
        <Box
          display="flex"
          alignItems="center"
          width="100%"
          position="relative"
        >
          {!status || status === CONNECTION_STATUSES.IGNORED ? (
            <Box
              width="60px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="absolute"
              left="0"
              backgroundColor="rgb(217, 226, 213, 0.5)"
              height="100%"
              sx={{
                transition: "0.5s",
                "&:hover": { boxShadow: 1 },
              }}
            >
              <ThumbDownOffAltIcon
                sx={{
                  padding: "4px",
                  "&:hover": { animation: "flickerAnimation 1.5s infinite" },
                }}
                cursor="pointer"
                onClick={removeFavoriteClick}
                color="primary"
              />
            </Box>
          ) : (
            <></>
          )}
          <DisplayImage
            image={
              user.images?.length
                ? user.images[0]
                : { url: NoImage, id: "no-image" }
            }
            height={isLarge ? 350 : 100}
          />
          {!status || status === CONNECTION_STATUSES.IGNORED ? (
            <Box
              width="60px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="absolute"
              right="0"
              backgroundColor="rgb(217, 226, 213, 0.5)"
              height="100%"
              sx={{
                transition: "0.5s",
                "&:hover": { boxShadow: 1 },
              }}
            >
              <ThumbUpOffAltIcon
                sx={{
                  padding: "4px",
                  "&:hover": { animation: "flickerAnimation 1.5s infinite" },
                }}
                cursor="pointer"
                onClick={onFavoriteClick}
                color="primary"
              />
            </Box>
          ) : (
            <></>
          )}
        </Box>
      ) : (
        <DisplayImage
          image={
            user.images?.length
              ? user.images[0]
              : { url: NoImage, id: "no-image" }
          }
          height="100"
        />
      )}

      {isLarge && matchedPreferences?.length ? (
        <CardContent>
          <Typography variant="body1" color="primary">
            Matched Preferences: {matchedPreferences.join(", ")}
          </Typography>
        </CardContent>
      ) : (
        <></>
      )}
      <CardActions disableSpacing>
        <HomieActions user={user} variant="small" onChange={onActionsClick} />
      </CardActions>
    </Card>
  );
};

export default React.memo(HomieCard);
