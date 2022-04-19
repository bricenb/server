/**
 * eventRouter.js handels all calls to the server that begin with /event
 * requires:
 * router from epxress
 * Event: event models
 * User: user models
 * auth: for authentication for request that require login
 * nodemailer: sending emails
 * twelve: converting time fromat *may remove
 * Contact: contact models
 * uniqid: creating unique IDs
 */
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

//setting up nodemailer for emails
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
});



/**
 * path: "event/"
 * creates an event in the mongodb data base
 */
router.post("/", auth, parser.single("articleImage"), async (req, res) => {
    try {
        //taking in request information
       if(req.body.vaxReq == "true") {
        vaxReq = true;
        } else {
        vaxReq = false;
        }

        console.log(req.body.vaxReq);
       

       const name = req.body.name;
       const time = req.body.time;
       const location = req.body.location;
       const title = req.body.title;
       const rsvpLimit = req.body.rsvpNum;
       const description = req.body.description;
       const articleImage = req.file.path;
       const eventID = uniqid();
        //checking if the values are null
        if (!time || !location || !title || !description || !name || !articleImage) {
        return res.status(401).json({errorMessage: "Please Enter all fields."});
        }
      
        //creating a new event
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

        //saving the newly created event
        const savedEvent = await newEvent.save();

        res.json(savedEvent);  
    }

     catch (err) {
        console.error(err);
        res.status(500).json({errorMessage: "Please Enter all required fields"});
    }
});

/**
 * path: "event/"
 * gets all events assinged to a certain user
 */
