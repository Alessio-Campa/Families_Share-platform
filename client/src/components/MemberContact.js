import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { withRouter } from "react-router-dom";
import { withSnackbar } from "notistack";
import { CopyToClipboard } from "react-copy-to-clipboard";
import * as path from "lodash.get";
import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";
import Avatar from "./Avatar";
import MemberOptionsModal from "./OptionsModal";
import Log from "./Log";
import SegnalationDialog from "./SegnalationDialog";
import ConfirmSegnalationDialog from "./ConfirmSegnalationDialog";
import { Button } from "@material-ui/core";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ErrorDialog from "./ErrorDialog";
import { now } from "moment";

class MemberContact extends React.Component {
  state = { modalIsOpen: false, top: "", right: "", segnalationDialogIsOpen: false, confirmDialogIsOpen: false, segnalationText: "", memberReports: [], segnalationListOpen: false, errorDialogIsOpen: false};

  handleRedirect = (suspended, user_id) => {
    const { history } = this.props;
    if (!suspended) {
      history.push(`/profiles/${user_id}/info`);
    }
  };

  handleClick = (event) => {
    this.setState({ modalIsOpen: true, right: "5%", top: event.clientY });
  };

  handleModalClose = () => {
    this.setState({ modalIsOpen: false, top: "", right: "" });
  };

  handleModalOpen = () => {
    this.setState({ modalIsOpen: true });
  };

  handleAddAdmin = () => {
    const { groupId, member, handleAddAdmin } = this.props;
    const patch = { admin: true };
    axios
      .patch(`/api/groups/${groupId}/members`, {
        patch,
        id: member.user_id,
      })
      .then((response) => {
        handleAddAdmin(member.user_id);
        Log.info(response);
      })
      .catch((error) => Log.error(error));
    this.setState({
      modalIsOpen: false,
    });
  };

  handleRemoveAdmin = () => {
    const { groupId, member, handleRemoveAdmin } = this.props;
    const patch = { admin: false };
    axios
      .patch(`/api/groups/${groupId}/members`, {
        patch,
        id: member.user_id,
      })
      .then((response) => {
        handleRemoveAdmin(member.user_id);
        Log.info(response);
      })
      .catch((error) => Log.error(error));
    this.setState({
      modalIsOpen: false,
    });
  };

  handleRemoveUser = () => {
    const { member, handleRemoveUser, groupId } = this.props;
    const userId = member.user_id;
    axios
      .delete(`/api/groups/${groupId}/members/${userId}`)
      .then((response) => {
        handleRemoveUser(member.user_id);
        Log.info(response);
      })
      .catch((error) => {
        Log.error(error);
      });
    this.setState({
      modalIsOpen: false,
    });
  };

  handleSegnalation = () => {
    this.handleSegnalationDialogOpen()
  };

  handleSegnalationDialogOpen = () => {
    this.setState({ segnalationDialogIsOpen: true, modalIsOpen: false });
  };

  handleSegnalationDialogClose = (choice, text) => {
    if(choice === "agree"){
      this.setState({ segnalationDialogIsOpen: false, confirmDialogIsOpen: true });
      this.setState({ segnalationText: text});
    }
    else
      this.setState({ segnalationDialogIsOpen: false });
  };

  handleConfirmDialogClose = (choice) => {
    const { member, groupId } = this.props;
    const userId = member.user_id;
    const currentUser = JSON.parse(localStorage.getItem("user")).id;
    if(choice === "disagree")
      this.setState({ confirmDialogIsOpen: false, segnalationDialogIsOpen: true });
    else{
      let insert_accepted = true;
      const one_day_ms = 1000*60*60*24;
      const current_user_id = JSON.parse(localStorage.getItem("user")).id;
      this.state.memberReports.forEach(report => {
        if (report._id === current_user_id) {
          const report_date = new Date(report.createdAt);
          if(now() - report_date.getTime() < one_day_ms)
            insert_accepted = false;
        }
      });
      if(insert_accepted){
        axios
          .put(`/api/groups/${groupId}/members/${userId}/report`, {user_id: currentUser, message: this.state.segnalationText})
          .then((response) => {
            Log.info(response);
          })
          .catch((error) => {
            Log.error(error);
          });
        this.setState({ confirmDialogIsOpen: false });
      }
      else{
        console.log("here we go")
        this.setState({ errorDialogIsOpen: true, confirmDialogIsOpen: false });
      }
    }
  };

