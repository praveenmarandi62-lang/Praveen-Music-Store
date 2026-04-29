/* script.js Final Razorpay Payment Upgrade */

const songList = document.getElementById("songList");
const audioPlayer = document.getElementById("audioPlayer");
const playerTitle = document.getElementById("playerTitle");
const playerImg = document.getElementById("playerImg");
const buyBtn = document.querySelector(".buy-btn");

let currentSong = null;

const API = "http://localhost:5000";

/* Load Songs */
async function loadSongs() {
  const res = await fetch(`${API}/api/songs`);
  const songs = await res.json();

  songList.innerHTML = "";

  songs.forEach((song, index) => {
    const card = document.createElement("div");
    card.className = "song-card";

    card.innerHTML = `
      <div class="song-left">
        <img src="${song.img}">
        <div class="song-info">
          <h3>${index + 1}. ${song.name}</h3>
          <p>Premium Track</p>
        </div>
      </div>

      <button class="play-btn">▶</button>
      <button class="price-btn">₹${song.price}</button>
    `;

    card.querySelector(".play-btn").onclick = () => playSong(song);
    card.querySelector(".price-btn").onclick = () => buySong(song);

    songList.appendChild(card);
  });
}

/* Preview */
function playSong(song) {
  currentSong = song;

  audioPlayer.src = song.audio;
  audioPlayer.play();

  playerTitle.textContent = song.name;
  playerImg.src = song.img;
}

/* Buy */
async function buySong(song) {
console.log("BUY BUTTON CLICKED", song);
alert("Buy button clicked");
  currentSong = song;

  const res = await fetch(`${API}/api/create-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: song.price,
      songId: song._id,
      songName: song.name
    })
  });

  const data = await res.json();

  if (data.payment_link) {
    window.location.href = data.payment_link;
  } 
  else if (data.payment_session_id && data.order_id) {
    alert("Payment session created");
    console.log(data);
  } 
  else {
    alert("Payment start failed");
  }
}

/* Bottom Buy */
buyBtn.onclick = ()=>{
  if(currentSong){
    buySong(currentSong);
  }else{
    alert("Select Song First");
  }
};

loadSongs();