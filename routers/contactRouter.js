const router = require("express").Router();
const Contact = require("../models/contactModel");
const auth = require("../middleware/auth");
const Event = require("../models/eventModel");
const nodemailer = require("nodemailer");
const twelve = require("twentyfour-to-twelve");

const hbs = require('nodemailer-express-handlebars');
const path = require('path');

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// creates a contact in mongoDB

router.post("/", auth, async (req, res) => {
  try {
    const { name, email, eventID } = req.body;
    
    const newContact = new Contact({
      name,
      email,
      eventID,
      user: req.user,
    });

    //validation of contact

    if (!name || !email) {
      return res
        .status(400)
        .json({ errorMessage: "Please enter a name and email" });
    }

    const savedContact = await newContact.save();

    res.json(savedContact);

  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// retrives the contacts from a specific event from mongoDB

router.get("/:eventid", auth, async (req, res) => {
  try {
    const eventid = req.params.eventid;
    const contacts = await Contact.find({ eventID: eventid });
    res.json(contacts);

    // can find specific contacts by adding to .find()
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user });
    res.json(contacts);

    // can find specific contacts by adding to .find()
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.put("/:contactId/event/delete/:eventId", async (req, res) => {
  try {
    const contactId = req.params.contactId;
    const eventId = req.params.eventId;
    const existingContact = await Contact.findById(contactId);
    if (!existingContact) {
      return res
        .status(400)
        .json({ errorMessage: "No customer with this ID was found" });
    }

    const index = existingContact.eventID.indexOf(eventId);
    if (index > -1) {
        existingContact.eventID.splice(index, 1);
    }

    const updatedContact = await existingContact.save();
    res.json(updatedContact);
  } catch (err) {
    res.status(500).send(err.response.data);
  }
});

router.put("/:contactId/event/add/:eventId", async (req, res) => {
  try {
    const contactId = req.params.contactId;
    const eventId = req.params.eventId;
    const existingContact = await Contact.findById(contactId);
    if (!existingContact) {
      return res
        .status(400)
        .json({ errorMessage: "No customer with this ID was found" });
    }

    const isAttending = existingContact.eventID.includes(eventId);


    if (!isAttending) {
        existingContact.eventID.push(eventId);
    }

    const updatedContact = await existingContact.save();
    const emailEvent = await Event.find({_id: eventId});

    var twelveHour = twelve(emailEvent[0].time)

    const handlebarsOptions = {
      viewEngine: {
        partialsDir: path.resolve('./views/'),
        defaultLayout: false,
      },
      viewPath: path.resolve('./views/'),
    };
    
    transporter.use('compile', hbs(handlebarsOptions));

    await transporter.sendMail({
      from: '"LINK2RSVP" <poc.demo.email@gmail.com>',
                to: existingContact.email,
                subject: emailEvent[0].title + " Details",
                template: 'email',
                context: {
                  eventTitle: emailEvent[0].title,
                  eventTime: twelveHour,
                  eventDate: emailEvent[0].name,
                  eventDescription: emailEvent[0].description,
                  vaccine: emailEvent[0].vaxReq,
                  eventId: emailEvent[0]._id,
                  contactId: existingContact._id
                },
                /*
                html: 
                "<h1>" + emailEvent[0].title + "</h1>" +
               "<h3>" + "Date: " + emailEvent[0].name + "<h3>" +
               "<h3>" + "Time: " + twelveHour + "<h3>" +
               "<h3>" + "Location: " + emailEvent[0].location + "<h3>" +
               "<h3>" + "Covid Vaccine Required: " + emailEvent[0].vaxReq + "<h3>" +
               "<h3>" + "Discription: " + emailEvent[0].description + "<h3>" +
               "\n" +
               "\n" +
               "<h4>" + "If you would like to RSVP to " + emailEvent[0].title + " please click the link " + `http://localhost:3000/rsvpEvent/${emailEvent[0]._id}/${existingContact._id}/0` +
               "\n" +
               "\n" +
               "<h4>" + "If you would like to unsubscribe from eamils from LINK2RSVP please click the link " + `http://localhost:3000/unSubscribe/${existingContact._id}`
    */
              })


    res.json(updatedContact);


  } catch (err) {
    res.status(500).send();
  }
});

// deletes contacts from mongoDB

router.delete("/:contactId", async (req, res) => {
  try {
    const iD = req.params.contactId;

    //validation
    if (!iD)
      return res.status(402).json({ errorMessage: "customerId not given" });

    const existingContact = await Contact.findById(iD);

    if (!existingContact)
      return res
        .status(400)
        .json({ errorMessage: "No user with this ID was found" });

    await existingContact.delete();

    res.status(200).json({succMessage: "you have unsubscribed"});

  } catch (err) {
    res.status(501).send();
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    const contactId = req.params.id;

    if (!name || !email) {
      return res
        .status(400)
        .json({ errorMessage: "Please enter all fields." });
    }

    if (!contactId) {
      return res.status(400).json({ errorMessage: "Contact ID not given" });
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
});

//check rsvp status for an event

router.post("/rsvped", async (req, res) => {
  try {
    const eventId = req.body.eventId;
    const contactId = req.body.contactId;
    
    const contact = await Contact.findById(contactId);
    
    const checkforRSVP = contact.rsvpCheck.includes(eventId);
    
    if (checkforRSVP)
      res.json("true");
    else 
      res.json("false");

  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
