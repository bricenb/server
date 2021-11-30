const router = require("express").Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validate } = require("../models/userModel");

// sign up

router.post("/", async (req, res) => {
    try{
        const {name, email, password, passwordVerify} = req.body;

        //validation

            // checks to make sure all fileds are there

        if(!email || !password || !passwordVerify || !name)
            return res.status(400).json({errorMessage: "Please enter all fields"});

            // checks lenght of password given

        if (password.length < 6)
            return res.status(400).json({errorMessage: "Please enter a password of at least 6 characters"});

            // ensures that the passwords match

        if (password !== passwordVerify)
            return res.status(400).json({errorMessage: "Passwords do not match"});

            // checks to see if a user with that email exist already

        const existingUser = await User.findOne({ email });
        if (existingUser) 
            return res.status(400).json({errorMessage: "an account with this email already esists."});
    
        //hasing the password for storage in mongoDB

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
        httpOnly: true
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
        })
            .send();

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

router.get("/loggedIn", (res,req) => {
    try {

        const token = req.cookies.token;

        if (!token) return;

        const validatedUser = jwt.verify(token, process.env.JWT_SECRET);
        
        res.json(validatedUser.id);

    } catch (err) {
        return res.status(404);
    }
})

module.exports = router;