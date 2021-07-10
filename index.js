const User = require('./models/user');
const { auth } = require('./middlewares/auth');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
const Twilio = require('twilio');
const db = require('./config/config').get(process.env.NODE_ENV);

require('dotenv').config();


const app = express();
// app use
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.Origin,

}));

// database connection
mongoose.Promise = global.Promise;
mongoose.connect(db.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
    if (err) console.log(err);
    console.log("database is connected");
});


app.get('/', function (req, res) {
    res.status(200).send(`Welcome to login , sign-up api`);
});

// listening port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`app is live at ${PORT}`);
});

// adding new user (sign-up route)
app.post('/api/register', function (req, res) {
    // taking a user
    const newuser = new User(req.body);

    if (newuser.password != newuser.password2) return res.json({ auth: false, message: "Password does not match" });

    User.findOne({ email: newuser.email }, function (err, user) {
        if (user) return res.json({ auth: false, message: "Email already exists" });

        newuser.save((err, doc) => {
            if (err) {
                console.log(err);
                return res.status(400).json({ success: false });
            }
            res.status(200).json({
                success: true,
                user: doc
            });
        });
    });
});

app.put('/api/addchannel', function (req, res) {
    //const newchannel = new Channel(req.body);
    User.updateOne(
        { name: req.body.name },
        { $addToSet: { channels: req.body.channels } },
        function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);
            }
        }
    );

});

// login user
app.post('/api/login', function (req, res) {
    let token = req.cookies.auth;
    User.findByToken(token, (err, user) => {
        if (err) return res(err);
        if (user) return res.status(400).json({
            error: true,
            message: "You are already logged in"
        });

        else {
            User.findOne({ 'email': req.body.email }, function (err, user) {
                if (!user) return res.json({ isAuth: false, message: ' Email not found' });

                user.comparepassword(req.body.password, (err, isMatch) => {
                    if (!isMatch) return res.json({ isAuth: false, message: "Password is incorrect" });

                    user.generateToken((err, user) => {
                        console.log(err);
                        if (err) return res.status(400).send(err);
                        res.cookie('auth', user.token).json({
                            isAuth: true,
                            id: user._id
                            , email: user.email
                        });
                    });
                });
            });
        }
    });
});


app.post('/api/msgwebhook', function (req, res) {
    console.log(req.body);
    res.status(200).send();
});

// get logged in user
app.get('/api/profile', auth, function (req, res) {
    res.json({
        isAuth: true,
        id: req.user._id,
        email: req.user.email,
        name: req.user.firstname + " " + req.user.lastname,
        channels: req.user.channels

    })
});

//add token
app.get('/api/token', auth, function (req, res) {
    const twilioAccountSid = process.env.ACCOUNT_SID;
    const twilioApiKey = process.env.API_KEY;
    const twilioApiSecret = process.env.API_SECRET;
    const identity = req.user.email;

    const AccessToken = Twilio.jwt.AccessToken;

    const token = new AccessToken(
        twilioAccountSid,
        twilioApiKey,
        twilioApiSecret,
        { identity: identity }
    );

    const VideoGrant = AccessToken.VideoGrant;
    const videoGrant = new VideoGrant();
    token.addGrant(videoGrant);

    const ChatGrant = AccessToken.ChatGrant;

    const chatGrant = new ChatGrant({
        serviceSid: process.env.SERVICE_SID,
    });

    token.addGrant(chatGrant);

    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.OUTGOING_SID,
        incomingAllow: true // allows your client-side device to receive calls as well as make them
    });

    token.addGrant(voiceGrant);

    res.json({
        accessToken: token.toJwt(),
    })

})

//logout user
app.get('/api/logout', auth, function (req, res) {
    req.user.deleteToken(req.token, (err, user) => {
        if (err) return res.status(400).send(err);
        res.sendStatus(200);
    });

});