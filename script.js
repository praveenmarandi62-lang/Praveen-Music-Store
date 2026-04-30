
const songList = document.getElementById("songList");
const audioPlayer = document.getElementById("audioPlayer");
const playerTitle = document.getElementById("playerTitle");
const playerImg = document.getElementById("playerImg");
const buyBtn = document.querySelector(".buy-btn");

let currentSong = null;

const API = "https://praveen-music-store.onrender.com";

/* LOAD SONGS */
async function loadSongs() {
  try {
    const res = await fetch(`${API}/api/songs`);

    if (!res.ok) throw new Error("API failed");

    const songs = await res.json();

    if (!Array.isArray(songs)) throw new Error("Invalid data");

    songList.innerHTML = "";

    if (songs.length === 0) {
      songList.innerHTML = "<p style='text-align:center'>No songs found</p>";
      return;
    }

    songs.forEach((song, index) => {
      const card = document.createElement("div");
      card.className = "song-card";

      card.innerHTML = `
        <div class="song-left">
          <img src="${song.img || ''}">
          <div class="song-info">
            <h3>${index + 1}. ${song.name || 'No Name'}</h3>
            <p>Premium Track</p>
          </div>
        </div>

        <div class="song-actions">
          <button class="play-btn">▶</button>
          <button class="price-btn">₹${song.price || 0}</button>
        </div>
      `;

      card.querySelector(".play-btn").onclick = () => playSong(song);
      card.querySelector(".price-btn").onclick = () => buySong(song);

      songList.appendChild(card);
    });

  } catch (err) {
    console.log("❌ SONG LOAD ERROR:", err);

    songList.innerHTML = `
      <p style="color:red; text-align:center; font-size:14px;">
        Songs load nahi ho rahe (Backend issue)
      </p>
    `;
  }
}

/* PLAY */
function playSong(song) {
  if (!song) return;

  currentSong = song;

  audioPlayer.src = song.audio || "";
  audioPlayer.play().catch(err => console.log("Audio error:", err));

  playerTitle.textContent = song.name || "No Song";
  playerImg.src = song.img || "";
}

/* BUY */
async function buySong(song) {
  try {
    if (!song) return;

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
    } else {
      alert("Payment start failed");
    }

  } catch (err) {
    console.log("PAYMENT ERROR:", err);
    alert("Payment error");
  }
}

/* BOTTOM BUY BUTTON */
buyBtn.onclick = () => {
  if (currentSong) {
    buySong(currentSong);
  } else {
    alert("Select Song First");
  }
};

loadSongs();
