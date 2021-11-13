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

class Families extends React.Component {
  constructor(props) {
    super(props);
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const { profileId, familiesIds } = this.props;
    const myProfile = userId === profileId; //????
    this.state = {
      myProfile,
      profileId,
    };
  }

  componentDidMount() {
    let dioporco = this.getAllFamilies()
    this.setState({families: dioporco})
    console.log(this.state.families)
  }

  addFamily = () => {
    const { history } = this.props;
    const { pathname } = history.location;
    history.push(`${pathname}/create`);
  };

  getAllFamilies = () => { // fix: get just the ids
    axios.get('/api/family/user').then(res => {
      let fam = []
      res.data.forEach(element => {
        
        fam.push(element['id']);
        /*
        axios.get('api/family', {
          params:{familyId: element['id']}
        }).then(res => {
          families.push(res.data)
        }).catch(err => {console.log(err)})
        */
      });
      // console.log(families);
      console.log(fam)
      this.setState({families: fam})
      // return families;
    }).catch(err => console.log(err)) 
  }

  render() {
    // profileListChild ProfileChildren

    const { classes, language } = this.props;
    const { children, profileId, myProfile } = this.state;
    // const texts = Texts[language].profileChildren;
    return (
      <React.Fragment>
        {this.state.families && this.state.families.length > 0 ? (
          <ul>
            {this.state.families.map((family, index) => (
              <li key={index}>
                <FamilyListItem familyId={family} userId={profileId} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="addGroupsPrompt">{ "DioScannato" /*texts.addChildPrompt*/ }</div>
        )}
        {myProfile && (
          <Fab
          color="primary"
          aria-label="Add"
          className={classes.add}
          onClick={this.addFamily}
          >
          <i className="fas fa-users" />
          </Fab>
        )}
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

