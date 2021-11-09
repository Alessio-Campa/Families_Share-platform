/*
import React from "react";
import PropTypes from "prop-types";
import * as path from "lodash.get";
import withLanguage from "./LanguageContext";
import Texts from "../Constants/Texts";

const getFamilies = () => {
  
}


export default class Families extends React.Component {
    render() {
      return <h1> Lista delle famiglie </h1>
    }
}
*/

import React from "react";
import PropTypes from "prop-types";
import Fab from "@material-ui/core/Fab";
import { withStyles } from "@material-ui/core/styles";
import ChildListItem from "./ChildListItem";
import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";

const styles = () => ({
  add: {
    position: "fixed",
    bottom: "5%",
    right: "5%",
    height: "5rem",
    width: "5rem",
    borderRadius: "50%",
    border: "solid 0.5px #999",
    backgroundColor: "#ff6f00",
    zIndex: 100,
    fontSize: "2rem",
  },
});

class Families extends React.Component {
  constructor(props) {
    super(props);
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const { profileId, usersChildren } = this.props;
    const myProfile = userId === profileId;
    this.state = {
      myProfile,
      children: usersChildren,
      profileId,
    };
  }

  addFamily = () => {
    const { history } = this.props;
    const { pathname } = history.location;
    history.push(`${pathname}/create`);
  };

  render() {
    const { classes, language } = this.props;
    const { children, profileId, myProfile } = this.state;
    const texts = Texts[language].profileChildren;
    return (
      <React.Fragment>
        <Fab
          color="primary"
          aria-label="Add"
          className={classes.add}
          onClick={this.addChild}
        >
          <i className="fas fa-child" />
        </Fab>
      </React.Fragment>
    );
  }
}
/*

Families.propTypes = {
  usersChildren: PropTypes.array,
  profileId: PropTypes.string,
  history: PropTypes.object,
  classes: PropTypes.object,
  language: PropTypes.string,
};*/

export default withStyles(styles)(withLanguage(Families));



/*
const ProfileInfo = ({ language, profile }) => {
  const texts = Texts[language].profileInfo;
  return (
    <div>
      <div className="row no-gutters profileInfoContainer">
        <div className="col-2-10">
          <i className="fas fa-phone center" />
        </div>
        <div className="col-8-10">
          <div className="verticalCenter">
            <h1>{profile.phone}</h1>
            <h2>{texts[profile.phone_type]}</h2>
          </div>
        </div>
      </div>
      <div className="row no-gutters  profileInfoContainer">
        <div className="col-2-10">
          <i className="fas fa-map-marker-alt center" />
        </div>
        <div className="col-8-10">
          <div className="verticalCenter">
            <h1>
              {`${path(profile, ["address", "street"])} ${path(profile, [
                "address",
                "number",
              ])}`}
            </h1>
            <h2>{texts.adress}</h2>
          </div>
        </div>
      </div>
      <div className="row no-gutters  profileInfoContainer">
        <div className="col-2-10">
          <i className="fas fa-envelope center" />
        </div>
        <div className="col-8-10">
          <div className="verticalCenter">
            <h1>{profile.email}</h1>
            <h2>{texts.email}</h2>
          </div>
        </div>
      </div>
      <div className="row no-gutters  profileInfoContainer">
        <div className="col-2-10">
          <i className="fas fa-info-circle center" />
        </div>
        <div className="col-8-10">
          <div className="verticalCenter">
            <h1>{profile.description}</h1>
            <h2>{texts.description}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};


ProfileInfo.propTypes = {
  profile: PropTypes.object,
  language: PropTypes.string,
};
*/
