const axios = require("axios");
const connectCloudinary = require("./cloudinary.js");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({
  origin: [
    "https://praveenmarandi62-lang.github.io"
  ]
}));

app.use(express.json());

/* =========================
   CLOUDINARY
========================= */

connectCloudinary();

/* =========================
   MONGODB
========================= */

mongoose.connect(process.env.MONGO_URI)

.then(() => {
  console.log("✅ MongoDB Connected");
})

.catch(err => {
  console.log("❌ DB ERROR:", err);
});

/* =========================
   STORAGE
========================= */

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

/* =========================
   SONG MODEL
========================= */

const Song = mongoose.model(

  "Song",

  new mongoose.Schema({

    name: String,
    img: String,
    audio: String,
    price: Number,
    category: String

  })

);

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

  res.send("🎵 Backend Running");

});

/* =========================
   UPLOAD SONG
========================= */

app.post(
  "/api/upload",
  upload.fields([{ name: "audio" }, { name: "img" }]),

  async (req, res) => {

    try {

      if (!req.files || !req.files.img || !req.files.audio) {

        return res.status(400).json({
          success: false,
          message: "Image or audio missing"
        });

      }

      const { name, price, category } = req.body;

      /* Upload image */

      const imgUpload =
      await cloudinary.uploader.upload(

        `data:${req.files.img[0].mimetype};base64,${req.files.img[0].buffer.toString("base64")}`,

        {
          folder: "praveen_music_store/images"
        }

      );

      /* Upload audio */

      const audioUpload =
      await cloudinary.uploader.upload(

        `data:${req.files.audio[0].mimetype};base64,${req.files.audio[0].buffer.toString("base64")}`,

        {
          resource_type: "video",
          folder: "praveen_music_store/audio"
        }

      );

      const newSong = new Song({

        name,
        price,
        category,

        img: imgUpload.secure_url,
        audio: audioUpload.secure_url

      });

      await newSong.save();

      res.json({
        success: true,
        message: "Song Uploaded",
        song: newSong
      });

    } catch (error) {

      console.log("UPLOAD ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Upload Failed"
      });

    }

  }
);

/* =========================
   GET SONGS
========================= */

app.get("/api/songs", async (req, res) => {

  try {

    const songs =
    await Song.find().sort({ _id: -1 });

    res.json(songs);

  } catch (error) {

    res.status(500).json({

      success: false,
      message: "Songs Fetch Failed"

    });

  }

});

/* =========================
   CREATE PAYMENT
========================= */

app.post("/api/create-payment", async (req, res) => {

  try {

    const { amount, songId } = req.body;

    const orderId =
    "order_" + Date.now();

    const response = await axios.post(

      "https://api.cashfree.com/pg/orders",

      {

        order_amount: Number(amount),

        order_currency: "INR",

        order_id: orderId,

        customer_details: {

          customer_id:
          "cust_" + Date.now(),

          customer_name:
          "Music Buyer",

          customer_email:
          "buyer@example.com",

          customer_phone:
          "9384552971"

        },

        order_meta: {

          return_url:

          "https://praveenmarandi62-lang.github.io/Praveen-Music-Store/index.html?song=" +

          songId +

          "&order_id={order_id}"

        }

      },

      {

        headers: {

          "x-client-id":
          process.env.CASHFREE_APP_ID,

          "x-client-secret":
          process.env.CASHFREE_SECRET_KEY,

          "x-api-version":
          "2023-08-01",

          "Content-Type":
          "application/json"

        }

      }

    );

    console.log(
      "CASHFREE RESPONSE:",
      response.data
    );

    res.json(response.data);

  } catch (error) {

    console.log(
      "PAYMENT ERROR:",
      error.response?.data || error.message
    );

    res.status(500).json({

      success: false,
      message: "Payment Failed"

    });

  }

});

/* =========================
   VERIFY PAYMENT
========================= */

app.get("/api/verify-payment/:orderId/:songId", async (req, res) => {

  try {

    const { orderId, songId } =
    req.params;

    const response =
    await axios.get(

      `https://api.cashfree.com/pg/orders/${orderId}`,

      {

        headers: {

          "x-client-id":
          process.env.CASHFREE_APP_ID,

          "x-client-secret":
          process.env.CASHFREE_SECRET_KEY,

          "x-api-version":
          "2023-08-01"

        }

      }

    );

    console.log(
      "VERIFY PAYMENT:",
      response.data
    );

    if (
      response.data.order_status
      ===
      "PAID"
    ) {

      return res.json({

        success: true,

        paid: true,

        downloadUrl:

        `https://praveen-music-store.onrender.com/api/download/${songId}`

      });

    }

    return res.json({

      success: true,

      paid: false,

      status:
      response.data.order_status

    });

  } catch (error) {

    console.log(
      "VERIFY ERROR:",
      error.response?.data || error.message
    );

    res.status(500).json({

      success: false,
      message: "Payment verify failed"

    });

  }

});

/* =========================
   DOWNLOAD SONG
========================= */

app.get("/api/download/:id", async (req, res) => {

  try {

    const song =
    await Song.findById(req.params.id);

    if (!song) {

      return res
      .status(404)
      .send("Song Not Found");

    }

    let fileUrl = song.audio;

    const safeName =
    (song.name || "song")
    .replace(/[^a-zA-Z0-9]/g, "_");

    if (fileUrl.includes("/upload/")) {

      fileUrl =
      fileUrl.replace(

        "/upload/",

        `/upload/fl_attachment:${safeName}/`

      );

    }

    return res.redirect(fileUrl);

  } catch (error) {

    console.log(error);

    res.status(500).send("Download Failed");

  }

});

/* =========================
   SERVER
========================= */

const PORT =
process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    "🚀 Server Running on Port " + PORT
  );

});