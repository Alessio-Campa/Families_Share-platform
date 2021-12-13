import React from "react";
import { Button, Dialog, DialogActions, DialogTitle } from "@material-ui/core";

class confirmSegnalationDialog extends React.Component {
  handleClose = (choice) => {
      const { handleClose } = this.props;
      handleClose(choice);
    };

    render = () => {
      const { isOpen } = this.props;
      return(
          <Dialog
              open = {isOpen}
              onClose={() => this.handleClose("disagree")}
          >
            <DialogTitle>
              <h2>Sei sicuro di voler inviare la segnalazione?</h2>
            </DialogTitle>
            <DialogActions>
              <Button
                onClick={() => this.handleClose("disagree")}
                style={{fontSize: 15}}
              >
                ANNULLA
              </Button>
              <Button
                onClick={() => this.handleClose("agree") }
                style={{fontSize: 15}}
              >
                INVIA
              </Button>
            </DialogActions>
          </Dialog>
        );
    }
}

export default confirmSegnalationDialog;