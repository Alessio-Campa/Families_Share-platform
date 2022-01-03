import React from "react";
import PropTypes from "prop-types";
import BackNavigation from "./BackNavigation";
import CreateSurveyStepper from "./CreateSurveyStepper";

const CreateSurveyScreen = ({ history }) => {
  return (
    <div id="createActivityContainer">
      <BackNavigation
        title="Nuovo Sondaggio"
        onClick={() => history.goBack()}
      />
      {<CreateSurveyStepper/>}
    </div>
  );
};

CreateSurveyScreen.propTypes = {
  history: PropTypes.object,
};

export default CreateSurveyScreen;
