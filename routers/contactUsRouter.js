const router = require("express").Router();
const nodemailer = require('nodemailer');
const uniqid = require('uniqid');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
});

router.post("/", async (req, res) => {
    try {
        const {email, message} = req.body;
        if(!email || !message) {
            return res.status(401).json({errorMessage: "Please enter the Email and Message fields"});
        }

        const mesgId = uniqid();

        await transporter.sendMail({
            from: '"Link2RSVP" <poc.demo.email@gmail.com>',
            to: "poc.demo.email@gmail.com",
            subject: email + " Message:",
            text: message + " Message ID: " + mesgId
        })

        res.json({message: "Message sent. ID: " + mesgId});

    } catch (err) {
        console.log(err);
        res.status(500).send();
    }
});

module.exports = router;