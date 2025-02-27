const mongoose = require('mongoose')

const valutationSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
})

const activitySchema = new mongoose.Schema({
  activity_id: {
    type: String,
    unique: true,
    required: true
  },
  group_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  group_name: {
    type: String,
    required: true
  },
  description: String,
  location: String,
  gp_need: {
    type: Boolean,
    required: true,
    default: false
  },
  color: {
    type: String,
    required: true
  },
  creator_id: String,
  repetition: {
    type: Boolean,
    required: true
  },
  repetition_type: {
    type: String
  },
  different_timeslots: {
    type: Boolean,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  valutations: {
    type: [valutationSchema],
    required: true,
    default: []
  }
}, { timestamps: true, toJSON: { virtuals: true } })

activitySchema.index({ group_id: 1, createdAt: -1 })

mongoose.pluralize(null)
const model = mongoose.model('Activity', activitySchema)

module.exports = model
