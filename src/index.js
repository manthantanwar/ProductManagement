const express = require('express');
const route = require('./routes/route.js');
const mongoose = require('mongoose');
const app = express();
const multer = require('multer')
const PORT = process.env.PORT || 3000
//process.env.PORT => in env file , define a port(localhost:3000) ; syntax of requiring env ,
//env.Port : fetching Port from env             

app.use(express.json());
//makes sure data present in req.body is in JSON format,application level middleware
// takes data from postman to node js


app.use(multer().any())//any() : any type of file
//multer : accept form-data from postman


mongoose.connect("mongodb+srv://vandana:7CJBNDDwPorDTTrX@cluster0.crrs6th.mongodb.net/group59Database", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"),
        err => console.log(err))


app.use('/', route);


app.listen(PORT, function () {
    console.log('Express app running on port ' + PORT)
});


//https://www.makeuseof.com/nodejs-bcrypt-hash-verify-salt-password/