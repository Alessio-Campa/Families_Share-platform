import React from "react";
import PropTypes from "prop-types";
import withLanguage from "./LanguageContext";
import Calendar from "./Calendar";
import axios from "axios";
import Log from "./Log";
import EventListItem from "./EventListItem";
import "../styles/AllStyles.css"
import "../styles/stylesheet.css"

const getChild = childId => {
  return new Promise( (resolve, reject) => {
    axios.get('/api/children/', {params: {ids: [childId]}}).then(response => {
      resolve(response.data);
    }).catch(error => {
      console.log(error);
      reject();
    })
  });
}

const getAdult = adultId => {
  return new Promise((resolve, reject) => {
    axios.get('/api/profiles/', {params: {searchBy: 'ids', ids: [adultId]}}).then(response => {
      resolve(response.data);
    }).catch(error => {
      console.log(error);
      reject();
    })
  })
}

const populateEventMembers = event => {
  return new Promise( (resolve, reject) => {
    let numberOfMembers = event.members.length;
    for (const member of event.members) {
      if (member.role === 'child') {
        getChild(member._id).then(child => {
        member.given_name = child[0].given_name;
        member.family_name = child[0].family_name;
        if (--numberOfMembers == 0) {
          resolve(event)
        }
        }).catch(err => {
          console.log(err);
        })
      }
      else {
        getAdult(member._id).then(adult => {
          member.given_name = adult[0].given_name;
          member.family_name = adult[0].family_name;
          if (--numberOfMembers == 0) {
            resolve(event)
          }
        }).catch(err => {
          console.log(err);
        })
      }
    }
  })
}


function getTodayFamilyEvents(family) {
  return new Promise((resolve, reject) => {
    axios.get(`/api/family/${family.id}/events`).then((response) => {
        let todayEvents = [];
        let now = new Date;
        response.data.forEach(event => {
          let startDate = new Date(event.start.dateTime)
          if (now.getDate() === startDate.getDate() &&
              now.getMonth() === startDate.getMonth() &&
              now.getFullYear() === startDate.getFullYear()) {
    
            let parents = event.extendedProperties.shared.parents;
            if (parents !== "[]")
              parents = parents.slice(1, parents.length - 1).split(',').map( s => s.slice(1, s.length-1));
            else parents = []
            let children = event.extendedProperties.shared.children;
            if (children !== "[]")
              children = children.slice(1, children.length - 1).split(',').map( s => s.slice(1, s.length-1));
            else children = []
    
            let people = parents.concat(children)
            let membersInEvent = []
            
            family.members.forEach((member) => {
              if (people.includes(member._id)) {
                let innerMember = {
                  _id : member._id,
                  role: member.role,
                  given_name: undefined,
                  family_name: undefined
                }
                membersInEvent.push(innerMember);
              }
            })
    
            event.members = membersInEvent
            populateEventMembers(event).then((defEvent) => {
              todayEvents.push(defEvent)
              resolve(todayEvents)
            })
          }
        })
      })
      }).catch((error) => {
        Log.error(error);
        return [];
      }
  )
}

class FamilyCalendar extends React.Component {
  constructor(props) {
    super(props)
    const {family} = this.props;
    this.family = family;
    this.state = { }
  }

  async componentDidMount() {
    let familyTodayEvents = await getTodayFamilyEvents(this.props.family);
    this.setState({familyTodayEvents})
  }

  render() {
    const { family, history } = this.props;
    const { familyTodayEvents } = this.state;
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
