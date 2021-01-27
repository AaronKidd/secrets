require('dotenv').config();

const express = require("express")
const app = express();
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption")
const md5 = require("md5")
port = 3000

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}))

mongoose.connect("mongodb://localhost:27017/userDB", {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
}) 

const secret = process.env.SECRET





const User = new mongoose.model("User",userSchema)


app.get("/", (req,res)=>{
    res.render("home")
})

app.get("/login", (req,res)=>{
    res.render("login")
})
app.get("/register", (req,res)=>{
    res.render("register")
})
app.post("/register", (req, res)=>{
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })

    newUser.save((err)=>{
        if(err){
            console.log(err)
        } else {
            res.render("secrets")
        }
    })


})

app.post("/login", (req,res)=>{
    const username= req.body.username;
    const password= md5(req.body.password);

    User.findOne({email: username}, (err,result)=>
    {if (err){
        console.log(err)
    } else{
        if (result){
            if(result.password===password){
                res.render("secrets")
            }
        }
    }})

})

app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
