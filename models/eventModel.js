/**
 * eventModel.js has the mongodb schema for events
 * Schema:
 * name: date of event
 * time: time of event
 * location: location of event
 * title: title of event
 * description: description of event
 * articleImage: image upload to represent the event
 * rsvpLimit: number of guest allowed
 * vaxReq: true of false for covid vax
 * attendNumber: number of contacts who have rsvped
 * user: userID of user who created event
 */
const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

//creates and event shecma in mongBD
// event needs title, name, location, time, description

const eventSchema = new mongoose.Schema({
    name: {type: String, required: true},
    time: {type: String, required: true},
    location: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    articleImage: {type: String, required: false},
    eventID: {type: String, required: true },
    rsvpLimit: {type: Number, required: true},
    vaxReq: {type: Boolean, required: true},
    messages: [{type: Object, required: false}],
    
    //qrCode: {type: String, required: false },

    attendNumber: {type: Number, default: 0},
    user: {type: ObjectId, required: true},
}, {
    timestamps: true
});

const Event = mongoose.model("event", eventSchema);

module.exports = Event;