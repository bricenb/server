/**
 * userRouter.js handels all calls to server that begin with /auth
 * requires: 
 * router for express
 * User: user model schema
 * bcrypt: for hashing password
 * jwt: for cookie tokens
 * nodemalier: for sending email
 */
const router = require("express").Router();
const User = require("../models/usermodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validate } = require("../models/usermodel");
const nodemailer = require('nodemailer');
//setting up nodemailer for emails
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
});

//creates a new user account

router.post("/", async (req, res) => {
    try{
        //takes in request info
        const {name, email, password, passwordVerify} = req.body;

        //validation

            // checks to make sure all fileds are there

        if(!email || !password || !passwordVerify || !name)
            return res.status(401).json({errorMessage: "Please enter all fields"});

            // checks lenght of password given

        if (password.length < 6)
            return res.status(401).json({errorMessage: "Please enter a password of at least 6 characters"});

            // ensures that the passwords match

        if (password !== passwordVerify)
            return res.status(401).json({errorMessage: "Passwords do not match"});

            // checks to see if a user with that email exist already

        const existingUser = await User.findOne({ email });
        if (existingUser) 
            return res.status(401).json({errorMessage: "an account with this email already esists."});

        var newEmail = email;
        const pattern = /\S+@\S+\.\S+/;
        const valid = pattern.test(newEmail);
        if(!valid){
            return res.status(401).json({errorMessage: "Please enter a valid email format. Ex: ex@email.com"});
        }

        
    
        //hashing the password for storage in mongoDB

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        // save a new user account to database

        const newUser = new User({
         name, email, passwordHash
        });

        const savedUser = newUser.save();

        

        //sign the token

        const token = jwt.sign({
            user: savedUser._id,
            }, process.env.JWT_SECRET);

        // send token in HTTP only cookie

     res.cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true
        })
        .send();

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

//log in

router.post("/login", async (req, res) => {
   try {

        const { email, password} = req.body;

        //validate

        //ensures all fields are entered

        if(!email || !password)
        return res.status(400).json({errorMessage: "Please enter all fields"});

        const pattern = /\S+@\S+\.\S+/;
        const valid = pattern.test(email);
        if(!valid){
            return res.status(401).json({errorMessage: "Please enter a valid email format. Ex: ex@email.com"});
        }

        //ensures that an email has an account already

        const existingUser = await User.findOne({email});
        if (!existingUser)
            return res.status(401).json({errorMessage: "wrong email or password"});

        //takes the hashed password from mongoDB and compares it to the one given by user

        const passwordCorrect = await bcrypt.compare(password, existingUser.passwordHash);
        if (!passwordCorrect)
            return res.status(401).json({errorMessage: "Wrong email or password."});

        const token = jwt.sign(
            {
                user: existingUser._id,
            },
            process.env.JWT_SECRET
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true
        }).send();

   } catch (err) {
        console.error(err);
        res.status(500).send();
   }
});

// password reset

router.put("/passwordreset", async (req, res) => {
    try {
        const email = req.body.email;
        //checks to see if email is null
        if (!email) {
            return res.status(400).json({errorMessage: "please enter an email"});
        }

        const existingUser = await User.findOne({email});
        //checks to see if the user exist
        if (!existingUser) {
            return res.status(200);
        }
        
        //if the user exist sends a reset email
        await transporter.sendMail({
            from:'"Link2RSVP" <poc.demo.email@gmail.com>',
            to: existingUser.email,
            subject: "Password Reset",
            text:
            'To reset your password, please follow the link below' + '\n' +
            `https://link2rsvp.netlify.app/newpasswordcreate/${existingUser._id}` + '\n' +
            'If you did not request for your password to be changed,' + '\n' +
            'Ignore this email.'
        })
        
        res.status(200).json({succMessage: "completed"});

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }

});

// create new password
router.put("/newpass", async (req, res) => {
    try {
        const id = req.body.id;
        const newPass = req.body.newPass;
        const confirmPass = req.body.confirmPass;
        // checks if the values are null
        if(!newPass || ! confirmPass) {
            return res.status(401).json({errorMessage: "Please enter all fields"});
        }
        //checks to make sure the password is longer than 6 characters
        if (newPass.length < 6) {
            return res.status(402).json({errorMessage: "Password must be at least 6 characters long"});
        }
        //checks to make sure the passwords match
        if (newPass !== confirmPass){
            return res.status(403).json({errorMessage: "Passwords do not match"});
        }
        //finds the user
        const user = await User.findById(id);
        //creates new password and replaces the old one
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(newPass, salt);

        user.passwordHash = passwordHash;

        user.save();
        
        res.status(200).json({succMessage: "Your password has been reset"});

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});


// logout

router.get("/logout", (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0)
    })
    .send();
});

//gets the info of the logged in user
router.post("/loggedin", async (req, res) => {
    try {
        
        const {email} = req.body;

        const user = await User.find({email: email});
        res.json(user[0].name);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
})

module.exports = router;