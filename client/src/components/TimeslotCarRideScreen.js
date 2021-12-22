import React from "react";
import { Route, Switch } from "react-router-dom";
import Loadable from "react-loadable";
import axios from "axios"
import PropTypes from "prop-types";
import LoadingSpinner from "./LoadingSpinner"
import ChildListItem from './ChildListItem'
import FamilyNavbar from "./FamilyNavbar";
import MemberOptionsModal from './OptionsModal'
import { useAsync, useFetch } from "react-async"
import $ from "jquery"

const getNameFromId = async ({id}) => {
  //let response = await
  console.log(id);
  axios.get('/api/profiles/', {params: {searchBy: 'ids', ids: [id]}}).then(response => {
    console.log(response);
    return response.data;
    // return (response.data[0].given_name + ' ' + response.data[0].family_name)
  }).catch(err => err)
}


const Seat = (props) => {
  //style={{backgroundColor: 'rgb(0,119,130)'}}
  let card;
  switch (props.occupantType) {
    case "me":
      card = (
        <div class="card mb-3 p-2 mx-4">
          <div class="row">
            <div class="col-9">
              <h4 class="text-center">Questo posto è a tuo nome</h4>
            </div>
            <div class="col-1">
              <button
                type="button"
                className="transparentButton center"
                onClick={() => props.releaseSeat(props.driver_id)}
              >
                <i class="fas fa-minus fa-lg"></i>
              </button>
            </div>
          </div>
        </div>
      )
      break;
    case "other":
      card = (
        <div class="card mb-3 p-2 mx-4">
        <h4 class="text-center"> {props.occupant}</h4>
        </div>
      )
      break;
    case "free":
      card = (
        <div class="card mb-3 p-2 mx-4">
          <h4 class="text-center">Questo posto è libero</h4>
        </div>
      )
      break;
    default:
      card = <div></div>
      break;
  }
  return card;
}

const MyCar = (props) => {
  console.log(props);
  let car, userId;
  if (props.userId) { // i'm a passenger
    car = props.state; userId = props.userId;
  } else {
    car = props.state.myCar; userId = props.state.userId;
  }
  let emptySeats = car.seats - car.passengers.length;
  console.log(car.passengers);
  let driver;
  console.log(props.state.userId);
  console.log(car._id, userId);
  console.log(props);
  if (car._id === userId){
    driver = <h3 class="text-center">La mia auto</h3> 
  }
  else {
    driver = <h3 class="text-center">auto di {car._id}</h3>
  }
  return (<div>
    <div> {driver}
    </div>
    <div class="" >
      <ul class="">
        {car.passengers.map(passenger => {
          if (passenger === userId) {
            return (
              <li class=""> <Seat occupantType={"me"} releaseSeat={props.releaseSeat} driver_id={car._id}></Seat> </li>
            )
          }
          return <li class=""> <Seat occupantType={"other"} occupant={passenger}></Seat> </li>
        })}
        {[...Array(emptySeats)].map(seat => {
          return <li class=""> <Seat occupantType={"free"}/></li>
        })}
      </ul>
    </div>
    </div>
  )
}

const OtherCar = (props) => {
  let car = props.car;
  return (<div>
    <h4 >
    autista: {car._id}
    </h4>
    <h4>
    posti disponibili: {car.seats - car.passengers.length} su {car.seats}
    </h4>
  </div>)
}


export default class TimeslotCarRideScreen extends React.Component {
  constructor (props) {
    super(props);
    console.log(props);

    const {history, match} = this.props;
    const {familyId} = match.params;
    const userId = JSON.parse(localStorage.getItem('user')).id

    this.state = {
      userId,
      fetchedRides: false,
      isPassenger: false
    }
    this.state.fetchedRides = true;
  }
  
  getAvaiableSeats = async (pathname) => {
    console.log(this.state.userId);
    axios.get('/api' + pathname).then(response => {
      let myCar = null;
      let otherCars = [];
      let guestCars = [];
      this.setState({isPassenger: false})
      response.data.cars.forEach(car => {
        if (car._id === this.state.userId) {
          myCar = car;
        } else if (car.passengers.includes(this.state.userId)) {
          guestCars.push(car);
          otherCars.push(car);
          this.setState({isPassenger: true})
          $('#carButtons').slideUp();
        } else {
          otherCars.push(car);
        }
      });
      if (!this.state.isPassenger) {
        $('#carButtons').slideDown();
      }
      this.setState({myCar, otherCars, guestCars, fetchedRides:true});
      console.log(this.state);
      this.getNames();
    }).catch(err => console.log(err))
  }

