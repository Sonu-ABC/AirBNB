const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
   .then(() => {
         console.log("MongoDB Connected");
   })
    .catch((err) => {
        console.log("MongoDB Connection Failed");
        console.log(err);
    });


async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB = async()=>{
   await  Listing.deleteMany({}); // delete all existing listings
   initData.data= initData.data.map((obj)=>({...obj, owner: "68465576dcee94f3d267d790"}));
   await Listing.insertMany(initData.data); // insert new listings
   console.log("data was initialised");
}

initDB();