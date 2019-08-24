const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

//View Engine Set
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));

//Use 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//DataBase connection
//mongoose.connect("mongodb://localhost:27017/coDB",{ useNewUrlParser: true });
mongoose.connect("mongodb+srv://anand:unicornb1331@cluster0-0tquo.mongodb.net/coDB?retryWrites=true&w=majority");

mongoose.set('useCreateIndex', true);


//https://coonl.herokuapp.com/

// DataBase Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

//DataBase Collections
var userCollection = mongoose.model("userDetails",userSchema);

//Simplified Passport/Passport-Local Configuration
passport.use(userCollection.createStrategy());
 
passport.serializeUser(userCollection.serializeUser());
passport.deserializeUser(userCollection.deserializeUser());


//Get Home Page
app.get("/",(req,res)=>{
    res.render("home",{title:""});
});

//Log In Page
app.get("/login",(req,res)=>{
    res.render("login",{unsucessful: ""});
});



// Course Online Page
app.get("/coursesOnline",(req,res)=>{
    if (req.isAuthenticated()){
        res.render("courseOnline",{title: "Courses Online"});   //if the user is authenticated and loged in
    }else{
        res.redirect("/login");
    }
});

app.post("/login", function(req, res){

    const user = new userCollection({
      username: req.body.username,
      password: req.body.password
    });
  
    req.login(user, function(err){
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/coursesOnline");
        });
      }
    });
  
  });
  
//Register Page
app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/register",(req,res)=>{
    userCollection.register({username: req.body.username}, req.body.password,(error,user)=>{
        if (error){
            console.log(error);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,()=>{
               res.redirect("/coursesOnline"); 
            })
        }
    });
});

//Log Out 
app.get("/logout",(req,res)=>{
   req.logout();
   res.redirect("/");
});


// Dynamically allocated port in Heroku
app.listen(process.env.PORT || 3000, ()=>{
    console.log("Server Listening");
});