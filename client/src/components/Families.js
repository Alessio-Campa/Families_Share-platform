import React from "react";
import PropTypes from "prop-types";
import Fab from "@material-ui/core/Fab";
import { withStyles } from "@material-ui/core/styles";
import FamilyListItem from "./FamilyListItem";
import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";
import axios from "axios";

const styles = () => ({
  add: {
    position: "fixed",
    bottom: "5%",
    right: "5%",
    height: "5rem",
    width: "5rem",
    borderRadius: "50%",
    border: "solid 0.5px #999",
    backgroundColor: "#ff6f00",
    zIndex: 100,
    fontSize: "2rem",
  },
});

const getAllFamilies = (userId) => {
  return axios.get('/api/family/user/' + userId).then(res => {
    let fam = []
    res.data.forEach(element => {
      fam.push(element['_id']);
    });
    return fam;
  }).catch(err => console.log(err)) 
}

class Families extends React.Component {
  constructor(props) {
    super(props);
    const userId = JSON.parse(localStorage.getItem("user")).id;
    this.state = {userId}
    this.state.userId = userId;
  }

  async componentDidMount() { //executed after render
    this.families = await getAllFamilies(this.state.userId)
    console.log(this.state.families)
    this.setState({families: this.families})
  }

  addFamily = () => {
    const { history } = this.props;
    history.push('families/create');
  };

  render() {
    const { classes, history } = this.props;
    const { families } = this.state;

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
              <h1 className="verticalCenter">Le tue famiglie</h1>
            </div>
          </div>
          <div style={{paddingTop: "6rem"}} className=''>
            {families && families.length > 0 ? (
              <ul>
                {families.map((family, index) => (
                  <li key={index}>
                    <FamilyListItem familyId={family}/>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="addGroupsPrompt">{""}</div>
            )}
            <Fab
            color="primary"
            aria-label="Add"
            className={classes.add}
            onClick={this.addFamily}
            >
            <i className="fas fa-users" />
            </Fab>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

/*
Families.propTypes = {
  usersChildren: PropTypes.array,
  profileId: PropTypes.string,
  history: PropTypes.object,
  classes: PropTypes.object,
  language: PropTypes.string,
};*/

export default withStyles(styles)(withLanguage(Families));
