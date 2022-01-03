import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import axios from "axios";
import Log from "./Log";

function rgbaFromHex(hex) {
    return "rgba(" + parseInt(hex.slice(1,3),16) + "," + parseInt(hex.slice(3,5),16) + "," + parseInt(hex.slice(5),16) + ",0.3)"; //0.3 opacity
}

function getLocalDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}
  
class SurveyListItem extends React.Component {
    constructor(props) {
        super(props);
        const { survey } = this.props;
        this.state = {
          survey,
          surveyIsExpanded: false,
          isVisible: true,
        };
    }

    expandSurvey() {
        this.setState({surveyIsExpanded: !this.state.surveyIsExpanded});
    }

    calculatePercentage(index) {
        const possibilities = this.state.survey.possibilities;
        const setOfVoters = new Set();
        for(let possibility of possibilities){
            for(let vote of possibility.votes){
                setOfVoters.add(vote);
            }
        }
        return setOfVoters.size > 0 ? String(possibilities[index].votes.length / setOfVoters.size * 100) + "%" : "0%";
    }

    handleChangeVote(groupId, surveyId, possibilityId) {
      axios
        .patch(`/api/groups/${groupId}/surveys/${surveyId}/votes/${possibilityId}`, {})
        .then((response) => {
            Log.info(response);
            axios
                .get(`/api/groups/${groupId}/surveys/${surveyId}/`, {})
                .then((response) => {
                    Log.info(response);
                    this.setState({survey: response.data});
                })
                .catch((error) => {
                    Log.error(error);
                });
        })
        .catch((error) => {
            Log.error(error);
        });
    }

    handleSurveyDelete(groupId, surveyId) {
        axios
            .delete(`/api/groups/${groupId}/surveys/${surveyId}/`, {})
            .then((response) => {
                Log.info(response);
                this.setState({isVisible: false});
            })
            .catch((error) => {
                Log.error(error);
            });
    }
    
    render() {
        const { survey } = this.state;
        const userId = JSON.parse(localStorage.getItem("user")).id;
        if(!this.state.isVisible)
            return null;
        return (
            <React.Fragment>
                <div
                    role="button"
                    tabIndex="0"
                    onKeyPress={() => this.expandSurvey()}
                    className="row no-gutters"
                    style={{ minHheight: "7rem", cursor: "pointer" }}
                    id={survey.survey_id}
                    onClick={() => this.expandSurvey()}
                >
                    <div className="col-2-10">
                        <i
                        style={{
                            fontSize: "3rem",
                            color: survey.color,
                        }}
                        className="fas fa-poll center"
                        />
                    </div>
                    <div
                        className="col-6-10"
                        style={!this.state.surveyIsExpanded ? { borderBottom: "1px solid rgba(0,0,0,0.1)" } : {}}
                    >
                        <div className="verticalCenter">
                            <div className="row no-gutters">
                                <h1>{survey.name}</h1>
                            </div>
                            <div className="row no-gutters">
                                <i
                                className="fas fa-map-marker-alt"
                                style={{ marginRight: "1rem" }}
                                />
                                <h2>{survey.location}</h2>
                            </div>
                        </div>
                    </div>
                    <div
                        className="col-2-10"
                        style={!this.state.surveyIsExpanded ? { borderBottom: "1px solid rgba(0,0,0,0.1)" } : {}}
                    >
                        <i
                        style={{ fontSize: "2rem" }}
                        className="fas fa-chevron-right center"
                        />
                    </div>
                </div>
                {this.state.surveyIsExpanded && (
                    <div className="row no-gutters" style={{marginTop: 16}}>
                        <div className="col-2-10"/>
                        <div className="col-6-10" style={{textAlign: "center"}}>
                            <h2 style={{margin: "0 auto"}}>
                                {survey.multipleChoiceAllowed ? "Sondaggio a scelta multipla" : "Sondaggio a scelta singola"}
                            </h2>
                        </div>
                    </div>
                )}
                {this.state.surveyIsExpanded && survey.possibilities.map((possibility, index) => 
                    <div className="row no-gutters" style={{marginTop: 16, marginBottom: 16}}>
                        <div className="col-2-10"/>
                        <div 
                            className="col-6-10" 
                            onClick={() => this.handleChangeVote(survey.group_id, survey.survey_id, possibility.possibility_id)}
                        >
                            <div className="row no-gutters" role="button" style={possibility.votes.includes(userId) ? {
                                borderStyle: "solid", 
                                borderColor: survey.color,
                                borderRadius: "5px",
                                borderWidth: "1px",
                                background: "linear-gradient(to right, " + rgbaFromHex(survey.color) + " " +
                                    this.calculatePercentage(index) + ", #FFF " + this.calculatePercentage(index) + ")",
                            } : {
                                borderStyle: "solid", 
                                borderColor: "#000",
                                borderRadius: "5px",
                                borderWidth: "1px",
                                background: "linear-gradient(to right, rgba(0,0,0,0.3) " +
                                    this.calculatePercentage(index) + ", #FFF " + this.calculatePercentage(index) + ")",
                            }}>
                                <div className="col-1-10"/>
                                <div className="col-8-10">
                                    <h2 style={{marginBottom: 0, marginTop: "0.3rem"}}>
                                        {getLocalDate(possibility.date)}  {possibility.startTime}-{possibility.endTime}
                                    </h2>
                                </div>      
                                <div className="col-1-10">
                                    <h2 style={{marginBottom: 0, marginTop: "0.3rem"}}>{possibility.votes.length}</h2>
                                </div>     
                            </div>
                        </div>
                    </div>
                )}
                {this.state.surveyIsExpanded && userId === survey.creator_id && (
                    <div className="row no-gutters" style={{marginTop: 32, marginBottom: 16}}>
                        <div className="col-2-10"/>
                        <div className="col-6-10">
                            <div className="row no-gutters" role="button" style={{
                                    borderStyle: "solid", 
                                    borderColor: "#000",
                                    borderRadius: "5px",
                                    borderWidth: "1px",
                                    background: "#ff6f00",
                                    marginLeft: "3px",
                                    marginRight: "3px",
                                }}>
                                <h4 
                                    style={{margin: "0 auto", fontSize: 14, marginBottom: 2, color: "white"}}
                                    onClick={() => this.handleSurveyDelete(survey.group_id, survey.survey_id)}
                                >
                                    Ellimina sondaggio
                                </h4>
                            </div>
                        </div>
                    </div>
                )}
            </React.Fragment>
        );
    }
}

export default withRouter(SurveyListItem);

SurveyListItem.propTypes = {
  surveyy: PropTypes.object,
  groupId: PropTypes.string,
  history: PropTypes.object,
};
