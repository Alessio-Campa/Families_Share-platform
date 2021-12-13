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

const getFamily = (familyId) => {
  return axios.get(`/api/family/${familyId}`).then( response => {
    console.log(response.data)
    return response.data;
  }).catch(err => {
    console.error(err);
    return {}
  })
}

class FamilyListItem extends React.Component {
  constructor (props) {
    super(props);
    const {familyId} = this.props;
    const userId = JSON.parse(localStorage.getItem("user")).id;
    this.state = {
      familyId: familyId,
      userId,
    }
  }

  async componentDidMount() {
    const { familyId } = this.state;
    this.family = await getFamily(familyId);

    this.setState({family: this.family})
  }

  render() {
    let family = this.state.family
    const { history, familyId } = this.props;
    const { pathname } = history.location;
    const familyRoute = `/family/${familyId}/calendar`
    console.log(familyRoute)
    const route = `${pathname}/${familyId}`;
    return (
      <div
        id="childContainer"
        className="row no-gutters"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.1" }}
        onClick = {() => history.push(familyRoute)}>
        
        {family ? (
          <React.Fragment>
            <div className="col-3-10">
              <Avatar
                // thumbnail={path(child, ["image", "path"])}
                route={route}
                className="center"
              />
            </div>
            <div className="col-7-10">
              <div
                role="button"
                tabIndex={-42}
                id="childInfoContainer"
                className="verticalCenter"
              >
                <h1>{family.name}</h1>
                <h2>numero di persone: {family.members.length}</h2>
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

export default withRouter(withLanguage(FamilyListItem));

/*
FamilyListItem.propTypes = {
  childId: PropTypes.string,
  userId: PropTypes.string,
  language: PropTypes.string,
  history: PropTypes.object,
};
*/
