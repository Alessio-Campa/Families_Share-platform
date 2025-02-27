import React from "react";
import Loadable from "react-loadable";
import axios from "axios"
import GroupMembersList from './GroupMembersList'

export default class TracedMembers extends React.Component {
  memberId;
  groupId;

  constructor (props) {
    super(props);
    const { history, match } = this.props;
    const { memberId, groupId } = match.params;
    this.memberId = memberId;
    this.groupId = groupId;
    const userId = JSON.parse(localStorage.getItem('user')).id

    this.state = {
      contacts: null,
      tracingError: '',
      userId,
    }
  }

  getTraced = ()=>{
    axios.get(`/api/groups/${this.groupId}/trace/${this.memberId}`).then(contacts =>{
      this.setState({contacts:  contacts.data});
    }).catch(err => {
      let statusCode = err.response.status;
      if (statusCode === 403) {
        this.setState({ tracingError: "Non puoi eseguire contact tracing di chi non ha segnalato la propria positività" });
      }
    })
  }

  async componentDidMount () {
    const { familyId } = this.state;
    await this.getTraced()
  }

  render () {
    const {props} = this
    const { contacts, tracingError } = this.state;
    const { match, history } = this.props;
    const { url: currentPath } = match;

    return (
      <div style={{ display: 'block' }}>
        <div className="row no-gutters" id="groupMembersHeaderContainer">
          <div className="col-2-10">
            <button
              type="button"
              className="transparentButton center"
              onClick={() => history.goBack()}
            >
              <i className="fas fa-arrow-left"/>
            </button>
          </div>
          <div className="col-8-10">
            <h1 className="verticalCenter">Contatti con l'utente </h1>
          </div>
        </div>
        <div id="groupMainContainer">
          {tracingError !== '' && (
            <h2 className="text-center text-danger" style={{paddingTop: "6rem"}}>
                {tracingError}
            </h2>

          )}
          <h3 style={{paddingTop: "6rem", marginLeft:"2rem"}}>Genitori</h3>
          {contacts && (
            <GroupMembersList
              key="parents"
              members={contacts.parents}
              groupId={this.groupId}
              userIsAdmin={false}
              list="parents"
              hasShortTop={true}
            />
          )}

          <h3 style={{marginLeft:"2rem"}}>Bambini</h3>
          {contacts && (
            <GroupMembersList
              key="parents"
              members={contacts.children}
              groupId={this.groupId}
              userIsAdmin={true}
              list="children"
              hasShortTop={true}
            />
          )}

        </div>
      </div>

    )
  }
}
