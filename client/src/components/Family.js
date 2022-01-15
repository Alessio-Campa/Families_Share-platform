import React from "react";
import { Route, Switch } from "react-router-dom";
import Loadable from "react-loadable";
import axios from "axios"
import PropTypes from "prop-types";
import LoadingSpinner from "./LoadingSpinner"
import ChildListItem from './ChildListItem'
import FamilyNavbar from "./FamilyNavbar";
import MemberOptionsModal from './OptionsModal'

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

const exitFamily = (familyId, userId) =>{
  return axios.delete(`/api/family/${familyId}/member/${userId}`)
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
      fetchedFamily: false,
      top: "",
      right: "",
      isModalOpen: false,
    }
  }

  async componentDidMount(){
    const { familyId } = this.state;
    this.family = await getFamily(familyId);

    this.setState({family : this.family,
      children : this._children,
      adults : this._adults,
      fetchedFamily: true,
    })
  }

  get familyId(){
    let {familyId} = this.state;
    return familyId;
  }

  handleModalOpen = (event) => {
    this.setState({ isModalOpen: true, right: "5%", top: event.clientY });
  };
  handleModalClose = () => {
    this.setState({ isModalOpen: false, top: "", right: "" });
  };

  handleEdit = () => {
    const {history} =  this.props;
    const {familyId} = this.state;
    history.push(`/family/${familyId}/edit`);
  }

  handleExit = async () => {
    const {history} =  this.props;
    const {familyId, userId} = this.state;
    await exitFamily(familyId, userId)
    history.push('/')
  }

  render() {
    const { fetchedFamily, family, isModalOpen, top, right} = this.state;
    const { match, history } = this.props;
    const { url: currentPath } = match;

    const options = [
      {
        label: "Modifica membri",
        style: "optionsModalButton",
        handle: this.handleEdit,
      },
      {
        label: "Esci dalla famiglia",
        style: "optionsModalButton",
        handle: this.handleExit,
      },
    ];

    return fetchedFamily ? (
      <div style={{ display: 'block'}}>
        <div className="row no-gutters" id="groupMembersHeaderContainer">
          <div className="col-2-10">
            <button type="button" className="transparentButton center" onClick={() => history.goBack()}>
              <i className="fas fa-arrow-left" />
            </button>
          </div>
          <div className="col-7-10">
            <h1 className="verticalCenter">Famiglia <i>{family && family.name}</i></h1>
          </div>
          <div className="col-1-10">
            <button type="button" className="transparentButton center" onClick={this.handleModalOpen}>
              <i className="fas fa-ellipsis-v" />
            </button>
          </div>
        </div>

        <MemberOptionsModal
          position={{ top, right }}
          options={options}
          isOpen={isModalOpen}
          handleClose={this.handleModalClose}
        />

        <div id="groupMainContainer">
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
