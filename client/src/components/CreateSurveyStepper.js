import React from "react";
import PropTypes from "prop-types";
import {
  withStyles,
  MuiThemeProvider,
  createMuiTheme,
} from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import Button from "@material-ui/core/Button";
import { withRouter } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import LoadingSpinner from "./LoadingSpinner";
import withLanguage from "./LanguageContext";
import Log from "./Log";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ClearIcon from '@material-ui/icons/Clear';
import { Switch } from "@material-ui/core";

const muiTheme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  overrides: {
    MuiStepLabel: {
      label: {
        fontFamily: "Roboto",
        fontSize: "1.56rem",
      },
    },
    MuiStepIcon: {
      root: {
        display: "block",
        width: "3rem",
        height: "3rem",
        "&$active": {
          color: "#00838f",
        },
        "&$completed": {
          color: "#00838f",
        },
      },
    },
    MuiButton: {
      root: {
        fontSize: "1.4rem",
        fontFamily: "Roboto",
      },
    },
  },
  palette: {
    secondary: {
      main: "#c43e00",
    },
  },
});

const styles = (theme) => ({
  root: {
    width: "95%",
  },
  continueButton: {
    backgroundColor: "#00838f",
    marginTop: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    "&:hover": {
      backgroundColor: "#00838f",
    },
  },
  stepLabel: {
    root: {
      color: "#ffffff",
      "&$active": {
        color: "white",
        fontWeight: 500,
      },
      "&$completed": {
        color: theme.palette.text.primary,
        fontWeight: 500,
      },
      "&$alternativeLabel": {
        textAlign: "center",
        marginTop: 16,
        fontSize: "5rem",
      },
      "&$error": {
        color: theme.palette.error.main,
      },
    },
  },
  cancelButton: {
    backgroundColor: "#ffffff",
    marginTop: theme.spacing.unit,
    color: "grey",
    marginRight: theme.spacing.unit,
  },
  actionsContainer: {
    marginBottom: theme.spacing.unit * 2,
  },
  resetContainer: {
    padding: theme.spacing.unit * 3,
  },
});

const colors = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#607d8b",
];

class CreateSurveyStepper extends React.Component {
  state = {
    activeStep: 0,
    formIsValidated: false,
    name: "",
    location: "",
    multipleChoiceAllowed: false,
    possibilities: [],
    creatingSurvey: false,
    addPossibilityIsOpen: false,
    stepOneTrynnaConfirm: false,
    stepTwoTrynnaConfirm: false,
    addPossibilityTrynnaConfirm: false,
    rangeErr: false,
    alreadyInseredPossibility: false,
  };

  componentDidMount() {
    document.addEventListener("message", this.handleMessage, false);
  }

  componentWillUnmount() {
    document.removeEventListener("message", this.handleMessage, false);
  }

  handleMessage = (event) => {
    const { activeStep } = this.state;
    const { history } = this.props;
    const data = JSON.parse(event.data);
    if (data.action === "stepperGoBack") {
      if (activeStep - 1 >= 0) {
        this.setState({ activeStep: activeStep - 1 });
      } else {
        history.goBack();
      }
    }
  };  

  createSurvey = () => {
    const { history, match } = this.props;
    const { groupId } = match.params;
    this.setState({ creatingSurvey: true });
    const { name, location, multipleChoiceAllowed } = this.state;
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    axios
      .post(`/api/groups/${groupId}/survey`, {
        name,
        location,
        multipleChoiceAllowed,
        color: randomColor,
        possibilities: this.state.possibilities,
      })
      .then((response) => {
        Log.info(response);
        history.goBack();
      })
      .catch((error) => {
        Log.error(error);
      });
  };

  handleContinue = () => {
    const { activeStep, name, location, possibilities } = this.state;
    if(activeStep === 0){
        if(name.length !== 0 && location.length !== 0){
            this.setState({activeStep: 1});
            this.setState({stepOneTrynnaConfirm: false});
        }
        else
            this.setState({stepOneTrynnaConfirm: true});
    }
    if(activeStep === 1){
        if(possibilities.length > 1){
            this.setState({activeStep: 2});
            this.setState({stepTwoTrynnaConfirm: false});
        }
        else
            this.setState({stepTwoTrynnaConfirm: true});
    }
    if(activeStep === 2){
        this.createSurvey();
    }
  };

  handleCancel = () => {
    if(this.state.activeStep === 1)
      this.setState({ stepTwoTrynnaConfirm: false, addPossibilityTrynnaConfirm: false });
    this.setState((state) => ({
      activeStep: state.activeStep - 1,
    }));
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  }  

  handleMultipleChoiceChange = () => {
    const { multipleChoiceAllowed } = this.state;
    this.setState({ multipleChoiceAllowed: !multipleChoiceAllowed });
  }

