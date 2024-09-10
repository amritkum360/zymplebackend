// ./modules/models/dbconnect.js
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://Amritkum360:7004343011@cluster0.1bafcyc.mongodb.net/amazon')
    .then(() => {
        console.log("db connected successfully");
    })
    .catch((error) => {
        console.error("Error in connecting to the database:", error);
    });

module.exports = mongoose.connection;
