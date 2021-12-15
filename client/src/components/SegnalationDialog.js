import React from "react";
import Button from "@material-ui/core/Button";
import { TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@material-ui/core"

class SegnalationDialog extends React.Component {
  state = { msg: "", text:"" };

  handleClose = (choice, text) => {
    const { handleClose } = this.props;
    handleClose(choice, text);
  };

  render() {
    const { isOpen } = this.props;
    const { msg, text } = this.state;
    return (
      <Dialog
        open={isOpen}
        onClose={() => {
              this.setState({msg: "", txt: ""})
              this.handleClose("disagree")
        }}
      >
        <DialogTitle>
          <h2>Segnala Utente</h2>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <p style={{fontSize: 13}}>
              Segnala un comportamento non consono da parte di un membro del gruppo,
              in modo da riportarlo agli amministratori che valuteranno poi il caso.
            </p>
          {text === "" && (
            <p style={{color: "red"}}> 
              {msg}
            </p>
          )}
          </DialogContentText>
          <TextField
            id="standard-textarea"
            label="Scrivi la segnalazione"
            placeholder="Segnalazione"
            multiline
            rows={6}
            variant="standard"
            fullWidth
            required
            inputProps={{style: {fontSize: 17, lineHeight: 1}}} // font size of input text
            InputLabelProps={{style: {fontSize: 17, lineHeight: 1}}} // font size of input label
            onChange={(event) => this.setState({text: event.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              this.setState({msg: "", txt: ""})
              this.handleClose("disagree")
            }}
            style={{fontSize: 15}}
          >
            ANNULLA
          </Button>
          <Button
            onClick={() => text === "" ? this.setState({msg: "Compila il campo"}) : 
              this.handleClose("agree", this.state.text)}
            style={{fontSize: 15}}
          >
            INVIA
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default SegnalationDialog;
