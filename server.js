const axios = require("axios");
const connectCloudinary = require("./cloudinary.js");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectCloudinary();

/* MongoDB Connect */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err));

/* Cloudinary Upload Storage */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "praveen_music_store",
    resource_type: "auto"
  }
});

const upload = multer({ storage });

/* Song Schema */
const Song = mongoose.model("Song", new mongoose.Schema({
  name: String,
  img: String,
  audio: String,
  price: Number
}));

/* Upload Song */
app.post("/api/upload",
upload.fields([{ name: "audio" }, { name: "img" }]),
async (req, res) => {
  try {

    const { name, price } = req.body;

    const newSong = new Song({
      name,
      img: req.files.img[0].path,
      audio: req.files.audio[0].path,
      price
    });

    await newSong.save();

    res.json({
      success: true,
      message: "Song Uploaded",
      song: newSong
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false
    });
  }
});

/* Get All Songs */
app.get("/api/songs", async (req, res) => {
  const songs = await Song.find().sort({ _id: -1 });
  res.json(songs);
});

/* Cashfree Payment Create */
app.post("/api/create-payment", async (req, res) => {
  try {

    const { amount, songId } = req.body;

    const response = await axios.post(
      "https://api.cashfree.com/pg/orders",
      {
        order_amount: amount,
        order_currency: "INR",
        order_id: "order_" + Date.now(),

        customer_details: {
          customer_id: "cust_" + Date.now(),
          customer_name: "Music Buyer",
          customer_email: "buyer@example.com",
          customer_phone: "9999999999"
        },

        order_meta: {
          return_url:
          "http://127.0.0.1:5500/index.html?paid=true&song=" + songId
        }
      },

      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      payment_link: response.data.payment_link
    });

  } catch (error) {
    console.log(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Payment Failed"
    });
  }
});

/* Download Song */
app.get("/api/download/:id", async (req, res) => {

  const song = await Song.findById(req.params.id);

  if (!song) {
    return res.status(404).send("Song Not Found");
  }

  res.json({
    success: true,
    file: song.audio
  });
});

/* Server Start */
app.listen(5000, () => {
  console.log("🚀 Server Running on Port 5000");
});