  handlePhoneCall = (number) => {
    const { enqueueSnackbar } = this.props;
    if (window.isNative) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ action: "phoneCall", value: number })
      );
    } else {
      enqueueSnackbar("Copied number to clipboard", {
        variant: "info",
      });
    }
  };

  handleContact = () => {
    const {
      member: { contact_option: contact },
      enqueueSnackbar,
    } = this.props;
    if (window.isNative) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: `send${contact}`,
          value: this.getContactValue(),
        })
      );
    } else {
      enqueueSnackbar("Copied e-mail to clipboard", {
        variant: "info",
      });
    }
  };

  getContactValue = () => {
    const {
      member: { contact_option: contact, phone, email },
    } = this.props;
    let value;
    switch (contact) {
      case "viber":
      case "whatsapp":
        value = phone;
        break;
      case "email":
      default:
        value = email;
    }
    return value;
  };

  getContactIcon = (contact) => {
    let icon;
    switch (contact) {
      case "viber":
        icon = "fab fa-viber";
        break;
      case "whatsapp":
        icon = "fab fa-whatsapp";
        break;
      case "email":
      default:
        icon = "fas fa-envelope";
    }
    if (window.isNative) {
      return icon;
    }
    return "fas fa-envelope";
  };

  handleContactTracing = () => {
    const { groupId, member, history } = this.props;
    history.push(`/groups/${groupId}/trace/${member.user_id}`)

  }

  getMemberReports = () => {
    const { member: profile, groupId } = this.props;
    return axios
      .get(`/api/groups/${groupId}/members`)
      .then((response => {
        const member = response.data.find((_m) => _m.user_id === profile.user_id);
        return member.reports;
      }))
      .catch((error) => {
        Log.error(error);
        return [];
      })
  }

  createDateString = (_date) => {
    const date = new Date(_date);
    const hours = (date.getHours() < 10) ? "0" + date.getHours() : date.getHours();
    const minutes = (date.getMinutes() < 10) ? "0" + date.getMinutes() : date.getMinutes();
    return (
      date.getDate()+
      "/"+(date.getMonth()+1)+
      "/"+date.getFullYear()+
      " "+hours+
      ":"+minutes
    );
  }

  async componentDidMount() {
    const _memberReports = await this.getMemberReports();
    this.setState({ memberReports :_memberReports });
  }

  render() {
    const { language, member: profile, userIsAdmin } = this.props;
    const { top, right, modalIsOpen } = this.state;
    const texts = Texts[language].memberContact;
    const { contact_option: contact } = profile;
    const currentUser = JSON.parse(localStorage.getItem("user")).id;
    let options = []
    if(userIsAdmin) {
      options = [
        profile.admin
          ? {
            label: texts.removeAdmin,
            style: "optionsModalButton",
            handle: this.handleRemoveAdmin,
          }
          : {
            label: texts.addAdmin,
            style: "optionsModalButton",
            handle: this.handleAddAdmin,
          },
        {
          label: texts.removeUser,
          style: "optionsModalButton",
          handle: this.handleRemoveUser,
        },
        {
          label: texts.trace,
          style: "optionsModalButton",
          handle: this.handleContactTracing,
        },
      ];
    }
    options.push({
      label: "Segnala utente",
      style: "optionsModalButton",
      handle: this.handleSegnalation,
      disabled: profile.user_id === currentUser
    });
    return (
      <React.Fragment>
        <MemberOptionsModal
          position={{ top, right }}
          options={options}
          isOpen={modalIsOpen}
          handleClose={this.handleModalClose}
        />
        <SegnalationDialog
          isOpen={this.state.segnalationDialogIsOpen}
          handleClose={(choice, text) => this.handleSegnalationDialogClose(choice, text)}
        />
        <ConfirmSegnalationDialog
          isOpen={this.state.confirmDialogIsOpen}
          handleClose={(choice) => this.handleConfirmDialogClose(choice)}
        >
        </ConfirmSegnalationDialog>
        <ErrorDialog
          isOpen={this.state.errorDialogIsOpen}
          title={"ERRORE: Non puoi segnalare una persona più di una volta nell'arco di 24 ore!"}
          handleClose={() => this.setState({errorDialogIsOpen: false})}
        >
        </ErrorDialog>
        <div id="contactContainer" className="row no-gutters">
          <div className="col-2-10">
            <Avatar
              thumbnail={path(profile, ["image", "path"])}
              route={`/profiles/${profile.user_id}/info`}
              disabled={profile.suspended}
            />
          </div>
          <div className="col-5-10">
            <div
              role="button"
              tabIndex={-42}
              id="contactInfoContainer"
              className="center"
              onClick={() =>
                this.handleRedirect(profile.suspended, profile.user_id)
              }
            >
              <h1>{`${profile.given_name} ${profile.family_name}`}</h1>
              <h2>{profile.admin ? texts.administrator : ""}</h2>
            </div>
          </div>
          <div id="contactIconsContainer" className="col-1-10">
            {profile.phone && !profile.suspended && (
              <CopyToClipboard text={profile.phone}>
                <button
                  type="button"
                  onClick={() => this.handlePhoneCall(profile.phone)}
                  className="transparentButton verticalCenter"
                >
                  <i className="fas fa-phone" />
                </button>
              </CopyToClipboard>
            )}
          </div>
          <div id="contactIconsContainer" className="col-1-10">
            {!profile.suspended && (
              <CopyToClipboard text={profile.email}>
                <button
                  type="button"
                  onClick={() => {
                    this.handleContact();
                  }}
                  className="transparentButton verticalCenter"
                >
                  <i className={this.getContactIcon(contact)} />
                </button>
              </CopyToClipboard>
            )}
          </div>
          <div id="contactIconsContainer" className="col-1-10">
            {!profile.suspended && (
              <button
                type="button"
                className="transparentButton verticalCenter memberOptions"
                onClick={this.handleClick}
              >
                <i className="fas fa-ellipsis-v" />
              </button>
            )}
          </div>
        </div>
        {this.state.memberReports.length > 0 && userIsAdmin && profile.user_id !== currentUser && (
          <div className="row-no-gutters"
               style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Button onClick={() => this.setState({ segnalationListOpen: !this.state.segnalationListOpen })}>
              <h5>
                SEGNALAZIONI
              </h5>
              <ArrowDropDownIcon style={{marginBottom: 7}}/>
            </Button>
          </div>
        )}
        {this.state.segnalationListOpen && (
          <ul>
            {this.state.memberReports.map((report) => (
              <li style={{ marginLeft: 15, marginRight: 15}}>
                <h5>
                  {this.createDateString(report.createdAt)}
                </h5>
                <p>
                  {report.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </React.Fragment>
    );
  }
}

export default withSnackbar(withRouter(withLanguage(MemberContact)));

MemberContact.propTypes = {
  member: PropTypes.object,
  userIsAdmin: PropTypes.bool,
  groupId: PropTypes.string,
  handleAddAdmin: PropTypes.func,
  handleRemoveUser: PropTypes.func,
  handleRemoveAdmin: PropTypes.func,
  language: PropTypes.string,
  history: PropTypes.object,
  enqueueSnackbar: PropTypes.func,
};
