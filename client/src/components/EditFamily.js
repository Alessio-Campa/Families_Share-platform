import React from "react";
import axios from "axios"
import * as path from "lodash.get";
import BackNavigation from './BackNavigation'
import TimeslotSubcribe from './TimeslotSubcribe'

const styles = {
  continueButton: {
    backgroundColor: "#00838F",
    "&:hover": {
      backgroundColor: "#00838F",
    },
    boxShadow: "0 6px 6px 0 rgba(0,0,0,0.24)",
    fontSize: "1.5rem"
  },
}


function getUserChildren(userId){
  return axios.get(`/api/users/${userId}/children`).then( (children) => {
    let ids = [];
    children.data.forEach( c => ids.push(c.child_id));
    console.log(ids)
    if (ids.length > 0){
      return axios.get(`/api/children`, {params:{ ids }}).then( profiles => {
        return profiles
      })
    }
    else return []
  })
}

function getUserInfo(userId){
  return axios.get(`/api/profiles`, {params: {searchBy:'ids', ids: [userId]}}).then(profile => {
    return profile.data;
  })
}
function getChildInfo(childId){
  return axios.get(`/api/children`, {params:{ ids: [childId] }}).then( profiles => {
    return profiles.data;
  })
}

const getFamily = (familyId) => {
  return axios.get(`/api/family/${familyId}`).then( response => {
    return response.data;
  }).catch(err => {
    console.error(err);
    return {}
  })
}

export default class EditFamily extends React.Component{
  userId;
  familyId;
  constructor (props) {
    super(props);
    const {match} = this.props;
    this.userId = JSON.parse(localStorage.getItem("user")).id;
    this.familyId = match.params.familyId;
    this.state = {
      addList: [],
      newAdult: '',
      newAdultRole: '',
      newAdultError: '',
      familyName: '',
      creatorRole: '',
      createLoading: false,
      createError: ''
    }
  }

  async componentDidMount () {
    let children = await getUserChildren(this.userId)
    let family = await getFamily(this.familyId);
    await Promise.all(family.members.map(async member => {
      let info = "";
      if (member.role !== "child")
        info = await getUserInfo(member._id);
      else
        info = await getChildInfo(member._id);

        member.name = `${info[0].given_name} ${info[0].family_name}`
    }))
    this.setState({children: children.data, addList: family.members, family: family})
  }

  handleAddChild = (childId, _) => {
    let {addList} = this.state
    this.setState({addList: [...addList, {"_id": childId, "role":"child"}]})
  }

  handleRemoveMember = (id, _) => {
    let {addList} = this.state

    this.setState({addList: addList.filter( i => {
        return i._id !== id;
      })})
  }

  handleAddAdult = () => {
    let {newAdult, newAdultRole, addList} = this.state;
    if (newAdultRole === 'child'){
      this.setState({newAdultError: "Il ruolo non può essere 'child'", newAdultRole:''})
      return;
    }
    if (!newAdultRole.replace(/\s/g, '').length) {
      newAdultRole = 'adult'
    }
    axios.get(`/api/profiles/${newAdult}`).then( u =>{
      if (u.data.user_id === this.userId || addList.filter(i => u.data.user_id === i._id).length > 0){
        this.setState({newAdultError: "Non puoi inserire lo stesso utente più volte"})
        return;
      }
      this.setState({addList: [...addList, {_id: u.data.user_id, role: newAdultRole, name:`${u.data.given_name} ${u.data.family_name}`}], newAdultError: ''})
    }).catch(err =>{
      let test = err.toString().split(' ')
      if (test[test.length-1] === '400' || test[test.length-1] === '404')
        this.setState({newAdultError: "Email inesistente o errata"})
      else
        this.setState({newAdultError: "Errore sconosciuto"})
    })
    this.setState({newAdult: '', newAdultRole:''})
  }

  handleChange(evt, name) {
    let newState = {}
    newState[name]  = evt.target.value
    this.setState(
      newState
    );
  }

  createFamily = () => {
    this.setState({createLoading: true})
    const {history} = this.props;
    const {addList} = this.state
    axios.patch(`/api/family/${this.familyId}`, {members: addList}).then(obj => {
      history.goBack()
    })

  }


