const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

// creates contact schema in mongoDB
//contact needs name and an email

const emailSchema = new mongoose.Schema({
    location: {type: String, required: true},
    date: {type: String, required: true},
    time: {type: String, required: true},
    message:{type: String, required: true},
    //email list placeholder
    user: {type: ObjectId, required: true}
},{
    timestamps: true
});

const Email = mongoose.model("email",emailSchema);

module.exports = Email;