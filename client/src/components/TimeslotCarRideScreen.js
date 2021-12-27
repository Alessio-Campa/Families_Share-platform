import React from "react";
import axios from "axios"
import LoadingSpinner from "./LoadingSpinner"
import $ from "jquery"
import PullToRefresh from 'react-simple-pull-to-refresh';

const Seat = (props) => {
  let card;
  switch (props.occupantType) {
    case "me":
      card = (
        <div className="card mb-3 p-2 mx-4">
          <div className="row">
            <div className="col-9">
              <h4 className="text-center">Questo posto è a tuo nome</h4>
            </div>
            <div className="col-1">
              <button
                type="button"
                className="transparentButton center"
                onClick={() => props.releaseSeat(props.driver_id)}>
                <i className="fas fa-minus fa-lg"/>
              </button>
            </div>
          </div>
        </div>
      )
      break;
    case "other":
      card = (
        <div className="card mb-3 p-2 mx-4">
        <h4 className="text-center"> {props.names[props.occupant].name} {props.names[props.occupant].surname}</h4>
        </div>
      )
      break;
    case "free":
      card = (
        <div className="card mb-3 p-2 mx-4">
          <h4 className="text-center"> Posto libero</h4>
        </div>
      )
      break;
    default:
      card = <div/>
      break;
  }
  return card;
}

const OtherCar = (props) => {
  let car = props.car;
  return (<div>
    <h4 >
    Autista: {props.names[car._id] && props.names[car._id].name} {props.names[car._id] && props.names[car._id].surname}
    </h4>
    <h4>
    Posti disponibili: {car.seats - car.passengers.length} su {car.seats}
    </h4>
  </div>)
}

export default class TimeslotCarRideScreen extends React.Component {

  MyCar = (props) => {
    let car, userId;
    if (props.isMine) {
      car = props.state.myCar;
      userId = props.state.userId;
    } else {
      car = props.state; userId = props.userId;
    }
    let emptySeats = car.seats - car.passengers.length;
    let driver_id = car._id
    return (
      <div> <br/>
        <div>
          { car._id === userId ?
            <div>
              <h2 className="text-center m-0">La mia auto</h2>
              <div id="carButtons" className="row no-gutters mb-2">
                <div className="col-5-10 text-center">
                  <button onClick={this.giveSeat} type="button" className="btn btn-secondary p-4 rounded-pill btn-lg mt-1">
                    Aggiungi un posto
                  </button>
                </div>
                <div className="col-5-10 text-center">
                  {car.seats > 1 ?
                    <button onClick={this.deleteSeat} type="button" className="btn btn-secondary p-4 rounded-pill btn-lg mt-1">
                      Rimuovi un posto
                    </button>:
                    <button onClick={this.deleteSeat} type="button" className="btn btn-danger p-4 rounded-pill btn-lg mt-1">
                      Rimuovi macchina
                    </button>
                  }
                </div>
              </div>
            </div>:
            <h3 className="text-center">Auto di {props.names[driver_id].name} {props.names[driver_id].surname}</h3>
          }
        </div>
        <div>
          <ul>
            {car.passengers.map(passenger => {
              if (passenger === userId)
                return <li> <Seat occupantType={'me'} releaseSeat={props.releaseSeat} driver_id={car._id}/> </li>
            })}
            {car.passengers.map(passenger => {
              if (passenger !== userId)
                return <li> <Seat occupantType={'other'} occupant={passenger} names={props.names} /> </li>
            })}
            {[...Array(emptySeats)].map(seat => {
              return <li> <Seat occupantType={"free"}/></li>
            })}
          </ul>
        </div>
      </div>
    )
  }

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

  getAvailableSeats = async (pathname) => {
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
    this.getAvailableSeats(this.props.location.pathname);
  }

  bookSeat = (driver_id) => {
    axios.put('/api' + this.props.location.pathname, {driver_id}).then(response => {
      this.getAvailableSeats(this.props.location.pathname)
    }).catch(err => {console.log(err);})
  }

  releaseSeat = (driver_id) => {
    axios.patch('/api' + this.props.location.pathname, {driver_id}).then(response => {
      this.getAvailableSeats(this.props.location.pathname)
    }).catch(err => {console.log(err);})
  }

  giveSeat = () => {
    axios.post('/api' + this.props.location.pathname).then(response => {
      this.getAvailableSeats(this.props.location.pathname)
    }).catch(err => console.log(err))
  }

  deleteSeat = () => {
    axios.delete('/api' + this.props.location.pathname).then(response => {
      this.getAvailableSeats(this.props.location.pathname)
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

        <div id="groupMainContainer" style={{ position: 'relative', top: '5.6rem' }}>
        <PullToRefresh onRefresh={() => this.componentDidMount()} pullingContent={""}> 
          <div>
            {this.state.myCar !== undefined && this.state.myCar === null &&
            <div className="text-center">
              <button className="btn btn-success p-4 rounded-pill btn-lg mt-1" onClick={() => this.giveSeat()} disabled={this.state.isPassenger}> Offri macchina </button>
            </div>
            }
            {this.state.myCar && this.state.names &&
              <this.MyCar state={this.state} names={this.state.names} releaseSeat={this.releaseSeat} isMine={true}/>
            }
            {this.state.guestCars && this.state.names && this.state.guestCars.map(car => {
              return <this.MyCar state={car} names={this.state.names} userId={this.state.userId} releaseSeat={this.releaseSeat} isMine={false}/>
            })}
          </div>
          
          <hr className="mt-3"/>
          <h2 className="text-center">Altre auto</h2>
          <div className="text-center">
            <ul className="">
              {this.state.otherCars && this.state.names && this.state.otherCars.map(car => {
                if (this.state.myCar){
                  return <li className="card mb-3 p-2 mx-4"><OtherCar car={car} names={this.state.names}/></li>
                }
                return <li className="card mb-3 p-2 mx-4"> <button type="button" className="btn" onClick={ () => this.bookSeat(car._id)}><OtherCar car={car} names={this.state.names} /></button></li>
              })}
            </ul>
          </div>
        </PullToRefresh> 
        </div> 
      </div>
    ) : (
      <LoadingSpinner />
    );
  }
}