  render(){
    const {history} = this.props;
    const rowStyle = { minHeight: "7rem" };
    let {addList, children, newAdult, newAdultRole, newAdultError, familyName, creatorRole, createLoading, createError, family} = this.state;
    return(
      <div>
        <BackNavigation
          title={family && `Famiglia ${family.name}`}
          onClick={() => history.goBack()}
        />
        <div id="createActivityInformationContainer">

          <div className="row no-gutters mt-3" style={rowStyle}>
            <div className="col-2-10"/>
            <div className="col-8-10">
              <h2 className="m-0 text-secondary">Aggiungi adulti</h2>
            </div>
          </div>

          <div className="row no-gutters" style={rowStyle}>
            <div className="col-2-10">
              <i className="fas fa-user-plus center" />
            </div>
            <div className="col-8-10">
              <div className="row pl-4 pr-4">
                <input
                  type="text"
                  name="adultMail"
                  placeholder="Email"
                  className="center"
                  value={newAdult}
                  onChange={evt => this.handleChange(evt, 'newAdult')}
                />
              </div>
              <div className="row pl-4 pr-4">
                <input
                  type="text"
                  name="adultRole"
                  placeholder="Ruolo"
                  className="center"
                  value={newAdultRole}
                  onChange={evt => this.handleChange(evt, 'newAdultRole')}
                />
              </div>
              {newAdultError !== '' && (
                <div className="row pl-4 pr-4">
                  <p className="text-danger"> {newAdultError}</p>
                </div>
              )}
              <div className="d-flex justify-content-center">
                <button style={styles.continueButton} className="btn text-light p-2" onClick={this.handleAddAdult}>
                  AGGIUNGI
                </button>
              </div>
            </div>
          </div>

          {addList.filter(p => p.role !== 'child').length > 0 && (
            <div className="row no-gutters">
              <div className="col-2-10"/>
              <div className="row" style={rowStyle}>
                {addList && addList.filter(m => m._id !== this.userId).map( p => {
                  if (p.role !== 'child'){
                    return(
                      <TimeslotSubcribe
                        key={p._id}
                        name={`${p.name} - ${p.role}`}
                        image={path(p, ["image", "path"])}
                        subscribed={true}
                        id={p._id}
                        type="child"
                        handleUnsubscribe={this.handleRemoveMember}
                      />
                    )}
                })}
              </div>
            </div>
          )}

          <div className="row no-gutters mt-3">
            <div className="col-2-10"/>
            <div className="col-8-10">
              <h2 className="m-0 text-secondary">Aggiungi bambini</h2>
            </div>
          </div>


          <div className="row no-gutters">
            <div className="col-2-10"/>
            <div className="row" style={rowStyle}>
              {addList && children && children.map( child => (
                <TimeslotSubcribe
                  key={child.child_id}
                  name={`${child.given_name} ${child.family_name}`}
                  image={path(child, ["image", "path"])}
                  subscribed={addList.filter(i => i._id === child.child_id).length === 1}
                  id={child.child_id}
                  type="child"
                  handleSubscribe={this.handleAddChild}
                  handleUnsubscribe={this.handleRemoveMember}
                />
              ))}
              {addList && children && addList.map( child => (
                child.role === "child" && children.filter(c => c.child_id !== child._id).length === 1  &&
                <TimeslotSubcribe
                  key={child._id}
                  name={child.name}
                  image={path(child, ["image", "path"])}
                  subscribed={true}
                  id={child._id}
                  type="child"
                  handleUnsubscribe={this.handleRemoveMember}
                />
              ))}
            </div>
          </div>

          <div className="d-flex justify-content-center">
            <div>
              <button style={styles.continueButton} className="btn text-light p-4 m-4" onClick={this.createFamily} disabled={createLoading}>
                {!createLoading && ( 'SALVA' )}
                {createLoading && ('Attendi...')}
              </button>
            </div>
          </div>
          <div className="d-flex justify-content-center">
            <div>
              {createError !== '' && (
                <p className="text-danger"> {createError}</p>
              )}
            </div>
          </div>


        </div>
      </div>

    )
  }
}