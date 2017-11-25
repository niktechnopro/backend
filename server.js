const express = require('express');
const http = require('http');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql')
const request_module = require('request');
const bodyParser = require('body-parser');
const router = express.Router();
const bcrypt = require('bcrypt-nodejs');
const swal = require('sweetalert');
// const io = require('socket.io');
// const apiai = require('apiai')('35c622ace8eb4059b215441b08650a5d')//apiai token
// const geocode = require('./geocode/geocode.js'); //module to extract lat,lng from zip code
const port = process.env.PORT || 3000; //configures to available port based on
//enviroment variable or port 3000 by default

var app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false})); //what is urlencoded ?

//here is a key:value pair (declaring the engine I'd like to use for view)
app.set('view engine', 'ejs');
// setup database
var db = mysql.createConnection({ 
    // connectionLimit: 50, maximum connections to databse
    host: '127.0.0.1',
    user: 'admin',
    password: 'password',
    database: 'DB_VILLAGE'
})

db.connect ((error) => { //connecting to our database
    if (error){
        console.log(error)
        console.log('could not connect to database')
        // throw error;// commented out so the server would not crash
        return;
    }else{
        console.log("connection to db = success!");
    }
})


var server = http.createServer(app);

app.use((req, res, next) => { //logging info about date, location and method used
    var now = new Date().toString();
    var log = `${now}: ${req.url} ${req.method}`;
    console.log(log);
    fs.appendFile('server.log', log + '\n', (error) => { //where '\n' is a new line character
        if (error) { console.log("unable to append to server log") }
    });
    next();
});

//creating static path from the root of our harddrive to public folder
app.use(express.static(__dirname + '/public'));

//the following to serve welcome page
app.get('/', (req, res) => {
    console.log('someone came to our page')
    res.render('index', {
        dateNow: new Date().toDateString(),
    })
});

//serves front login page and veryfies if user in database
app.post('/loginForm', (req, res, next) => {
    console.log('receiving data from login form');
    var email = req.body.email;
    var password = req.body.password;
    console.log("this is what received from form: ", email, password)
    //next we are going to get info from parents table with email and password
    const selectQuery = `SELECT pw FROM parents WHERE email = ?;`;
    db.query(selectQuery, [email],(error, results)=>{
        if (error){
            console.log('something went wrong with this db request');
            return
        }else{
            //if results is an empty array - user is not in database and must register 
            if (results.length == 0){
                //this is a new user - insert them - user must register
                console.log('user must be inserted', results[0].pw)
                res.render('index', {
                onLoad: 2   
                })  
            }else{
                //results are NOT empty array
                console.log('users email is in database')
                var compareTo = results[0].pw;
                console.log('retrieved hashed password from db:', compareTo)
                //let's compare what we retrieved from DB to what user enetered
                //the following returns 'true' if passwords match
                var passwordMatch = bcrypt.compareSync(password, compareTo)
                console.log(passwordMatch);
                    if (passwordMatch){
                        // res.send("User is in database")
                        res.render('chatBot',{
                        });
                    }else{
                        console.log('passwords do not match retype the password correctly')
                        res.render('index', {
                            onLoad: 1
                        })
                    }
            } 
        }
    })
    // res.send('I got something here')
});

//reading from registration form
app.post('/registerForm', (req, res)=>{
    console.log('receiving data from registration page')
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;
    var email = req.body.email;
    var password = req.body.password2;
    var child_name = req.body.child_name;
    var relationship = req.body.relationship;
    var child_username = req.body.child_username;
    var favorite_color = req.body.favorite_color;
    var submission_date = req.body.submission_date;
    var hash = bcrypt.hashSync(password);
    console.log(first_name, last_name, email, password, child_name, relationship, child_username, favorite_color, submission_date)
    const selectQuery = `SELECT * FROM parents WHERE email = ?;`;
    console.log(hash);
    var dbQuery = db.query(selectQuery, [email, last_name],(error, results)=>{
        // console.log(dbQuery);
        //did this return a row? If so, the user already exists
        if (results.length != 0){
            console.log('user is in database, must login now')
            res.render('index',{
                onLoad: 1
             });
        }else{
            //this is a new user - insert them - user must register
            console.log('user must be inserted')
            console.log('we have to render registration page for user to register')
            const insertQuery = `INSERT INTO parents (first_name, last_name, email, pw, child_name, relationship, child_username, fav_color, submission_date) VALUES (?,?,?,?,?,?,?,?,?);`;
            db.query(insertQuery, [first_name, last_name, email, hash, child_name, relationship, child_username, favorite_color, submission_date], (error)=>{
                if (error){
                    console.log('error inserting into database')
                    // throw error;
                    return
                }else{
                    console.log('succesful insertion into databse, next login')
                    // res.send("we just updated database");
                    res.render('chatBot',{
                        onLoad: 2
                    });
                    
                }
            })
        }
    })
})
    

server.listen(port, (error) => {
    (error) ? console.log("your code sucks"): console.log(`listening on port ${port}`);
});