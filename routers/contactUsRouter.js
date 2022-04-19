/**
 * contactUsRouter.js handels all calls to server that begin with /contactUs
 * 1 post
 * requires: 
 * router from express
 * nodemailer: sending emails
 * uniqid: creating unique id for users email *may take out*
 * 
 */
const router = require("express").Router();
const nodemailer = require('nodemailer');
const uniqid = require('uniqid');
//setting up nodemailer for emails
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
});
/**
 * path: "contactUs/"
 * takes in the email and message enter by the user.
 * checks that the values are not null.
 * assings the message a unique ID number for tracking
 * then sends the email to the link2rsvp team
 */
router.post("/", async (req, res) => {
    try {
        //taking in info from request
        const {email, message} = req.body;
        //checking that values are not null
        if(!email || !message) {
            return res.status(401).json({errorMessage: "Please enter the Email and Message fields"});
        }
        //creating message Id
        const mesgId = uniqid();
        //sending email that contains user message
        await transporter.sendMail({
            from: '"Link2RSVP" <poc.demo.email@gmail.com>',
            to: "poc.demo.email@gmail.com",
            subject: email + " Message:",
            text: message + " Message ID: " + mesgId
        })
        //reponse with the message id for the user
        res.json({message: "Message sent. ID: " + mesgId});

    } catch (err) {
        console.log(err);
        res.status(500).send();
    }
});

module.exports = router;