  getNamesFromIds = (ids) => {
    axios.get('/api/profiles/', {params: {searchBy: 'ids', ids}}).then(response => {
      console.log(response.data[0].given_name + ' ' + response.data[0].family_name);
      return (response.data[0].given_name + ' ' + response.data[0].family_name)
    }).catch(err => console.log(err))
  }

  
  /*
  getNames = async () => {
    userID
    myCar
    GuestCars
    otherCars
    let fetchCar = (driver_id) => {
      
    }
    console.log(this.state);
    let userId = this.state.userId;
    let namesDict = {userId: null}
    console.log(namesDict);
  }
  */
  
  async componentDidMount(){
    this.getAvaiableSeats(this.props.location.pathname);
  }
  
  bookSeat = (driver_id) => {
    console.log("a seat has been book");
    axios.put('/api' + this.props.location.pathname, {driver_id}).then(response => {
      console.log(response.data);
      this.setState({isPassenger: true})
      this.setState({mySeat: response.data})
      this.getAvaiableSeats(this.props.location.pathname)
    }).catch(err => {console.log(err);})
  }

  releaseSeat = (driver_id) => {
    console.log("releasing seat");
    axios.patch('/api' + this.props.location.pathname, {driver_id}).then(response => {
      console.log(response.data);
      this.getAvaiableSeats(this.props.location.pathname)
    }).catch(err => {console.log(err);})
  }

  giveSeat = () => {
    console.log("a new seat is avaiable");
    axios.post('/api' + this.props.location.pathname).then(response => {
      this.setState({isPassenger: false})
      this.getAvaiableSeats(this.props.location.pathname)
    }).catch(err => console.log(err))
  }
  
  deleteSeat = () => {
    console.log("a seat has been deleted");
    axios.delete('/api' + this.props.location.pathname).then(response => {
      this.getAvaiableSeats(this.props.location.pathname)
    }).catch(err => console.log(err))
  }

  render() {
    const {history} = this.props;
    let fetchedRides = this.state.fetchedRides;

    // class="row no-gutters"
    return fetchedRides ? (
      <div style={{ display: 'block'}}>
        <div className="row no-gutters" id="groupMembersHeaderContainer">
          <div className="col-2-10">
            <button type="button" className="transparentButton center" onClick={() => history.goBack()}>
              <i className="fas fa-arrow-left" />
            </button>
          </div>
          <div className="col-7-10">
            <h1 className="verticalCenter"> Gestione passaggi </h1>
          </div>
        </div>

        <div id="groupMainContainer" style={{ position: "relative", top: "5.6rem" }}>
          {/*!this.state.isPassenger*/ true && (
            <div id="carButtons" className="row no-gutters">
              <div className="col-5-10 text-center" >
                <button onClick={this.giveSeat} type="button" class="btn btn-secondary p-4 rounded-pill btn-lg mt-3">
                  aggiungi un posto
                </button>  
              </div>
              <div className="col-5-10 text-center" >
              <button onClick={this.deleteSeat} type="button" class="btn btn-secondary p-4 rounded-pill btn-lg mt-3">
                rimuovi un posto
              </button>
              </div>
              <hr/>

            </div>

          )}
          
          <div>
            {this.state.myCar && 
              <MyCar state={this.state} releaseSeat={this.releaseSeat}></MyCar>
            }
            {this.state.guestCars && this.state.guestCars.map(car => {
              return <MyCar state={car} userId={this.state.userId} releaseSeat={this.releaseSeat}></MyCar>
            })}
          </div>
          
          <hr/>
          <h3 class="text-center">Altre auto</h3>
          <div class="col d-flex justify-content-center">
            <ul class="">
              {this.state.otherCars && this.state.otherCars.map(car => {
                if (this.state.myCar){
                  return <li class="card mb-3 p-2 mx-4"><OtherCar car={car}></OtherCar></li>  
                }
                return <li> <button type="button" class="btn card mb-3 p-2 mx-4" onClick={ () => this.bookSeat(car._id)}><OtherCar car={car}></OtherCar></button></li>  
              })}
            </ul>
          </div>
        </div>  
      </div>
    ) : (
      <LoadingSpinner />
    );
  }
}