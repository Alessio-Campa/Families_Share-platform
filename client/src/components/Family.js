import React from "react";
import axios from "axios"
import ChildListItem from './ChildListItem'
import FamilyMemberItem from './FamilyMemberItem'

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
    }
  }

  async componentDidMount(){
    const { familyId } = this.state;
    this.family = await getFamily(familyId);

    this.setState({family : this.family})
    this.setState({children : this._children});
    this.setState({adults : this._adults});
  }

  get familyId(){
    let {familyId} = this.state;
    return familyId;
  }

  get _children(){
    let childrenIdList = []
    this.family.members.forEach(i => {
      if (i.role === "child"){
        childrenIdList.push(i._id)
      }
    })
    return childrenIdList;
  }

  get _adults(){
    let adultsList = [];
    this.family.members.forEach(i => {
      if (i.role !== "child")
        adultsList.push(i);
    })
    return adultsList
  }

  renderChildren(){
    const {userId} = this.state;
    const {children} = this.state;
    return(
      <div  className=''>
        <ul>
          {children && children.map( child => (
            <li>
              <ChildListItem childId={child} userId={userId} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  renderAdults(){
    const {adults} = this.state;
    return(
      <div style={{paddingTop: "6rem"}} className=''>
        <ul>
          {adults && adults.map( adult => (
            <li>
              <FamilyMemberItem memberId={adult._id} role={adult.role} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  render() {
    const { history } = this.props;
    const { family } = this.state;
    return (
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

        {this.renderAdults()}
        {this.renderChildren()}

      </div>
    );
  }
}
