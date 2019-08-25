const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const request = require('request');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

//View Engine Set
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

//Use 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//DataBase connection
/*mongoose.connect("mongodb://localhost:27017/coDB", {
    useNewUrlParser: true
});*/

mongoose.connect("mongodb+srv://anand:unicornb1331@cluster0-0tquo.mongodb.net/coDB?retryWrites=true&w=majority");

mongoose.set('useCreateIndex', true);


//https://coonl.herokuapp.com/
//http://localhost:3000

// DataBase Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    course: String,
    approval: String,
    doubt: String,
    reply: String
});

userSchema.plugin(passportLocalMongoose);

const contentSchema = new mongoose.Schema({
    title: String,
    description: String,
    content: String
});

//DataBase Collections
var userCollection = mongoose.model("userdetails", userSchema);
var courseCollection = mongoose.model("coursedetails", contentSchema);

//Simplified Passport/Passport-Local Configuration
passport.use(userCollection.createStrategy());

passport.serializeUser(userCollection.serializeUser());
passport.deserializeUser(userCollection.deserializeUser());

////////////Get All Course Content API///////////////
var courseContentDisplay = "https://coonl.herokuapp.com/displayCourseContent";

app.get("/displayCourseContent", (req, res) => {
    courseCollection.find((error, data) => {
        if (error) {
            console.log(error);
        } else {
            res.send(data);
        }
    });
});

///////////////////////////Get Home Page///////////////////////
app.get("/", (req, res) => {
    request(courseContentDisplay, (error, response, body) => {
        console.log(error);
        console.log(response);
        var data = JSON.parse(body);
        res.render("home", {
            title: "Home",
            data: data
        });
    });
});

////////////////////// Single Course Display from Home Page///////////////////////////////
app.get("/singleCourse/:id", (req, res) => {
    var y = req.params.id;
    courseCollection.find({
        _id: y
    }, (error, data) => {
        if (error) {
            console.log(error);
        } else {
            res.send(data);
        }
    });
});

var singleCourseDisplayApi = "https://coonl.herokuapp.com/singleCourse/";

app.get("/courseView/:id", (req, res) => {
    var x = req.params.id;
    request(singleCourseDisplayApi + x, (error, response, body) => {
        console.log(error);
        console.log(response);
        var data = JSON.parse(body);
        res.render("singleCourseViewHome", {
            title: "Course",
            data: data[0]
        });
    });

});
//////////////////////////////////Full Course View Home //////////////////////////////////
app.get("/fullCourseView/:id", (req, res) => {
    var x = req.params.id;
    request(singleCourseDisplayApi + x, (error, response, body) => {
        console.log(error);
        console.log(response);
        var data = JSON.parse(body);
        if (req.isAuthenticated()) {
            res.render("fullCourseView", {
                title: "Courses",
                data: data[0]
            });
        } else {
            res.redirect("/login");
        }
    });
});

///////////////////////////////// Course Online Page//////////////////////////////////////
app.get("/courseOnlineDisplay", (req, res) => {
    courseCollection.find((error, data) => {
        if (error) {
            console.log(error);
        } else {
            res.send(data);
        }
    })
})

var courseOnlineCourseDisplay = "https://coonl.herokuapp.com/courseOnlineDisplay";

app.get("/coursesOnline", (req, res) => {
    request(courseOnlineCourseDisplay, (error, response, body) => {
        console.log(error);
        console.log(response);
        var data = JSON.parse(body);
        if (req.isAuthenticated()) {
            res.render("courseOnline", {
                title: "Courses Online",
                data: data
            });
        } else {
            res.redirect("/login");
        }
    });
});

app.get("/learn/:id", (req, res) => {
    if (req.isAuthenticated()) {
        var courseId = req.params.id;
        var userId = req.user.id;
        console.log(courseId);
        console.log(userId);
        userCollection.findById(req.user.id,(error,foundUser)=>{
            if(error){
                console.log(error);
            }else{
                if(foundUser){
                    foundUser.course = courseId;
                    foundUser.approval = "0";
                    foundUser.save(()=>{
                        res.redirect("/coursesOnline")
                    });
                }
            }
        })
    } else {
        res.redirect("/login");
    }
});

///////////////////////////////////////My Courses//////////////////////////////////////////
app.get("/courseOnlineDisplay/:id",(req,res)=>{
    var x = req.params.id;
    courseCollection.find({_id: x},(error,data)=>{
        if(error){
            console.log(error);
        }else{
            res.send(data);
        }
    });
});

var myCourseViewApi = "https://coonl.herokuapp.com/courseOnlineDisplay/"

app.get("/mycourses",(req,res)=>{
    if (req.user.approval == 0){
        res.render("myCoursesYetToApprove",{title: "My Courses", approval: "Courses Yet to be approved"});
    }else {
        request(myCourseViewApi + req.user.course,(error,response,body)=>{
            console.log(error);
            console.log(response);
            var data = JSON.parse(body);
            res.render("mycourses",{title: "My Courses", data: data[0], doubt: req.user.doubt, reply: req.user.reply});
        });
    }
});

//////////////////////////////////////My Doubt////////////////////////////////////////////
app.post("/doubt",(req,res)=>{
    const submittedDoubt = req.body.doubt;

    userCollection.findById(req.user.id,(error,foundUser)=>{
        if (error){
            console.log(error);
        } else {
            if (foundUser){
                foundUser.doubt = submittedDoubt;
                foundUser.reply = "";
                foundUser.save(()=>{
                    res.redirect("/mycourses");
                });
            }
        }
    });

});



////////////////////////////////////////Login Page////////////////////////////////////////
app.get("/login", (req, res) => {
    res.render("login", {
        unsucessful: ""
    });
});

app.post("/login", function (req, res) {

    const user = new userCollection({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/coursesOnline");
            });
        }
    });

});

//////////////////////////////////////////Register Page//////////////////////////////
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    userCollection.register({
        username: req.body.username
    }, req.body.password, (error, user) => {
        if (error) {
            console.log(error);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/coursesOnline");
            })
        }
    });
});

///////////////////////////////////////////////Log Out//////////////////////////////////////// 
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});


//////////////////////////////////////// ADMIN Routes ////////////////////////////////
app.get("/admin", (req, res) => {
    res.render("adminhome", {
        title: "Admin Home"
    });
});

app.post("/createCourse", (req, res) => {
    var course = new courseCollection(req.body);
    course.save((error, data) => {
        if (error) {
            console.log(error);
        } else {
            console.log("New Course Inserted");
            //res.send(data);
        }
    });
});

// Dynamically allocated port in Heroku
app.listen(process.env.PORT || 3000, () => {
    console.log("Server Listening");
});