  handleAddPossibility = () => {
    const { possibilities } = this.state;
    const samePeriod =
      this.state.startTime !== undefined && this.state.endTime !== undefined &&
      Math.floor(this.state.startTime.substr(0, this.state.startTime.indexOf(":")) / 12) ===
      Math.floor(this.state.endTime.substr(0, this.state.endTime.indexOf(":")) / 12);
    const invalidTime =  !samePeriod ||
        this.state.startTime >= this.state.endTime;
    const isAlreadyInsered = 
        possibilities.some((elem) => {
            return elem.date === this.state.date && elem.startTime === this.state.startTime && elem.endTime === this.state.endTime;
        });
    const currentDate = new Date(this.state.date);
    if(this.state.date !== undefined && !invalidTime && !isAlreadyInsered && currentDate >= moment().startOf("day").toDate()){
        this.setState({ addPossibilityTrynnaConfirm: false, addPossibilityIsOpen: false, rangeErr: false });
        possibilities.push({date: this.state.date, startTime: this.state.startTime, endTime: this.state.endTime});
    }
    else{
        if(invalidTime)
          this.setState({ rangeErr: true, alreadyInseredPossibility: false });
        else
          this.setState({ rangeErr: false });
        if(isAlreadyInsered)
          this.setState({ alreadyInseredPossibility: true, rangeErr: false });
        else
          this.setState({ alreadyInseredPossibility: false });
        this.setState({ addPossibilityTrynnaConfirm: true });
    }
  }

  handleCancelPossibility = (toDelete) => {
    const filtered = this.state.possibilities.filter((possibility) => {
        return possibility.date !== toDelete.date || possibility.startTime !== toDelete.startTime ||
            possibility.endTime !== toDelete.endTime;
    });
    this.setState({ possibilities: filtered });
  }

  formatDate = (inputDate) => {
    let date = new Date(inputDate);
    if (!isNaN(date.getTime())) {
        // Months use 0 index.
        return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
    }
}

