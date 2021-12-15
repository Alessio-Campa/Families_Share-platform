import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import BottomNavigation from "@material-ui/core/BottomNavigation";
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";
import Images from "../Constants/Images";

const muiTheme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  overrides: {
    MuiBottomNavigation: {
      root: {
        position: "fixed",
        bottom: 0,
        height: "5.6rem",
        backgroundColor: "#00838F",
        width: "100%",
        zIndex: 100,
      },
    },
    MuiBottomNavigationAction: {
      root: {
        minWidth: 0,
        maxWidth: 100000,
      },
      label: {
        color: "white",
        fontSize: "1.2rem",
        "&$selected": {
          fontSize: "1.2rem",
        },
      },
    },
    MuiButtonBase: {
      disabled: {
        opacity: 0.1,
      },
    },
  },
});

const ActivityNavbar = (props) => {
  const { history, language, match, allowNavigation } = props;
  const handleChange = (event, value) => {
    const { groupId, activityId } = match.params;
    if (allowNavigation)
      history.replace(`/groups/${groupId}/activities/${activityId}/${value}`);
  };
  const texts = Texts[language].groupNavbar;

  const { pathname } = history.location;
  const activeTab = pathname.slice(
    pathname.lastIndexOf("/") + 1,
    pathname.length
  );
  const disabled = !allowNavigation;
  return (
    <MuiThemeProvider theme={muiTheme}>
      <BottomNavigation value={activeTab} onChange={handleChange} showLabels>
        <BottomNavigationAction
          value=""
          label={texts.infoTab}
          icon={
            activeTab !== "chat" ? (
              <i className="fas fa-info-circle groupNavbarIcon" />
            ) : (
              <img
                src={Images.infoCircleRegular}
                alt=""
                className="infoCircleRegular"
              />
            )
          }
        />
        <BottomNavigationAction
          value="chat"
          disabled={disabled}
          label={texts.chatTab}
          icon={
            activeTab === "chat" ? (
              <i className="fas fa-envelope groupNavbarIcon" />
            ) : (
              <i className="far fa-envelope groupNavbarIcon" />
            )
          }
        />
      </BottomNavigation>
    </MuiThemeProvider>
  );
};

ActivityNavbar.propTypes = {
  allowNavigation: PropTypes.bool,
  history: PropTypes.object,
  language: PropTypes.string,
  match: PropTypes.object,
};

export default withRouter(withLanguage(ActivityNavbar));
