import React from "react";
import PropTypes from "prop-types";
import Fab from "@material-ui/core/Fab";
import { withStyles } from "@material-ui/core/styles";
import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";
import axios from "axios";

class FamilyCreate extends React.Component {
  constructor(props) {
    super(props);
    const userId = JSON.parse(localStorage.getItem("user")).id;
    this.state = {userId}
  }

  render() {
    const { history } = this.props;

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
                <h1 className="verticalCenter">Crea una Famiglia</h1>
            </div>
            </div>
            <div style={{paddingTop: "6rem"}} className=''>
          </div>
          <div>
            <h1> TODO: form per creare famiglia </h1>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default FamilyCreate;

