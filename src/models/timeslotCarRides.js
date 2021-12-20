const mongoose = require('mongoose')

const carSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  seats: {
    type: Number,
    required: true,
    default: 0
  },
  passengers: {
    type: [String],
    required: true,
    default: []
  }
})

const timeslotCarRidesSchema = new mongoose.Schema({
  timeslot_id: {
    type: String,
    unique: true,
    required: true
  },
  activity_id: {
    type: String,
    required: true
  },
  cars: {
    type: [carSchema],
    required: true,
    default: []
  }
}, { timestamps: true })

mongoose.pluralize(null)
const model = mongoose.model('TimeslotCarRides', timeslotCarRidesSchema)

module.exports = model
