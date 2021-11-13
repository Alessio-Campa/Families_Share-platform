import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { Skeleton } from "antd";
import moment from "moment";
import { withRouter } from "react-router-dom";
import * as path from "lodash.get";
import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";
import Avatar from "./Avatar";
import Log from "./Log";

class FamliyMemberItem extends React.Component {
  state = { fetchedChild: false, child: {} };

  componentDidMount() {
    const { memberId, role } = this.props;
    axios
      .get(`/api/users/${memberId}/profile`)
      .then((response) => {
        const member = response.data;
        this.setState({ fetchedMember: true, member });
      })
      .catch((error) => {
        Log.error(error);
        this.setState({
          fetchedMember: true,
          member: {
            image: { path: "" },
            role: "unspecified",
            given_name: "",
            family_name: "",
            child_id: "",
          },
        });
      });
  }

  render() {
    const { language, history, memberId, role } = this.props;
    const { pathname } = history.location;
    const { member, fetchedMember } = this.state;
    const texts = Texts[language].childListItem;
    const route = `/profiles/${memberId}/info`;
    console.log(role)
    return (
      <div
        id="childContainer"
        className="row no-gutters"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.1" }}
      >
        {fetchedMember ? (
          <React.Fragment>
            <div className="col-3-10">
              <Avatar
                thumbnail={path(member, ["image", "path"])}
                route={route}
                className="center"
              />
            </div>
            <div className="col-7-10">
              <div
                role="button"
                tabIndex={-42}
                onClick={() => history.push(route)}
                id="childInfoContainer"
                className="verticalCenter"
              >
                <h1>{`${member.given_name} ${member.family_name}`}</h1>
                <h2>{role}</h2>
              </div>
            </div>
          </React.Fragment>
        ) : (
          <Skeleton avatar active paragraph={{ rows: 1 }} />
        )}
      </div>
    );
  }
}

export default withRouter(withLanguage(FamliyMemberItem));

FamliyMemberItem.propTypes = {
  userId: PropTypes.string,
  language: PropTypes.string,
  history: PropTypes.object,
};
