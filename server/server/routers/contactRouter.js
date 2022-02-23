const router = require("express").Router();
const Contact = require("../models/contactModel");
const auth = require("../middleware/auth");
const Event = require("../models/eventModel");
const nodemailer = require("nodemailer");
const twelve = require('twentyfour-to-twelve');


let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
});

// creates a contact in mongoDB

router.post("/", auth, async (req, res) => {
    try {
        const { name, email, eventID} = req.body;
        

        const newContact = new Contact({
            name, email, eventID, user: req.user
        });

        //validation of contact

        if (!name || !email) {
            return res.status(400).json({erroerMessage: "you need to a name and email."});
        }

        const savedContact = await newContact.save();

        res.json(savedContact);

       /**
        * DO NOT DELETE THE CODE BELOW, IT IS NEEDED
         */ 
/*
        const emailEvent = await Event.find({_id: eventID});
        
        var twelveHour = twelve(emailEvent[0].time)
        //console.log(emailEvent);
        //console.log(emailEvent[0].time);
        
            await transporter.sendMail({
                from: '"LINK2RSVP" <poc.demo.email@gmail.com>',
                to: newContact.email,
                subject: emailEvent[0].title + "Details",
                html:
               "<h1>"+ emailEvent[0].title + "</h1>" +
               "<h3>" + "Date: " + emailEvent[0].name + "<h3>" +
               "<h3>" + "Time: " + twelveHour + "<h3>" +
               "<h3>" + "Location: " + emailEvent[0].location + "<h3>" +
               "<h3>" + "Discription: " + emailEvent[0].description + "<h3>" +
               "\n" +
               "\n" +
               "<h4>" + "If you would like to RSVP to " + emailEvent[0].title + " please click the link " + `http://localhost:3000/rsvpEvent/${emailEvent[0]._id}/${newContact._id}` +
               "\n" +
               "\n" +
               "<h4>" + "If you would like to unsubscribe from eamils from LINK2RSVP please click the link " + `http://localhost:3000/unSubscribe/${newContact._id}`
               
            })
            
*/

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

// retrives the contacts from a specific event from mongoDB

router.get("/:eventid", auth, async (req,res) => {
    try {
        const eventid = req.params.eventid;
        const contacts = await Contact.find({eventID: eventid});
        res.json(contacts);

        // can find specific contacts by adding to .find()

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.get("/", auth, async (req,res) => {
    try {
        
        const contacts = await Contact.find({user: req.user});
        res.json(contacts);

        // can find specific contacts by adding to .find()

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

// deletes contacts from mongoDB

router.delete("/:contactId", async (req, res) => {
    try {

        const iD = req.params.contactId;

        //validation
        if (!iD)
            return res.status(402).json({erroerMessage: "customerId not given"});

        const existingContact = await Contact.findById(iD);
        
        if (!existingContact)
            return res.status(400).json({erroerMessage: "No customer with this ID was found"});

        await existingContact.delete();

        res.json(existingContact);

    } catch(err) {
        res.status(500).send();
    }
});

router.delete("/:contactid/:eventid", async (req, res) => {
    try {
        const contactid = req.params.contactid;
        const eventid = req.params.eventid;
        
        const eventContact = await Contact.findById(contactid);
        
        const eventcontactArray = eventContact.eventID;
        
        const index = eventcontactArray.indexOf(eventid);
        
        eventcontactArray[index] = 0;

        eventContact.eventID = eventcontactArray;

        const updatedArray = await eventContact.save();

        res.json(updatedArray);

    } catch (err) {
        res.status(500).send();
    }
})

router.put("/:id", auth, async (req, res) => {
    try {
        const {name, email} = req.body;

        const contactId = req.params.id;
        
        if (!name || !email) {
            return res.status(400).json({errorMessage: "you need to enter all fields."});
        }

        if (!contactId) {
            return res.status(400).json({errorMessage: "Contact ID not given"});
        }

        const orginalContact = await Contact.findById(contactId);

        orginalContact.name = name;
        orginalContact.email = email;
        orginalContact._id = orginalContact._id;

        const savedContact = await orginalContact.save();

        res.json(savedContact);

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
})

router.put("/:eventid/:contactid/addtoevent", auth, async (req, res) => {
    try {
        const eventid = req.params.eventid;
        const contactID = req.params.contactid;

        const originalContact = await Contact.findById(contactID);

        originalContact.eventID.push(eventid);

        const savedContact = await originalContact.save();

        //mailing out event details and rsvp link

        const emailEvent = await Event.find({_id: eventid});

        const rsvpLimit = emailEvent[0].rsvpLimit - emailEvent[0].attendNumber;
        console.log(rsvpLimit);

        var twelveHour = twelve(emailEvent[0].time);
        
        await transporter.sendMail({
            from: '"LINK2RSVP" <poc.demo.email@gmail.com>',
            to: originalContact.email,
            subject: emailEvent[0].title + "Details",
            html:
           "<h1>"+ emailEvent[0].title + "</h1>" +
           "<h3>" + "Date: " + emailEvent[0].name + "<h3>" +
           "<h3>" + "Time: " + twelveHour + "<h3>" +
           "<h3>" + "Location: " + emailEvent[0].location + "<h3>" +
           "<h3>" + "Discription: " + emailEvent[0].description + "<h3>" +
           "\n" +
           "\n" +
           "<h4>" + "If you would like to RSVP to " + emailEvent[0].title + 
           " please click the link " + `https://wonderful-feynman-2756d5.netlify.app/rsvpEvent/${emailEvent[0]._id}/${originalContact._id}/${rsvpLimit}` +
           "\n" +
           "\n" +
           "<h4>" + "If you would like to unsubscribe from eamils from LINK2RSVP please click the link " + `https://wonderful-feynman-2756d5.netlify.app/unSubscribe/${originalContact._id}`
           
        })

        res.json(savedContact);

    } catch (err) {
        console.log(err);
        res.status(500).send();
    }
})

module.exports = router;

