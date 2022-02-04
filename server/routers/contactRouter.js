const router = require("express").Router();
const Contact = require("../models/contactModel");
const auth = require("../middleware/auth");

// creates a contact in mongoDB

router.post("/", auth, async (req, res) => {
    try {
        const { name, email} = req.body;

        const newContact = new Contact({
            name, email, user: req.user
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

router.delete("/:id", auth, async (req, res) => {
    try {

        const contactId = req.params.id;
        
        

        //validation
        if (!contactId)
            return res.status(400).json({erroerMessage: "customerId not given"});

        const existingContact = await Contact.findById(contactId);
        if (!existingContact)
            return res.status(400).json({erroerMessage: "No customer with this ID was found"});

        await existingContact.delete();

        res.json(existingContact);

    } catch(err) {
        res.status(500).send();
    }
});

module.exports = router;

