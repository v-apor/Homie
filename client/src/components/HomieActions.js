import React, { useMemo } from "react";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import BlockIcon from "@mui/icons-material/Block";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import { Button, Tooltip, IconButton } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import useHomieInteractions from "../useUserInteractions";
import { CONNECTION_STATUSES } from "../contants";
import Toast from "./Toast";

const HomieActions = ({
  variant = "full",
  user,
  onChange,
  wrapperStyles = {},
}) => {
  const {
    error: actionError,
    loading,
    resetError,
    handleActionClick,
  } = useHomieInteractions({
    user,
  });

  const onFavoriteClick = async () =>
    handleActionClick("addFavorite", onChange);

  const removeFavoriteClick = async () =>
    handleActionClick("removeFavorite", onChange);

  const removeMatchedClick = async () =>
    handleActionClick("removeMatched", onChange);

  const blockClick = async () => handleActionClick("block", onChange);

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

  const actions = [];
  if (!status || status === CONNECTION_STATUSES.IGNORED) {
    actions.push({
      title: "Favorite",
      Icon: ThumbUpOffAltIcon,
      onClick: onFavoriteClick,
    });

    if (status !== CONNECTION_STATUSES.IGNORED) {
      actions.push({
        title: "Ignore",
        Icon: ThumbDownOffAltIcon,
        onClick: removeFavoriteClick,
      });
    }

    actions.push({
      title: "Block",
      Icon: BlockIcon,
      onClick: blockClick,
    });
  } else if (status === CONNECTION_STATUSES.FAVORITE) {
    actions.push({
      title: "Remove Favorite",
      Icon: ThumbDownOffAltIcon,
      onClick: removeFavoriteClick,
    });
    actions.push({
      title: "Block",
      Icon: BlockIcon,
      onClick: blockClick,
    });
  } else if (status === CONNECTION_STATUSES.MATCHED) {
    actions.push({
      title: "Remove Match",
      Icon: PersonOffIcon,
      onClick: removeMatchedClick,
    });
    actions.push({
      title: "Block",
      Icon: BlockIcon,
      onClick: blockClick,
    });
  }

  if (!actions?.length) {
    return <></>;
  }

  return (
    <>
      <Toast
        open={!!actionError}
        handleClose={resetError}
        message={actionError}
        variant="error"
      />
      <Grid
        container
        spacing={variant === "full" ? 2 : 1}
        sx={{ ...wrapperStyles }}
      >
        {actions.map(({ title, Icon, onClick }) => (
          <Grid key={title}>
            {variant === "full" ? (
              <Button
                variant="outlined"
                startIcon={<Icon color="primary" />}
                sx={{
                  border: "2px solid",
                  borderColor: "primary.main",
                }}
                onClick={onClick}
                disabled={loading}
              >
                {title}
              </Button>
            ) : (
              <Tooltip title={title}>
                <IconButton
                  aria-label={title}
                  onClick={onClick}
                  disabled={loading}
                >
                  <Icon color="primary" />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default React.memo(HomieActions);
