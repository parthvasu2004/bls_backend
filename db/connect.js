const mongoose = require("mongoose");

uri = "mongodb+srv://parthvasu2004_db_user:<WjhlN0EoMBLpAuqJ>@blsapi.lcoaoc0.mongodb.net/blsapi?appName=blsapi";

const connectDB = () => {
    return mongoose.connect(uri, {
        useNewUrlParser: True,
        useUnifiedTopology: True
    });
};


module.exports = connectDB;