  getStepContent = () => {
    const {
      activeStep,
      name,
      location,
      date,
      startTime,
      endTime,
      possibilities,
      stepOneTrynnaConfirm,
      addPossibilityTrynnaConfirm,
      alreadyInseredPossibility,
    } = this.state;
    switch (activeStep) {
      case 0:
        return (
          <div>
            <input
              type="text"
              name="name"
              className="createGroupInput form-control"
              placeholder="Nome"
              onChange={this.handleChange}
              required
              value={name}
            />
            {name.length === 0 && stepOneTrynnaConfirm && (
                <>
                <span style={{color: "red"}}>
                    Compila il campo
                </span>
                </>
            )}
            <input
              type="text"
              name="location"
              className="createGroupInput form-control"
              placeholder="Posizione"
              onChange={this.handleChange}
              required
              value={location}
            />
            {location.length === 0 && stepOneTrynnaConfirm && (
                <span style={{color: "red"}}>
                    Compila il campo
                </span>
            )}
          </div>
        );
      case 1:
        return (
            <>
            {possibilities.length > 0 && (
                <>
                {possibilities.map((possibility) => {
                    return (
                        <div style ={{
                            margin: "0.5rem",
                            display: "flex",
                            height: "4rem",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "0 0.5rem",
                            backgroundColor: "#e0e0e0",
                            border: "1px solid rgba(0, 0, 0, 0.12)",
                            borderRadius: "2rem",

                        }}>
                            <h3 style={{marginBottom: 0}}
                            >
                                {this.formatDate(possibility.date) + " " + possibility.startTime + "-" + possibility.endTime}
                            </h3>
                            <ClearIcon
                                style={{ marginLeft: 16}}
                                onClick={this.handleCancelPossibility.bind(this, possibility)}
                            />  
                        </div>
                    );
                })}
                </>
            )}
            <div className="row-no-gutters">
              <Button 
                style={{ paddingLeft: 0, marginTop: 26}}
                onClick={() => this.setState({ addPossibilityIsOpen: !this.state.addPossibilityIsOpen })}>
                <h4>
                  Aggiungi opzione
                </h4>
                <ArrowDropDownIcon style={{marginBottom: 7}}/>
              </Button>
            </div>
            {this.state.addPossibilityIsOpen  && (
                <>
                <div className="row no-gutters"> 
                    <div className="col-2-10">
                        <i className="fas fa-calendar center" style={{ fontSize: 24, color: "#6c757d" }} />
                    </div>
                    <div className="col-2-10">
                        <h4 className="verticalCenter">Il</h4>
                    </div>
                    <div className="col-6-10">
                        <input
                            className="createPlanDateInput form-control"
                            type="date"
                            onChange={this.handleChange}
                            value={date}
                            required
                            min={moment().format("YYYY-MM-DD")}
                            name="date"
                        />
                    </div>
                    {this.state.date <= moment().format("YYYY-MM-DD") && addPossibilityTrynnaConfirm && (
                        <span style={{color: "red"}}>
                            Data non valida
                        </span>
                    )}
                </div>
                <div className="row no-gutters" style={{ marginTop: 8 }}>
                    <div className="col-2-10">
                        <i className="fas fa-clock center" style={{ fontSize: 24, color: "#6c757d" }}/>
                    </div>
                    <div className="col-2-10">
                        <h4 className="verticalCenter">Da</h4>
                    </div>
                    <div className="col-6-10">
                        <input
                            name="startTime"
                            type="time"
                            value={startTime}
                            onChange={this.handleChange}
                            className="expandedTimeslotTimeInput"
                        />
                    </div>
                </div>
                <div className="row no-gutters" style={{ marginTop: 8 }}>
                    <div className="col-2-10" />
                    <div className="col-2-10">
                        <h4 className="verticalCenter">A</h4>
                    </div>
                    <div className="col-6-10">
                        <input
                            name="endTime"
                            type="time"
                            value={endTime}
                            onChange={this.handleChange}
                            className="expandedTimeslotTimeInput form-control"
                        />
                    </div>
                </div>
                {this.state.rangeErr && addPossibilityTrynnaConfirm && (
                    <span style={{color: "red"}}>
                        Range di orari non valido
                    </span>
                )}
                {alreadyInseredPossibility && addPossibilityTrynnaConfirm && (
                    <span style={{color: "red"}}>
                        Non puoi aggiungere due volte la stessa opzione
                    </span>
                )}
                <div className="row no-gutters" style={{ marginTop: 8 }}>
                    <Button 
                        onClick={this.handleAddPossibility}
                    >
                        Aggiungi
                    </Button>
                </div>
                </>
            )}
            </>
        );
      case 2:
        return (
          <div className="row no-gutters">
            <div className="col-6-10">
              <h1
                className="center"
                style={this.state.multipleChoiceAllowed ? { color: "#00838f", fontSize: 13 } : { color: "#000000", fontSize: 13 }}
              >
                {this.state.multipleChoiceAllowed ? "Scelta multipla abilitata" : "Scelta multipla disabilitata"}
              </h1>
            </div>
            <div className="col-2-10">
              <MuiThemeProvider theme={muiTheme}>
                <Switch
                  checked={this.state.multipleChoiceAllowed}
                  color="primary"
                  onClick={() => this.handleMultipleChoiceChange()}
                />
              </MuiThemeProvider>
            </div>
          </div>
        );
      default:
        return <div>Lorem Ipsum</div>;
    }
  };

  render() {
    const { classes } = this.props;
    const stepLabels = [
        "Fornisci un titolo e una posizione",
        "Imposta le scelte",
        "Abilita scelta multipla"
    ];
    const { activeStep, formIsValidated, creatingSurvey, possibilities, stepTwoTrynnaConfirm } = this.state;
    const formClass = [];
    if (formIsValidated) {
      formClass.push("was-validated");
    } else {
      formClass.pop();
    }

    return !creatingSurvey ? (
      <div className={classes.root}>
        <form
          ref={(form) => {
            this.formEl = form;
          }}
          onSubmit={(event) => event.preventDefault()}
          className={formClass}
          noValidate
        >
          <MuiThemeProvider theme={muiTheme}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {stepLabels.map((label) => {
                return (
                  <Step key={label}>
                    <StepLabel className={stepLabels}>{label}</StepLabel>
                    <StepContent>
                      {this.getStepContent()}
                      {possibilities.length < 2 && stepTwoTrynnaConfirm && (
                        <span style={{color: "red"}}>
                            Devi inserire almeno due opzioni
                        </span>
                      )}
                      <div className={classes.actionsContainer}>
                        <div>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={this.handleContinue}
                            className={classes.continueButton}
                          >
                            {activeStep === stepLabels.length - 1
                              ? "Salva"
                              : "Continua"}
                          </Button>
                          <Button
                            disabled={activeStep === 0}
                            onClick={this.handleCancel}
                            className={classes.cancelButton}
                          >
                            Annulla
                          </Button>
                        </div>
                      </div>
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          </MuiThemeProvider>
        </form>
      </div>
    ) : (
      <LoadingSpinner />
    );
  }
}

CreateSurveyStepper.propTypes = {
  classes: PropTypes.object,
  history: PropTypes.object,
  language: PropTypes.string,
  match: PropTypes.object,
};
export default withRouter(withLanguage(withStyles(styles)(CreateSurveyStepper)));