router.get("/", auth, async (req,res) => {
    try {
        //takes in logged user Id and finds events
        const events = await Event.find({user: req.user});
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});
/**
 * path: "event/:idEvent/:idContact/attendnumber"
 * takes in eventid number and contactid number,
 * thens adds rsvp check for that eventid to the contact
 */
router.put("/:idEvent/:idContact/attendnumber", async (req, res) => {
    try {
        //taking in infor from request
        const eventId = req.params.idEvent;
        const rsvpId = req.params.idContact;
        const message = req.body.message;
        
       

        //finding the event by eventId
        const orginalEvent = await Event.findById(eventId);
        //fiding contact by contactId
        const contactId = await Contact.findById(rsvpId);
        //finding host email from userId
        const hostEmail = await User.findById(orginalEvent.user);

        //if contact is not found return error
        if(!contactId){
            return res.status(404).json({errorMessage: "ID does not match any invited guest"});
        }
        //checks to see if this contact is has already rsvped to this event
        const checkforRSVP = contactId.rsvpCheck.includes(eventId);
        //if the contact has not rsvped
        if (!checkforRSVP) {
            contactId.rsvpCheck.push(eventId);
            await contactId.save();
        } else {
            return res.status(401).json({errorMessage: "You have already RSVPed to this event"});
        }
        
        //checks to make sure event exist
        if (!orginalEvent) {
            return res.status(400).json({errorMessage: "No event with this ID was found"});
        }
        //adds 1 to attendNumber of event
        orginalEvent.attendNumber += 1;
        //saves event with new attendNumber
        await orginalEvent.save();
        //sends email to host telling them who has rsvped
        await transporter.sendMail({
            from:'"Link2RSVP" <poc.demo.email@gmail.com>',
            to: hostEmail.email,
            subject: contactId.name + " has RSVPed",
            text: contactId.name + ' has rsvped to ' + orginalEvent.title +
            '\n' + 'message: ' + 
            message
        });
        

        res.json({message: "You have RSVPed"});

        


    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
})
//message to event attendess (May not need this, need to check if it is still in use)
router.put("/message/:id", auth, async (req, res) => {
    try {

        const id = req.params.id;
        const message = req.body.editorMessage;
        if(!id) {
            return res.status(400).json({errorMessage: "no event ID found"});
        }
        const orginalEvent = await Event.findById(id);
        const contacts = await Contact.find({eventID: id});
        const host = await User.findById(orginalEvent.user);

        for (var i in contacts) {
            
            await transporter.sendMail({
                from:'"Link2RSVP" <poc.demo.email@gmail.com>',
                to: contacts[i].email,
                subject: orginalEvent.title + " Message",
                text:
                'Message from host'+ host.name + '\n' + '\n' +
                 message
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

/**
 * path: "event/update"
 * take in event info and update the corresponding event in mongodb
 */
router.put("/update", parser.single("articleImage"), auth, async (req, res) => {
    try {
        //taking in info from request
        const {date, time, mesg, loc, id} = req.body;
        const orginalEvent = await Event.findById(id);
        //updating the event
        orginalEvent.name = date;
        orginalEvent.time = time;
        orginalEvent.location = loc;
        //saving event
        await orginalEvent.save();
        //convert formate of date from 24 hour to 12 hour
        var twelveHour = twelve(time);
        
        const emailEdit = await Contact.find({eventID: id});
        //emailing all invited guest to notify them about the update to the event
        for (var i in emailEdit) {
       
            await transporter.sendMail({
                from:'"Link2RSVP" <poc.demo.email@gmail.com>',
                to: emailEdit[i].email,
                subject: orginalEvent.title + " details have changed!",
                text:
                'New Event Details are Below' + '\n' + '\n' +
                mesg + '\n' +
                'Date: ' + date + '\n' +
                'Time: ' + twelveHour + '\n' +
                'Location: ' + loc + '\n' +
                'Description: ' + orginalEvent.description + '\n'
            })
        }
        //telling client the request has been completed
        res.status(200).json({succMessage: "Event details have been updated"});

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

/**
 * may not be in use
 * */
router.put("/:id", parser.single("articleImage"), auth, async (req, res) => {
    try {
        const {name, time, location, message} = req.body;
        //const articleImage = req.file.path;
        const eventId = req.params.id;
        
        //validation

        if (!time || !location || !name) {
            return res.status(400).json({errorMessage: "Please enter all fields."});
        }

        if (!eventId)
            return res.status(400).json({errorMessage: "customer Id not given."});

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
        orginalEvent.articleImage = orginalEvent.articleImage;
        orginalEvent.eventID = orginalEvent.eventID;

        
        const savedEvent = await orginalEvent.save();
        

        var twelveHour = twelve(time);
        
        const emailEdit = await Contact.find({eventID: eventId});
        
        for (var i in emailEdit) {
       
        await transporter.sendMail({
            from:'"Link2RSVP" <poc.demo.email@gmail.com>',
            to: emailEdit[i].email,
            subject: orginalEvent.title + " details have changed!",
            text:
            'New Event Details are Below' + '\n' + '\n' +
             message + '\n' +
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

/**
 * path: "/event/:id/spots"
 * gets the number of spots left open for an event
 */
router.get("/:id/spots", async (req, res) => {
    try {
        //taking in event idea
        const eventId = req.params.id;
        //checking if event is null
        if (!eventId) {
            return res.status(400).json({errorMessage: "No Event Found"})
        }
        //geting event from databse using eventId
        const spotsEvent = await Event.findById(eventId);
        //check to make sure event was found
        if(!spotsEvent) {
            return res.status(400).json({errorMessage: "No event found"});
        }
        //finding the number of spost left
        const spotsLeft = spotsEvent.rsvpLimit - spotsEvent.attendNumber;
        
        res.json(spotsLeft);
        res.status(200);


    } catch(err) {
        console.error(err);
        res.status(500).send();
    }
})

/**
 * path: "/event/vax/:id"
 * checks to see if an event requires a coivd vax
 */
router.get("/vax/:id", async (req, res) => {
    try {
        const eventID = req.params.id;
        //checking that event request is not null
        if (!eventID) {
            return res.status(400).json({errorMessage: "No Event Found"});
        }
        //finding event from eventID
        const vaxEvent = await Event.findById(eventID);
        //checking that an event is found in the database
        if (!vaxEvent) {
            return res.status(400).json({errorMessage: "No Event Found"});
        }
        //checking the vax reqirements for that event
        if (vaxEvent.vaxReq == true) {
            res.json("true");
        } else if (vaxEvent.vaxReq == false) {
            res.json("false");
        } else {
            return res.status(400).json({errorMessage: "No Vaccine Status Found"});
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.get("/eventdetails/:id", async (req, res) => {
    try {
        const eventId = req.params.id;

        if (!eventId) {
            return res.status(400).json({errorMessage: "Id not found"});
        }
        const event = await Event.findById(eventId);
        if(!event){
            return res.status(400).json({errorMessage: "Event not found"});
        }
        res.status(200).json(event);
    } catch (err) {
        return res.status(500).send();
    }
})

router.post("/message", async (req, res) => {
    try {
        const eventid = req.body.eventid;
        const message = req.body.message;
        const contactid = req.body.contactid;
        const event = await Event.findById(eventid);
        const user = await User.findById(event.user);

        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();
        let hour = today.getHours();
        if (hour < 10) {
            hour = '0'+hour;
        }
        let minutes = today.getMinutes();
        if (minutes < 10) {
            minutes = '0'+minutes;
        }
        const timeCurrent = hour+':'+minutes
        var twelveHour = twelve(timeCurrent);

        if(contactid === "0") {
            const newMessage = ({
                sender: user.name,
                message: message,
                eventID: eventid,
                isHost: true,
                date: mm+'/'+dd,
                time: twelveHour
            });
            event.messages.push(newMessage);
            await event.save();
            res.status(200).json({message: "succ"});
        } else {
            const contactMesg = await Contact.findById(contactid);
            console.log(contactMesg.name);
            const newMessage = ({
                sender: contactMesg.name,
                message: message,
                eventID: eventid,
                isHost: false,
                date: mm+'/'+dd,
                time: twelveHour
            });
            event.messages.push(newMessage);
            await event.save();
            res.status(200).json({message: "succ"});
        }
    } catch (err) {
        console.log(err);
        res.status(500).send();
    }
});

router.get("/getMessages/:eventid", async (req, res) => {
    try {
        const eventid = req.params.eventid;
        const event = await Event.findById(eventid);
        const messages = event.messages;
        res.status(200).json(messages);
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
});

router.get("/getSender/:sendid", async (req, res) => {
    try {
        const senderid = req.params.sendid;
        const sender = await User.findById(senderid);
        res.status(200).json(sender.name);
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
})

/**
 * path: "event/:id"
 * deletes the event
 */
router.delete("/:id", auth, async (req, res) => {
    try {
        //taking in info from request
        const eventId = req.params.id;
        
        //validation
        if (!eventId)
            return res.status(400).json({erroerMessage: "eventID not given"});
        //fining event from database
        const existingEvent = await Event.findById(eventId);
        //validatoin of found event
        if (!existingEvent)
            return res.status(400).json({errorMessage: "No event with this ID was found"});
        //making sure that the user who requested the delete is in fact the owner of the event
        if(existingEvent.user.toString() !== req.user)
            return res.status(401).json({errorMessage: "Unauthorized."});

        const hostId = existingEvent.user;
        const host = await User.findById(hostId);

        //if the date of deleteing the event is before the event date
        //then an email is sent out to all invited contacts
        //telling them about the cancelation
        if (Date.parse(existingEvent.name) > Date.now()) {
            //event canceled before planned event date
            const contacts = await Contact.find({eventID: eventId});
            for (var i in contacts) {
                await transporter.sendMail({
                    from: '"Link2RSVP" <poc.demo.email@gmail.com>',
                    to: contacts[i].email,
                    subject: existingEvent.title + " has been canceled",
                    text:
                    host.name + ' has canceled ' + existingEvent.title
                })
            }
            
            await existingEvent.delete();
            
        } else {
            //event canceled after panned event date
            
            await existingEvent.delete();
            
        }
        
        res.json(existingEvent);

    } catch(err) {
        res.status(500).send();
    }
});


module.exports = router;