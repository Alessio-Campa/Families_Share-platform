import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import withLanguage from "./LanguageContext";

class EventListItem extends React.Component {

  render() {
    const { language, history, event} = this.props;
    const { pathname } = history.location;
    console.log(event);

    return (
      <div
        id="childContainer"
        className="row no-gutters"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.1" }}>
        <React.Fragment>
          <div className="col-7-10">
            <h2>Nome attvità: {event.summary}</h2>
            <h3>Gruppo: {event.organizer.displayName}</h3>
            {event.members.map((member, index) => {
              console.log(member);
              return (<li key={member._id}> {member.given_name} {member.family_name}</li>) // id da non visualizzare
            })}
            <div style={{height: "6rem"}}></div>
          </div>
        </React.Fragment>
      </div>
    );
  }
}

export default withRouter(withLanguage(EventListItem));

EventListItem.propTypes = {
  eventId: PropTypes.string
};
