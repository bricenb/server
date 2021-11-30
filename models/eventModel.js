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
    
    //qrCode: {type: String, required: false },

    attendNumber: {type: Number, default: 0},
    user: {type: ObjectId, required: true},
}, {
    timestamps: true
});

const Event = mongoose.model("event", eventSchema);

module.exports = Event;