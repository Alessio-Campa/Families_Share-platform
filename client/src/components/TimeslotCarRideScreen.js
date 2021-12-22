import React from "react";
import axios from "axios"
import LoadingSpinner from "./LoadingSpinner"
import $ from "jquery"

const Seat = (props) => {
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
                onClick={() => props.releaseSeat(props.driver_id)}>
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
        <h4 class="text-center"> {props.names[props.occupant].name} {props.names[props.occupant].surname}</h4>
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
  let car, userId;
  if (props.isMine) {
    car = props.state.myCar; userId = props.state.userId;
  } else {
    car = props.state; userId = props.userId;
  }
  let emptySeats = car.seats - car.passengers.length;
  let driver_id = car._id
  return (<div> <br/>
    <div> 
    { car._id === userId ? 
      <h3 class="text-center">La mia auto</h3> :
      <h3 class="text-center">auto di {props.names[driver_id].name} {props.names[driver_id].surname}</h3>
    }
    </div>
    <div>
      <ul>
        {car.passengers.map(passenger => {
          if (passenger === userId) {
            return (
              <li> <Seat occupantType={"me"} releaseSeat={props.releaseSeat} driver_id={car._id}></Seat> </li>
            )
          }
          return <li> <Seat occupantType={"other"} occupant={passenger} names={props.names} ></Seat> </li>
        })}
        {[...Array(emptySeats)].map(seat => {
          return <li> <Seat occupantType={"free"}/></li>
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
    autista: {props.names[car._id].name} {props.names[car._id].surname}
    </h4>
    <h4>
    posti disponibili: {car.seats - car.passengers.length} su {car.seats}
    </h4>
  </div>)
}

export default class TimeslotCarRideScreen extends React.Component {
  constructor (props) {
    super(props);
    const {history, match} = this.props;
    const userId = JSON.parse(localStorage.getItem('user')).id
    this.state = {
      userId,
      fetchedRides: false,
      isPassenger: false
    }
  }
  
  getAvaiableSeats = async (pathname) => {
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
      this.getNames();
    }).catch(err => console.log(err))
  }
  
  getNames = async () => {
    let names = {};
    let ids = [this.state.userId]
    if (this.state.myCar) {
     this.state.myCar.passengers.forEach(passenger => ids.push(passenger))
    }
    this.state.otherCars.forEach(car => {
      ids.push(car._id)
      car.passengers.forEach(passenger => ids.push(passenger))
    })
    axios.get('/api/profiles/', {params: {searchBy: 'ids', ids}}).then(response => {
      response.data.forEach(element => {
        names[element.user_id] = {
          name: element.given_name,
          surname: element.family_name
        }
      })
      this.setState({names})
      }).catch(err => console.log(err))
  }

  async componentDidMount(){
    this.getAvaiableSeats(this.props.location.pathname);
  }
  
  bookSeat = (driver_id) => {
    axios.put('/api' + this.props.location.pathname, {driver_id}).then(response => {
      this.getAvaiableSeats(this.props.location.pathname)
    }).catch(err => {console.log(err);})
  }

  releaseSeat = (driver_id) => {
    axios.patch('/api' + this.props.location.pathname, {driver_id}).then(response => {
      this.getAvaiableSeats(this.props.location.pathname)
    }).catch(err => {console.log(err);})
  }

  giveSeat = () => {
    axios.post('/api' + this.props.location.pathname).then(response => {
      this.getAvaiableSeats(this.props.location.pathname)
    }).catch(err => console.log(err))
  }
  
  deleteSeat = () => {
    axios.delete('/api' + this.props.location.pathname).then(response => {
      this.getAvaiableSeats(this.props.location.pathname)
    }).catch(err => console.log(err))
  }

  render() {
    const {history} = this.props;
    let fetchedRides = this.state.fetchedRides;

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
            </div>
          
          <div>
            {this.state.myCar && this.state.names &&
              <MyCar state={this.state} names={this.state.names} releaseSeat={this.releaseSeat} isMine={true}></MyCar>
            }
            {this.state.guestCars && this.state.names && this.state.guestCars.map(car => {
              return <MyCar state={car} names={this.state.names} userId={this.state.userId} releaseSeat={this.releaseSeat} isMine={false}></MyCar>
            })}
          </div>
          
          <hr/>
          <h3 class="text-center">Altre auto</h3>
          <div class="text-center">
            <ul class="">
              {this.state.otherCars && this.state.names && this.state.otherCars.map(car => {
                if (this.state.myCar){
                  return <li class="card mb-3 p-2 mx-4"><OtherCar car={car} names={this.state.names}></OtherCar></li>  
                }
                return <li class="card mb-3 p-2 mx-4"> <button type="button" class="btn" onClick={ () => this.bookSeat(car._id)}><OtherCar car={car} names={this.state.names} ></OtherCar></button></li>  
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