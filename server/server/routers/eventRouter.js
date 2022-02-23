const router = require("express").Router();
const Event = require("../models/eventModel");
const User = require("../models/usermodel");
const auth = require("../middleware/auth");
const nodemailer = require('nodemailer');
const twelve = require('twentyfour-to-twelve');
const Contact = require("../models/contactModel");
const multer = require("multer");
const parser = require("../middleware/cloudinary.config");
const uniqid = require('uniqid');


let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
});



// creating events in mongoDB
router.post("/", auth, parser.single("articleImage"), async (req, res) => {
    try {
       // const { name, time, location, title, description, articleImage} = req.body;

       if(req.body.vaxReq == "on") {
        vaxReq = true;
        } else {
        vaxReq = false;
        }
       

       const name = req.body.name;
       const time = req.body.time;
       const location = req.body.location;
       const title = req.body.title;
       const rsvpLimit = req.body.rsvpNum;
       const description = req.body.description;
       const articleImage = req.file.path;
       const eventID = uniqid();

      

        const newEvent = new Event({
            name,
            time,
            location,
            title,
            description,
            rsvpLimit,
            vaxReq,
            articleImage,
            eventID,
            user: req.user,
        });

        //validation

        if (!time || !location || !title || !description) {
            return res.status(400).json({erroerMessage: "you need to enter all fields."});
        }

        const savedEvent = await newEvent.save();

        res.json(savedEvent);  
    }

     catch (err) {
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


router.put("/:idEvent/:idContact/attendnumber", async (req, res) => {
    try {
        
        const eventId = req.params.idEvent;
        const rsvpId = req.params.idContact;

        const message = req.body.message;
        
       


        const orginalEvent = await Event.findById(eventId);
        const contactId = await Contact.findById(rsvpId);
        const hostEmail = await User.findById(orginalEvent.user)


        
        
        if (!orginalEvent) {
            return res.status(400).json({errorMessage: "No event with this ID was found"});
        }

        if (orginalEvent.attendNumber == orginalEvent.rsvpLimit) {
            return res.status(500).json({errorMessage: "No more spots left to RSVP"});
        }
       
        
        orginalEvent.attendNumber += 1;

        const savedEvent = await orginalEvent.save();

        await transporter.sendMail({
            from: '"Link2RSVP" <poc.demo.email@gmail.com>',
            to: hostEmail.email,
            subject: contactId.name + " has RSVPed",
            text: contactId.name + ' has rsvped to ' + orginalEvent.title +
            '\n' +
            message
        });
        

        res.json(savedEvent);
        res.status(200).json({Message: "You have RSVPed"});

        


    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
})

// editing event

router.put("/:id", parser.single("articleImage"), auth, async (req, res) => {
    try {
        const {name, time, location, message} = req.body;
        const articleImage = req.file.path;
        const eventId = req.params.id;
        console.log(message);
        //validation

        if (!time || !location || !name) {
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
        orginalEvent.description = orginalEvent.description;
        orginalEvent.title = orginalEvent.title;
        orginalEvent.articleImage = articleImage;
        orginalEvent.eventID = orginalEvent.eventID;

        
        const savedEvent = await orginalEvent.save();
        

        var twelveHour = twelve(time);
        
        const emailEdit = await Contact.find({eventID: eventId});
        
        for (var i in emailEdit) {
       
        await transporter.sendMail({
            from:'"Link2RSVP" <link2rsvp.email.bot@gmail.com>',
            to: emailEdit[i].email,
            subject: orginalEvent.title + " details have changed!",
            text:
            'New Event Details are Below' + '\n' + '\n' +
             message + 
            'Date: ' + name + '\n' +
            'Time: ' + twelveHour + '\n' +
            'Location: ' + location + '\n' +
            'Description: ' + orginalEvent.description + '\n' +
            'Event ID: ' + eventId + '\n'

        });
       
        res.json(savedEvent);
    }


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