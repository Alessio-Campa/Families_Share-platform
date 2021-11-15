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
    return axios.get(`/api/children`, {params:{ ids }}).then( profiles => {
      return profiles
    })
  })
}

export default class CreateFamily extends React.Component{
  userId;
  constructor (props) {
    super(props);
    this.userId = JSON.parse(localStorage.getItem("user")).id;
    this.state = {
      addList: [],
      newAdult: '',
      newAdultRole: '',
      newAdultError: '',
      familyName: '',
    }
  }

  async componentDidMount () {
    let children = await getUserChildren(this.userId)
    this.setState({children: children.data})
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
    console.log(addList)
    if (newAdultRole === 'child'){
      this.setState({newAdultError: "Il ruolo non può essere 'child'", newAdultRole:''})
      return;
    }
    axios.get(`/api/profiles/${newAdult}`).then( u =>{
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

  createFamily(){

  }


  render(){
    const {history} = this.props;
    const rowStyle = { minHeight: "7rem" };
    let {addList, children, newAdult, newAdultRole, newAdultError, familyName} = this.state;
    return(
      <div>
        <BackNavigation
          title="Nuova Famiglia"
          onClick={() => history.goBack()}
        />
        <div id="createActivityInformationContainer">

          <div className="row no-gutters" style={rowStyle}>
            <div className="col-2-10">
              <i className="fas fa-id-card center" />
            </div>
            <div className="col-8-10">
              <input
                type="text"
                name="location"
                placeholder="Nome famiglia"
                className="center"
                value={familyName}
                onChange={evt => this.handleChange(evt, "familyName")}
              />
            </div>
          </div>

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
                  name="location"
                  placeholder="Email"
                  className="center"
                  value={newAdult}
                  onChange={evt => this.handleChange(evt, 'newAdult')}
                />
              </div>
              <div className="row pl-4 pr-4">
                <input
                  type="text"
                  name="location"
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
              {addList && addList.map( p => {
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
            </div>
          </div>

          <div className="d-flex justify-content-center">
            <button style={styles.continueButton} className="btn text-light p-4 m-4" onClick={this.createFamily}>
              CREA
            </button>
          </div>

        </div>
      </div>

    )
  }
}