const mongoose = require("mongoose");

const uri = "mongodb+srv://parthvasu2004_db_user:WjhlN0EoMBLpAuqJ@blsapi.lcoaoc0.mongodb.net/blsapi?retryWrites=true&w=majority";

const connectDB = () => {
    return mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
};

module.exports = connectDB;
