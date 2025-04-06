const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const bcrypt = require("bcryptjs");//
const jwt = require("jsonwebtoken");//

const User = require('./models/user.model');
const Auction = require('./models/auction.model');

const SECRET_KEY = "I_SUPer_KIte";

const PORT = 5000;
const MONGO_DB_URI = 'mongodb+srv://kruthan08:lKTr7TfSp7VIC1f4@auction.cxp8n.mongodb.net/auction_system';

const app = express();
app.use(express.json());
app.use(cors('http://localhost:3000'));


const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
};

mongoose
  .connect(MONGO_DB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error: ", err);
  });

app.get('/', (req, res) => {
  res.send('Hello! The auction system is working.');
});

//signUp
app.post("/signup", async(req, res) =>{
  try{
    const{username, password} = req.body;
    if(!username || !password){
      return res.status(400).json({message :" Username and Password required"});
    }

    const existingUser = await User.findOne({username});

    if(existingUser){
      return res.status(400).json({message : "Username already exists"});
    }
    const hashPassWord = await bcrypt.hash(password,16);
    console.log("password =" +hashPassWord);
    const newUser = new User ({username, password : hashPassWord});
    await newUser.save();
    res.status(201).json({message :" User regisiterd succesfully"});
  }catch(e){
    res.status(500).json({message : "Iternal Server Error" , errorMessage : e});
  }
});

//signin route
app.post('/signin', async(req, res) => {
  try{
    const {username, password} = req.body;
    const user = await User.findOne({username});

    if(!user || !(await bcrypt.compare(password, user.password))){
      return res.status(400).json({message : "Invalid credentials"});
    }

    const token = jwt.sign({ userId : user._id, username }, SECRET_KEY ,{
      expiresIn: '2h',
    });
    res.json({message : "Signin successful", token});
  }catch (e){
    res.status(500).json({message : "Internal Server Error ", errorMessage : e});
  }
});

//adding new auction (protected )
app.post('/auction',authenticate , async(req, res) => {
  try{
    const {itemName, description, startingBid, closingTime } = req.body;
    
    if(!itemName || !description || !startingBid || !closingTime){
      return res.status(400).json({message : "All field are required"});
    }
    const newItem = new Auction({
     itemName,
      description,
      currentBid: startingBid,
      highestBidder: "",
      closingTime,
    })
    await newItem.save();
    res.status(201).json({message : "Auction item created ", item : newItem});

  }catch(e){
      res.status.json({message : "Internal Server Error ", errorMessage : e});
  }
});

//get all auction
app.get('/auctions', async(req, res) =>{
  try{
    const auction = await Auction.find();
    res.json(auction);
  }catch (e){
    res.status(500).json({message:"Internal Server Error", errorMessage : e});
  }
});


//geting auction
app.get("/auctions/:id", async (req, res) => {
  try {
    const auctionItem = await Auction.findById(req.params.id);
    if (!auctionItem)
      return res.status(404).json({ message: "Auction not found" });

    res.json(auctionItem);
  } catch (error) {
    console.error("Fetching Auction Item Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// bidding
app.post("/bid/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { bid } = req.body;
    const item = await Auction.findById(id);

    if (!item)
      return res.status(404).json({ message: "Auction item not found" });
    if (item.isClosed)
      return res.status(400).json({ message: "Auction is closed" });

    if (new Date() > new Date(item.closingTime)) {
      item.isClosed = true;
      await item.save();
      return res.json({
        message: "Auction closed",
        winner: item.highestBidder,
      });
    }

    if (bid > item.currentBid) {
      item.currentBid = bid;
      item.highestBidder = req.body.username;
      await item.save();
      res.json({ message: "Bid successful", item });
    } else {
      res.status(400).json({ message: "Bid too low" });
    }
  } catch (error) {
    console.error("Bidding Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.listen(PORT, () => {
  console.log(`Listening at http://127.0.0.1:${PORT}`);
});

