const mongoose = require("mongoose");

//creates user schema in mongoDB
//user needs name, email, password

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, reqired: true},
    passwordHash: {type: String, required: true},
}, {
    timestamps: true,
});

const User = mongoose.model("user", userSchema);

module.exports = User;