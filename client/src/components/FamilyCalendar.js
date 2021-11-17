import React from "react";
import PropTypes from "prop-types";
import withLanguage from "./LanguageContext";
import Calendar from "./Calendar";

class FamilyCalendar extends React.Component {
  render() {
    const { family, history } = this.props;
    return (
      <React.Fragment>
        <div style={{ display: 'block'}}>
        <div className="row no-gutters" id="groupMembersHeaderContainer">
          <div className="col-2-10">
          <button
            type="button"
            className="transparentButton center"
            onClick={() => history.goBack()}
          >
            <i className="fas fa-arrow-left" />
          </button>
          </div>
          <div className="col-8-10">
            <h1 className="verticalCenter">Famiglia <i>{family && family.name}</i></h1>
          </div>
        </div>
        <div style={{ position: "relative", top: "5.6rem" }}>
          <Calendar
            handleChangeView={this.handleChangeView}
            ownerType="family"
            ownerId={family._id}
          />
        </div>
        </div>
      </React.Fragment>
    );
  }
}

FamilyCalendar.propTypes = {
  family: PropTypes.object,
  history: PropTypes.object,
};

export default withLanguage(FamilyCalendar);
