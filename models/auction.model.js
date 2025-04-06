// import mongoose from "mongoose";
const mongoose = require('mongoose');

const auctionSchema = mongoose.Schema({
    itemName: String,
    description: String,
    currentBid: Number,
    highestBidder: String,
    closingTime: Date,
    isClosed: { type: Boolean, default: false },
    },{
      Timestamp: true,
    },{
      collection : 'auction'
    }
);

const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction;
