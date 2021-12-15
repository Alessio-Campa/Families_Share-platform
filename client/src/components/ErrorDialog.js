import React from "react";
import { Button, Dialog, DialogActions, DialogTitle } from "@material-ui/core";

class ErrorDialog extends React.Component {
  handleClose = () => {
      const { handleClose } = this.props;
      handleClose();
    };

    render = () => {
      const { isOpen, title } = this.props;
      return(
          <Dialog
              open = {isOpen}
              onClose={() => this.handleClose()}
          >
            <DialogTitle>
              <h2>{title}</h2>
            </DialogTitle>
            <DialogActions>
              <Button
                onClick={() => this.handleClose() }
                style={{fontSize: 15}}
              >
                OK
              </Button>
            </DialogActions>
          </Dialog>
        );
    }
}

export default ErrorDialog;