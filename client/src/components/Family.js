import React from "react";
import { Route, Switch } from "react-router-dom";
import Loadable from "react-loadable";
import axios from "axios"
import PropTypes from "prop-types";
import LoadingSpinner from "./LoadingSpinner"
import ChildListItem from './ChildListItem'
import FamilyNavbar from "./FamilyNavbar";

const FamilyMembers = Loadable({
  loader: () => import("./FamilyMembers"),
  loading: () => <div />,
});
const FamilyCalendar = Loadable({
  loader: () => import("./FamilyCalendar"),
  loading: () => <div />,
});

const getFamily = (familyId) => {
  return axios.get(`/api/family/${familyId}`).then( response => {
    return response.data;
  }).catch(err => {
    console.error(err);
    return {}
  })
}

export default class Family extends React.Component {
  //gets family id and other info
  family;

  constructor (props) {
    super(props);
    const {history, match} = this.props;
    const {familyId} = match.params;
    const userId = JSON.parse(localStorage.getItem('user')).id
    let children = [];
    let adults = [];
    
    this.state = {
      familyId,
      userId,
      fetchedFamily: false
    }
  }
  
  async componentDidMount(){
    const { familyId } = this.state;
    this.family = await getFamily(familyId);
    
    this.setState({family : this.family,
      children : this._children,
      adults : this._adults,
      fetchedFamily: true
    })
  }
  
  get familyId(){
    let {familyId} = this.state;
    return familyId;
  }

  render() {
    const { fetchedFamily, family, userIsAdmin} = this.state;
    const { match, history } = this.props;
    const { url: currentPath } = match;
    
    return fetchedFamily ? (  
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
      <div id="groupMainContainer">
        <div> {currentPath} </div>
        <Switch>
          <Route
            path={`${currentPath}/members`}
            render={(props) => (
              <FamilyMembers
                {...props}
                family={this.state.family}
              />
            )}
          />
          <Route
            exact
            path={`${currentPath}/calendar`}
            render={(props) => (
              <FamilyCalendar
                {...props}
                family={family}
              />
            )}
          />
        </Switch>
        <FamilyNavbar />
      </div>
      </div>
    ) : (
      <LoadingSpinner />
    );
  }
}
