const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

// creates contact schema in mongoDB
//contact needs name and an email

const contactSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    eventID: {type: [], required: true},
    message: {type: String, required: false},
    user: {type: ObjectId, required: true},
    
},{
    timestamps: true
});

const Contact = mongoose.model("contact",contactSchema);

module.exports = Contact;