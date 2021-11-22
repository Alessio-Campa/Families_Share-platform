const mongoose = require('mongoose')

const memberSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    default: 'adult'
  }
})

const familySchema = new mongoose.Schema({ // TODO: confermare modello family
  name: { // the name is a surname
    type: String,
    required: true
  },
  calendar_id: {
    type: String,
    unique: true,
    required: true
  },
  /*
  background: {
    type: String,
    required: true
  }, */
  members: { // both parents and children
    type: [memberSchema],
    required: true,
    default: []
  }
}, { toJSON: { virtuals: true } })

/*
    si potrebbe dare la possibilità di mettere una foto della famiglia

familySchema.virtual('image', {
  ref: 'Image',
  localField: 'image_id',
  foreignField: 'image_id',
  justOne: true
})
*/

mongoose.pluralize(null)
const model = mongoose.model('Family', familySchema)

module.exports = model
