import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import withLanguage from "./LanguageContext";

class EventListItem extends React.Component {
  state = { event: {} };

  render() {
    const { language, history, event } = this.props;
    const { pathname } = history.location;
    // const { event } = this.state;

    return (
      <div
        id="childContainer"
        className="row no-gutters"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.1" }}>
        <React.Fragment>
          <div className="col-7-10">
            <h2>Nome attvità: {event.summary}</h2>
            <h3>Gruppo: {event.organizer.displayName}</h3>
            <h4>partecipanti: TODO: lista con i membri della famiglia che partecipano all'evento</h4>
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
