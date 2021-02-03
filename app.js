require('dotenv').config();
const express = require("express")
const app = express();
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
// const encrypt = require("mongoose-encryption")
// const bcyrpt = require("bcrypt")
// const saltrounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

port = 3000

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({
    secret: "thisistheway",
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);



const secret = process.env.SECRET

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {

        console.log(profile)

        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", (req, res) => {
    res.render("home")
})

app.get("/auth/google",

    passport.authenticate("google", {
        scope: ['profile']
    })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
});

app.get("/login", (req, res) => {
    res.render("login")
})
app.get("/register", (req, res) => {
    res.render("register")
})
app.post("/register", (req, res) => {
    // bcyrpt.hash(req.body.password, saltrounds, (err, hash) => {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     })

    //     newUser.save((err) => {
    //         if (err) {
    //             console.log(err)
    //         } else {
    //             res.render("secrets")
    //         }
    //     })
    // })

    User.register({
        username: req.body.username
    }, req.body.password, (err, user) => {
        if (err) {
            console.log(err)
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets")
            })
        }

    })



})

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})

app.post("/login", (req, res) => {
    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({
    //     email: username
    // }, (err, result) => {
    //     if (err) {
    //         console.log(err)
    //     } else {
    //         if (result) {
    //             bcyrpt.compare(password, result.password, (err, result)=>{
    //                 if (result === true) {
    //                     res.render("secrets")
    //                 }

    //             })
    //         }
    //     }
    // })

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, (err) => {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets")
            })
        }
    })

})

app.get("/logout", (req, res) => {
    res.logout();
    res.redirect("/")
})

app.get("/submit",(req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/login")
    }
})

app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})