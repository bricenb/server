const router = require("express").Router();
const nodemailer = require('nodemailer');

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

        await transporter.sendMail({
            from: '"Link2RSVP" <poc.demo.email@gmail.com>',
            to: "poc.demo.email@gmail.com",
            subject: email + " Message",
            text: message
        })

        res.json({message: "your message has been sent"});
        console.log("yes");


    } catch (err) {
        console.log(err);
        res.status(500).send();
    }
});

module.exports = router;