/**
 * auth.js houses the backends authentication. When a server request requires a user
* to be logged in, auth is called to check their cookie.   
*/
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    try {

        const token = req.cookies.token;
        

        if (!token) return res.status(401).json({errorMessage: "Unauthroized"});

        const verified = jwt.verify(token, process.env.JWT_SECRET);

        req.user = verified.user;

        next();

    } catch (err) {
        console.error(err);
        res.status(401).json({errorMessage: "Unauthorized"});
    }
}

module.exports = auth;