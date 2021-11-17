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

const FamilyNavbar = ({ history, language, match }) => {
  const handleChange = (event, value) => {
    const { familyId } = match.params;
    history.replace(`/family/${familyId}/${value}`);
  };
  const texts = Texts[language].groupNavbar;

  const { pathname } = history.location;
  let activeTab = pathname.slice(
    pathname.lastIndexOf("/") + 1,
    pathname.length
  );
  console.log('activeTab: ' + activeTab)
  const flags = [
    activeTab === "calendar",
    activeTab === "members",
  ];
  return (
    <MuiThemeProvider theme={muiTheme}>
      <BottomNavigation value={activeTab} onChange={handleChange} showLabels>
        <BottomNavigationAction
          value="calendar"
          // disabled={disabled}
          label={texts.calendarTab}
          icon={
            flags[0] ? (
              <i className="fas fa-calendar groupNavbarIcon" />
            ):(
              <i className="far fa-calendar groupNavbarIcon" />
            )}
        />
        <BottomNavigationAction
        value="members"
        label={texts.membersTab}
        icon={
          flags[1] ? (
            <i className="fas fa-user-friends groupNavbarIcon" />
          ):(
            <img
              alt=""
              src={Images.userFriendsRegular}
              className="userFriendsRegular"
            />
          )
        }
        />
      </BottomNavigation>
    </MuiThemeProvider>
  );
};

FamilyNavbar.propTypes = {
  allowNavigation: PropTypes.bool,
  history: PropTypes.object,
  language: PropTypes.string,
  match: PropTypes.object,
};

export default withRouter(withLanguage(FamilyNavbar));
