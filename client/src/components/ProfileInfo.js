import React from "react";
import PropTypes from "prop-types";
import * as path from "lodash.get";
import withLanguage from "./LanguageContext";
import Texts from "../Constants/Texts";
import axios from "axios";

let userId = ''
function handlePositivity() {
  axios.get(`/api/users/${userId}/groups`).then(groups => {
    groups.data.forEach(group => {
      axios.get(`/api/groups/${group.group_id}/members`).then(members => {
        members.data.forEach( m => {
          if (m.admin)
            axios.post(`/api/users/${m.user_id}/positivityNotification/${userId}`)
        })
      })
    })
  })
}

const ProfileInfo = ({ language, profile }) => {
  const texts = Texts[language].profileInfo;
  userId = profile.user_id;
  return (
    <div>
      <div className="row no-gutters profileInfoContainer">
        <div className="col-2-10">
          <i className="fas fa-phone center" />
        </div>
        <div className="col-8-10">
          <div className="verticalCenter">
            <h1>{profile.phone}</h1>
            <h2>{texts[profile.phone_type]}</h2>
          </div>
        </div>
      </div>
      <div className="row no-gutters  profileInfoContainer">
        <div className="col-2-10">
          <i className="fas fa-map-marker-alt center" />
        </div>
        <div className="col-8-10">
          <div className="verticalCenter">
            <h1>
              {`${path(profile, ["address", "street"])} ${path(profile, [
                "address",
                "number",
              ])}`}
            </h1>
            <h2>{texts.adress}</h2>
          </div>
        </div>
      </div>
      <div className="row no-gutters  profileInfoContainer">
        <div className="col-2-10">
          <i className="fas fa-envelope center" />
        </div>
        <div className="col-8-10">
          <div className="verticalCenter">
            <h1>{profile.email}</h1>
            <h2>{texts.email}</h2>
          </div>
        </div>
      </div>
      <div className="row no-gutters  profileInfoContainer">
        <div className="col-2-10">
          <i className="fas fa-info-circle center" />
        </div>
        <div className="col-8-10">
          <div className="verticalCenter">
            <h1>{profile.description}</h1>
            <h2>{texts.description}</h2>
          </div>
        </div>
      </div>
      { profile.user_id === JSON.parse(localStorage.getItem("user")).id &&
        <div className="d-flex justify-content-center align-items-end" style={{height: "100px"}}>
          <button className="btn btn-danger rounded p-3 mb-2" onClick={handlePositivity}><h2 className="text-light m-0">Segnala positività</h2></button>
        </div>
      }

    </div>
  );
};

export default withLanguage(ProfileInfo);

ProfileInfo.propTypes = {
  profile: PropTypes.object,
  language: PropTypes.string,
};
