/**
 * contactRouter.js handels all calls to server that begin with /contact
 * 3 post request
 * 2 get request
 * 1 delete request
 * 3 put request
 * 
 * requires:
 * router: from express
 * Contact: for use of contact model
 * auth: for authentication
 * Event: for use of Event model
 * nodemailer: for sending emails
 * twelve: used for converting time formates *may take out*
 * hbs: used for email formate
 */
const router = require("express").Router();
const Contact = require("../models/contactModel");
const auth = require("../middleware/auth");
const Event = require("../models/eventModel");
const User = require("../models/usermodel");
const nodemailer = require("nodemailer");
const twelve = require("twentyfour-to-twelve");
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
// seetting up nodemailer for use in the router
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

/**
 * path: "contact/"
 * used for creating contact and storing contact in mongodb
 * takes the name, email, and eventID from client side,
 * ensure that values are not null,
 * then saves the contact
 */
router.post("/", auth, async (req, res) => {
  try {
    //getting info from request
    const { name, email, eventID } = req.body;

     //validation of contact
     if (!name || !email) {
      return res
        .status(400)
        .json({ errorMessage: "Please enter a name and email" });
    }

    const contacts = await Contact.find({ user: req.user });
    for (i in contacts){
      if(contacts[i].email == email){
        return res.status(400).json({errorMessage: "This email is already assinged to a contact"});
      }
    }

    const pattern = /\S+@\S+\.\S+/;
    const valid = pattern.test(email);
    if(!valid){
      return res.status(401).json({errorMessage: "Please enter a valid email format. Ex: ex@email.com"});
    }
    
    const newContact = new Contact({
      name,
      email,
      eventID,
      user: req.user,
    });

    //saving contact
    const savedContact = await newContact.save();
    //responding with saved contact
    res.json(savedContact);

  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});


/**
 * path: "contact/qrcode"
 * creates contact via QRcode.
 * If a guest rsvps from a qrcode and they are not a contact
 * in the host contact list, they are saved here
 * same as path: "contact/" but with extra validation
 */
router.post("/qrcode", async (req, res) => {
  try {
    //getting data from client request
    const eventID = req.body.eventId;
    const name = req.body.name;
    const email = req.body.email;
    //finding the event for which the QRcode represented
    const event = await Event.findById(eventID);
    //converting time format, from 24 hour to 12 hour
    var twelveHour = twelve(event.time);
    //getting the host information
    const user = event.user;
    //finding all of the host contacts and storing in array
    const userContacts = await Contact.find({user: user});
    //finding and implementing email formating
    const handlebarsOptions = {
      viewEngine: {
        partialsDir: path.resolve('./views/'),
        defaultLayout: false,
      },
      viewPath: path.resolve('./views'),
    };

    transporter.use('compile', hbs(handlebarsOptions));
    //end of fiding and implementing email formating

    //loops through host contact array to find it new contact's email 
    //already exist.
    for (var i in userContacts) {
      if(userContacts[i].email == email) {
        if(userContacts[i].eventID.includes(eventID)){
          //if that contact's email has already been invited
          return res.status(400).json({errorMessage: "This email has already been invited to this event"});
        } else {
        //If the contact exist but has not been invited, they are not invited
        userContacts[i].eventID.push(eventID);
        await transporter.sendMail({
          from: '"LINK2RSVP" <poc.demo.email@gmail.com>',
          to:email,
          subject: event.title,
          template: 'email',
          context: {
            hostName: userName.name,
            eventTitle: event.title,
            eventTime: twelveHour,
            eventDate: event.name,
            eventDescription: event.description,
            vaccine: event.vaxReq,
            eventId: event._id,
            contactId: userContacts[i]._id
          }
        });
        await userContacts[i].save();
        return res.status(200).json({succMessage: "An invite has been sent to your email"});
      }
      } 
    }
  //contact does not exist so creating one and inviting
    const newContact = new Contact({
      name,
      email,
      eventID,
      user
    });
    //saving new contact
    const savedContact = await newContact.save();
    //sending invitation to new contact
    await transporter.sendMail({
      from: '"LINK2RSVP" <poc.demo.email@gmail.com>',
      to:email,
      subject: event.title,
      template: 'email',
      context: {
        hostName: userName.name,
        eventTitle: event.title,
        eventTime: twelveHour,
        eventDate: event.name,
        eventDescription: event.description,
        vaccine: event.vaxReq,
        eventId: event._id,
        contactId: savedContact._id
      }
    });

    res.status(200).json({succMessage: "Please check your email for the rsvp link"});
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// retrives the contacts from a specific event from mongoDB
/**
 * path: "contact/:eventid"
 * gets all contacts from an specific event
 * based off of eventID
 */
router.get("/:eventid", auth, async (req, res) => {
  try {
    //getting info from request
    const eventid = req.params.eventid;
    //finding all contacts that have been invited to this event
    const contacts = await Contact.find({ eventID: eventid });
    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

/**
 * path: "contact/"
 * gets and reponses with all contacts assinged to a user
 */
router.get("/", auth, async (req, res) => {
  try {
    //getting and storing all contacts, assinged to a user, to an array 
    const contacts = await Contact.find({ user: req.user });
    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

/**
 * path: "contact/:contactId/event/delete/:eventId"
 */
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

/**
 * path: "contact/:contactId/event/add/:eventId"
 */
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

    const userName = await User.findById(emailEvent[0].user);

    await transporter.sendMail({
      from: '"LINK2RSVP" <poc.demo.email@gmail.com>',
                to: existingContact.email,
                subject: emailEvent[0].title + " Details",
                template: 'email',
                context: {
                  hostName: userName.name,
                  eventTitle: emailEvent[0].title,
                  eventTime: twelveHour,
                  eventDate: emailEvent[0].name,
                  eventDescription: emailEvent[0].description,
                  vaccine: emailEvent[0].vaxReq,
                  eventId: emailEvent[0]._id,
                  contactId: existingContact._id
                },
              })


    res.json(updatedContact);


  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

/**
 * paht: "contact/:contactId"
 * deletes a contact based off of contactId
 */

router.delete("/:contactId", async (req, res) => {
  try {
    //takes in info from request
    const iD = req.params.contactId;

    //validates that the info provied is not null
    if (!iD)
      return res.status(402).json({ errorMessage: "customerId not given" });
    //finds the contact that is to be deleted
    const existingContact = await Contact.findById(iD);
    //if the contact cant be found, returns an error
    if (!existingContact)
      return res
        .status(400)
        .json({ errorMessage: "No user with this ID was found" });
    //deletes the contact
    await existingContact.delete();
    
    res.status(200).json({succMessage: "you have unsubscribed"});

  } catch (err) {
    res.status(500).send();
  }
});

/**
 * path: "contact/:id"
 * edits a contact based on contacts Id
 */
router.put("/:id", auth, async (req, res) => {
  try {
    //tales in info from request
    const { name, email } = req.body;

    const contactId = req.params.id;
    //validates that the info is not null
    if (!name || !email) {
      return res
        .status(400)
        .json({ errorMessage: "Please enter all fields." });
    }
    //If a contact is not found returns an error
    if (!contactId) {
      return res.status(400).json({ errorMessage: "Contact ID not given" });
    }
    const contacts = await Contact.find({ user: req.user });
    for (i in contacts){
      if(contacts[i].email == email){
        const orginalContact = await Contact.findById(contactId);
        orginalContact.name = name;
        const savedContact = await orginalContact.save();
        return res.status(200).json(savedContact);
      }
    }
    //fins the contact by contactId
    const orginalContact = await Contact.findById(contactId);
    //updates the orignal contact with new values
    orginalContact.name = name;
    orginalContact.email = email;
    orginalContact._id = orginalContact._id;
    //saves the updated contact
    const savedContact = await orginalContact.save();
    //responses with saved contact
    res.json(savedContact);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});


/**
 * path: "/contact/rsvped"
 * checks if a contact has rsvped to a certain event
 */
router.post("/rsvped", async (req, res) => {
  try {
    //takes in info from request
    const eventId = req.body.eventId;
    const contactId = req.body.contactId;
    //find the contact based off of contactId
    const contact = await Contact.findById(contactId);
    //check to make sure contact is found
    if (!contact) {
      return res.status(200).json({errorMessage: "Contact not found"});
    }
    //checks the contacts rsvp status basd off of eventId
    const checkforRSVP = contact.rsvpCheck.includes(eventId);
    //respondes with the contacts rsvp status for that event
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
