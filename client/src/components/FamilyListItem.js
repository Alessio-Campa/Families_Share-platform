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

class FamilyListItem extends React.Component {
  state = { fetchedFamily: false, family: {} };

  componentDidMount() {
    const { userId, familyId } = this.props; // childID ????
    
    axios.get('/api/family', {
        params:{familyId: familyId}
      }).then((response) => {
        const family = response.data;
        
        this.setState({ fetchedFamily: true, family });
      })
      .catch((error) => {
        Log.error(error);
        this.setState({
            fetchedFamily: true,
            family: {
                id: familyId,
                name: '',
                members: []
          },
        });
      });
  }

  render() {
    const { language, history, familyId } = this.props;
    const { pathname } = history.location;
    const { family, fetchedFamily } = this.state;
    const route = `${pathname}/${familyId}`;
    return (
      <div
        id="childContainer"
        className="row no-gutters"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.1" }}
      >
        {fetchedFamily ? (
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
                onClick={() => history.push(route)}
                id="childInfoContainer"
                className="verticalCenter"
              >
                <h1>{`${family.name} ${family.members.length}`}</h1>
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
