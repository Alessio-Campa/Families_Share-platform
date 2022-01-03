const mongoose = require('mongoose');

const possibilitiesSchema = new mongoose.Schema({
    possibility_id: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    votes: {
        type: [String],
        required: true,
        default: []
    }
})

const surveySchema = new mongoose.Schema({
    survey_id: {
        type: String,
        unique: true,
        required: true,
    },
    group_id: {
        type: String,
        required: true,
    },
    creator_id: {
        type: String, 
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    multipleChoiceAllowed: {
        type: Boolean,
        required: false,
    },
    possibilities: {
        type: [possibilitiesSchema],
        required: true,
        default: []
    }
})

mongoose.pluralize(null)
const model = mongoose.model('Survey', surveySchema)
  
module.exports = model