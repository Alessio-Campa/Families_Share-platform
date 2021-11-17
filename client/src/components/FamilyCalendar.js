import React from "react";
import axios from "axios";

export default class FamilyCalendar extends React.Component {
  constructor (props) {
    super(props);
    const {history, match, family} = this.props;
    const {familyId} = match.params;
    const userId = JSON.parse(localStorage.getItem('user')).id
    let children = [];
    let adults = [];
    console.log(this.props.family)
    this.family = family
    this.state = {
      familyId,
      userId,
      family: family,
      children: this._children,
      adults: this._adults
    }
  }

  render() {
    return (
      <div style={{ display: 'block', paddingTop: "6rem"}}>
        TODO: fare calendario
      </div>
    );
  }
}
