const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

//EJS set
app.set("view engine","ejs");

//Use 
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//DataBase connection
mongoose.connect("mongodb://localhost:27017/coDB",{ useNewUrlParser: true });

//DataBase Collections
var userCollection = mongoose.model("userDetails",{
    name: String,
    email: String,
    password: String
});


//Get Home Page
app.get("/",(req,res)=>{
    res.render("home",{title:""});
});

//Log In Page
app.get("/login",(req,res)=>{
    res.render("login",{unsucessful: ""});
});

app.post("/login",(req,res)=>{
    var email = req.body.email;
    var password = req.body.password;
    userCollection.findOne({email: email},(error,foundError)=>{
        if (error){
            console.log(error);
        }else{
            if(foundError.password === password){
                res.render("home",{title:""});
            }else{
               res.render("login",{unsucessful: "Login Unsuccessful, please try again"});
            }
        }
    });
});

//Register Page
app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/register",(req,res)=>{
    var user = userCollection(req.body);
    user.save((error,data)=>{
        if (error){
            console.log("error in Registration :"+ error);
        }else {
            res.render("home",{title: "Welcome"});
        }
    });
});


// Dynamically alocated port in Heroku
app.listen(process.env.PORT || 3000, ()=>{
    console.log("Server Listening");
});