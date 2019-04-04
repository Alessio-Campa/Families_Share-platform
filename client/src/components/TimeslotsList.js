import React from 'react';
import Texts from '../Constants/Texts.js';
import withLanguage from './LanguageContext';
import FilterTimeslotsDrawer from './FilterTimeslotsDrawer';
import axios from 'axios';
import PropTypes from 'prop-types';
import moment from 'moment';
import TimeslotPreview from './TimeslotPreview';

const getUsersChildren = userId => {
	return axios
		.get(`/users/${userId}/children`)
		.then(response => {
			return response.data;
		})
		.catch(error => {
			console.log(error);
			return [];
		});
};
const getActivityTimeslots = (activityId, groupId) => {
	return axios
		.get(`/groups/${groupId}/activities/${activityId}/timeslots`)
		.then(response => {
			return response.data;
		})
		.catch(error => {
			console.log(error);
			return [];
		});
}

class TimeslotsList extends React.Component {
	state = {
		groupId: this.props.groupId,
		activityId: this.props.activityId,
		dates: this.props.dates,
		fetchedData: false,
		filter: "all",
		filterDrawerVisible: false,
		timeslots: [],
	};
	async componentDidMount() {
		const userId = JSON.parse(localStorage.getItem('user')).id
		const usersChildren = await getUsersChildren(userId);
		const timeslots = await getActivityTimeslots(this.props.activityId,this.props.groupId,)
		const sortedTimeslots = timeslots.sort((a, b) => { return moment.utc(a.start.dateTime).diff(moment.utc(b.start.dateTime)) })
		sortedTimeslots.forEach( timeslot => {
			const parents = JSON.parse(timeslot.extendedProperties.shared.parents);
			timeslot.userSubscribed = parents.includes(userId)
			const children = JSON.parse(timeslot.extendedProperties.shared.children);
			timeslot.childrenSubscribed = false;
			for(let i =0; i<usersChildren.length;i++){
				if(children.includes(usersChildren[i.child_id])){
					break;
				}
			}
		})
		this.setState({ fetchedData: true, timeslots: sortedTimeslots  })
	}
	handleFilterDrawerVisibility = () => {
		this.setState({ filterDrawerVisible: !this.state.filterDrawerVisible });
	}
	handleFilterDrawerClick = (filterOption) => {
		this.setState({ filter: filterOption, filterDrawerVisible: false });
	}
	handleFilterDrawerClose = () => {
		this.setState({ filterDrawerVisible: false });
	}
	enoughParticipants = (timeslot) => {
		const extendedProperties = timeslot.extendedProperties.shared
		if (JSON.parse(extendedProperties.parents).length >= extendedProperties.requiredParents && JSON.parse(extendedProperties.children).length >= extendedProperties.requiredChildren) {
			return true;
		}
		return false;
	}
	filterTimeslot = (timeslot) => {
		switch (this.state.filter) {
			case "all":
				return true;
			case "enough":
				return this.enoughParticipants(timeslot);
			case "notEnough":
				return !this.enoughParticipants(timeslot);
			case "signed":
				const parents = JSON.parse(timeslot.extendedProperties.shared.parents);
				const userId = JSON.parse(localStorage.getItem("user")).id;
				return parents.indexOf(userId) !== -1;
			default:
				return true;
		}
	}
	renderTimeslots = (date) => {
		const dayTimeslots = this.state.timeslots.filter(timeslot => moment(date).format('D') === moment(timeslot.start.dateTime).format('D'))
		return (
			<ul>
				{dayTimeslots.map((timeslot, timeslotIndex) => {
					return (
						this.filterTimeslot(timeslot) ?
							<li key={timeslotIndex} style={{ margin: "1rem 0" }}>
								<TimeslotPreview timeslot={timeslot} />
							</li>
							: <div />
					)
				})}
			</ul>
		);
	}
	renderDays = () => {
		return (
			<ul id="timeslotDayContainer">
				{this.state.dates.map((day, index) => {
					return (
						<li key={index}>
							<div className="row no-gutters">
								<div className="col-2-10" style={{ paddingTop: "1.5rem" }}>
									<div className="timeslotDay">{moment(day.date).format('D')}</div>
									<div className="timeslotDay">{moment(day.date).format('MMM')}</div>
								</div>
								<div className="col-8-10">
									{this.renderTimeslots(day.date)}
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		);
	}
	render() {
		const texts = Texts[this.props.language].timeslotsList;
		return (
			<React.Fragment>
				<FilterTimeslotsDrawer
					isOpen={this.state.filterDrawerVisible}
					handleFilterDrawerClick={this.handleFilterDrawerClick}
					activeOption={this.state.filter}
					handleFilterDrawerClose={this.handleFilterDrawerClose}
				/>
				<div id="timeslotsListContainer">
					<div className="row no-gutters filterLabel">
						<button className="transparentButton" onClick={this.handleFilterDrawerVisibility}>
							{texts[this.state.filter]+"  "}
							<i className="fas fa-chevron-down" />
						</button>
					</div>
					{this.renderDays()}
				</div>
			</React.Fragment >
		);
	}

}


export default withLanguage(TimeslotsList);

TimeslotsList.propTypes = {
	groupId: PropTypes.string,
	activityId: PropTypes.string,
	dates: PropTypes.array,
};
