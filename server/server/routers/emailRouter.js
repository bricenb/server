const router = require("express").Router();
const Email = require("../models/emailModel");
const auth = require("../middleware/auth");
const nodemailer = require('nodemailer');


router.post("/", auth, async (req, res) => {
    try {
        const { location, date, time, message, } = req.body;

        const newEmail = new Email({
            location, date, time, message, user: req.user,
        });

        //validation

        if (!time || !location || !date || !message) {
            return res.status(400).json({erroerMessage: "you need to enter all fields."});
        }

        const savedEmail = await newEmail.save();

        res.json(savedEmail);


        let transporter = nodemailer.createTransport({
            service:'gmail',
            auth: {
                user:process.env.EMAIL,
                pass:process.env.PASSWORD
            }
        });
    
        let mailOptions = {
            from:'link2rsvp.mail.bot@gmail.com',
            to: 'poc.demo.email@gmail.com',
            subject: 'test',
            html:`

                <h3>Event Information</h3>
                    <ul>
                    <li>Location: ${location}</li>
                    <li>Date: ${date}</li>
                    <li>Time: ${time}</li>
                    </ul>
                <p>${message}</p>
            `,
        };
    
        transporter.sendMail(mailOptions, function(err, data){
            if(err){
                console.log('error');
            }else{
                console.log('Success');
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

module.exports = router;