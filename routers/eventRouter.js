const router = require("express").Router();
const Event = require("../models/eventModel");
const auth = require("../middleware/auth");
const nodemailer = require('nodemailer');
const twelve = require('twentyfour-to-twelve');




let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
});

// creating events in mongoDB
router.post("/", auth, async (req, res) => {
    try {
        const { name, time, location, title, description} = req.body;

        const newEvent = new Event({
            name, time, location, title, description, user: req.user,
        });

        //validation

        if (!time || !location || !title || !description) {
            return res.status(400).json({erroerMessage: "you need to enter all fields."});
        }

        const savedEvent = await newEvent.save();

        res.json(savedEvent);

        var twelveHour = twelve(time);
/*
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user:process.env.EMAIL,
                pass:process.env.PASSWORD
            }
        });
        */

        await transporter.sendMail({
            from:'"Link2RSVP" <link2rsvp.email.bot@gmail.com>',
            to: "poc.demo.email@gmail.com",
            subject: title,
            text:
            'EVENT DETAILS' + '\n' + '\n' +
            'Date: ' + name + '\n' +
            'Time: ' + twelveHour + '\n' +
            'Location: ' + location + '\n' +
            'Description: ' + description + '\n' +
            'Event ID: ' + newEvent._id + '\n' +
            'Enter the Event ID at http://localhost:3000/rsvpEvent to RSVP'

        });

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

//getting events from mongoDB

router.get("/", auth, async (req,res) => {
    try {
        

        const events = await Event.find({user: req.user});
        res.json(events);
        // can find specific events by adding to .find()

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.put("/:id/attendnumber", async (req, res) => {
    try {
        const eventId = req.params.id;

        const orginalEvent = await Event.findById(eventId);
        if (!orginalEvent)
            return res.status(400).json({errorMessage: "No event with this ID was found"});
       
        
        orginalEvent.attendNumber += 1;

        const savedEvent = await orginalEvent.save();
        res.json(savedEvent);


    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
})

// editing event

router.put("/:id", auth, async (req, res) => {
    try {
        const {name, time, location, title, description} = req.body;
        const eventId = req.params.id;

        //validation

        if (!time || !location || !title || !description) {
            return res.status(400).json({erroerMessage: "you need to enter all fields."});
        }

        if (!eventId)
            return res.status(400).json({errorMessage: "customer Id not given1."});

        const orginalEvent = await Event.findById(eventId);
        if (!orginalEvent)
            return res.status(400).json({errorMessage: "No customer with this ID was found "});

            if(orginalEvent.user.toString() !== req.user)
                return res.status(401).json({errorMessage: "unauthorized."});
        
        orginalEvent.name = name;
        orginalEvent.time = time;
        orginalEvent.location = location;
        orginalEvent.description = description;
        orginalEvent.title = title;

        const savedEvent = await orginalEvent.save();

        res.json(savedEvent);

        var twelveHour = twelve(time);

        await transporter.sendMail({
            from:'"Link2RSVP" <link2rsvp.email.bot@gmail.com>',
            to: "poc.demo.email@gmail.com",
            subject: title + " details have changed!",
            text:
            'New Event Details are Below' + '\n' + '\n' +
            'Date: ' + name + '\n' +
            'Time: ' + twelveHour + '\n' +
            'Location: ' + location + '\n' +
            'Description: ' + description + '\n' +
            'Event ID: ' + eventId + '\n' +
            'Enter the Event ID at http://localhost:3000/rsvpEvent to RSVP'

        });


    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
})


// delete event

router.delete("/:id", auth, async (req, res) => {
    try {

        const eventId = req.params.id;
        
        

        //validation
        if (!eventId)
            return res.status(400).json({erroerMessage: "customerId not given"});

        const existingEvent = await Event.findById(eventId);
        if (!existingEvent)
            return res.status(400).json({errorMessage: "No customer with this ID was found"});

        if(existingEvent.user.toString() !== req.user)
            return res.status(401).json({errorMessage: "Unauthorized."});

        await existingEvent.delete();

        res.json(existingEvent);

    } catch(err) {
        res.status(500).send();
    }
});


module.exports = router;