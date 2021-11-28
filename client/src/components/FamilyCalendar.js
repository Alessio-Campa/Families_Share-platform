import React from "react";
import PropTypes from "prop-types";
import withLanguage from "./LanguageContext";
import Calendar from "./Calendar";
import axios from "axios";
import Log from "./Log";
import EventListItem from "./EventListItem";
import "../styles/AllStyles.css"
import "../styles/stylesheet.css"

const getTodayFamilyEvents = (familyId) => {
  return axios.get(`/api/family/${familyId}/events`).then((response) => {
      let todayEvents = [];
      let now = new Date;
      response.data.forEach(event => {
        let startDate = new Date(event.start.dateTime)
        if (now.getDate() === startDate.getDate() &&
            now.getMonth() === startDate.getMonth() &&
            now.getFullYear() === startDate.getFullYear()) {
          console.log(event.extendedProperties.children);
          console.log(event.extendedProperties.parents);
          todayEvents.push(event)
        }
      })
      return todayEvents;
    }).catch((error) => {
      Log.error(error);
      return [];
    }
  );
}

class FamilyCalendar extends React.Component {
  constructor(props) {
    super(props)
    const {family} = this.props;
    this.family = family;
    this.state = { }
  }

  async componentDidMount() {
    getTodayFamilyEvents(this.props.family.id).then(data => {
      this.setState({familyTodayEvents:data})
    });
  }

  render() {
    const { family, history } = this.props;
    const { familyTodayEvents } = this.state;
    console.log(familyTodayEvents)
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
        <div className=''>
          <h2 style={{ "text-align": "center"}}> Oggi </h2>
          <ul>
            {familyTodayEvents && familyTodayEvents.map( event => (
              <li>
                <EventListItem event={event} />
              </li>
            ))}
          </ul>
        </div>
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
