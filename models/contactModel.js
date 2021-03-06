/**
 * contactModel.js has the mongodb schema for contacts.
 * Schema:
 * name: name of contact
 * email: email of contact
 * eventID: array of events that the contact has been invited to
 * rsvpCheck: array of events the contact has rsvped to
 * user: userID of the account that created this contact.
 */
const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

// creates contact schema in mongoDB
//contact needs name and an email

const contactSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    eventID: [{type: String, required: false}],
    rsvpCheck: [{type: String, required: false}],
    message: {type: String, required: false},
    user: {type: ObjectId, required: true},
    
},{
    timestamps: true
});

const Contact = mongoose.model("contact",contactSchema);

module.exports = Contact;