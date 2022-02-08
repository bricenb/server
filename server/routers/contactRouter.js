const router = require("express").Router();
const Contact = require("../models/contactModel");
const auth = require("../middleware/auth");
const uniqid = require('uniqid');

// creates a contact in mongoDB

router.post("/", auth, async (req, res) => {
    try {
        const { name, email} = req.body;
        const contactID = uniqid();

        const newContact = new Contact({
            name, email, contactID, user: req.user
        });

        //validation of contact

        if (!name || !email) {
            return res.status(400).json({erroerMessage: "you need to a name and email."});
        }

        const savedContact = await newContact.save();

        res.json(savedContact);

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

// retrives the contacts from mongoDB

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
        res.status(501).send();
    }
});

module.exports = router;

