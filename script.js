const API = "https://praveen-music-store.onrender.com";

const songList = document.getElementById("songList");
const audioPlayer = document.getElementById("audioPlayer");
const playerTitle = document.getElementById("playerTitle");
const playerImg = document.getElementById("playerImg");
const buyBtn = document.querySelector(".buy-btn");

let currentSong = null;
let selectedCard = null;
let currentPlayButton = null;

/* Payment success auto download */
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("paid") === "true") {
    const songId = params.get("song");

    if (songId) {
      alert("Payment Successful 🎉 Download starting...");

      setTimeout(() => {
        window.location.href = `${API}/api/download/${songId}`;
      }, 800);
    }
  }
});

/* Load Songs */
async function loadSongs() {
  try {
    songList.innerHTML = `<p style="text-align:center;">Loading songs...</p>`;

    const res = await fetch(`${API}/api/songs`);

    if (!res.ok) throw new Error("API failed");

    const songs = await res.json();

    if (!Array.isArray(songs)) throw new Error("Invalid songs data");

    songList.innerHTML = "";

    if (songs.length === 0) {
      songList.innerHTML = `<p style="text-align:center;">No songs found</p>`;
      return;
    }

    songs.forEach((song, index) => {
      const card = document.createElement("div");
      card.className = "song-card";

      card.innerHTML = `
        <div class="song-left">
          <img src="${song.img || ""}">
          <div class="song-info">
            <h3>${index + 1}. ${song.name || "No Name"}</h3>
            <p>Premium Track</p>
          </div>
        </div>

        <div class="song-actions">
          <button class="play-btn">▶</button>
          <button class="price-btn">₹${song.price || 0}</button>
        </div>
      `;

      const playBtn = card.querySelector(".play-btn");
      const priceBtn = card.querySelector(".price-btn");

      card.onclick = () => selectSong(song, card);

      playBtn.onclick = (e) => {
        e.stopPropagation();
        selectSong(song, card);
        playSong(song, playBtn);
      };

      priceBtn.onclick = (e) => {
        e.stopPropagation();
        selectSong(song, card);
        buySong(song);
      };

      songList.appendChild(card);
    });

  } catch (err) {
    console.log("SONG LOAD ERROR:", err);
    songList.innerHTML = `<p style="color:red;text-align:center;">Songs load nahi ho rahe</p>`;
  }
}

/* Select / Highlight Song */
function selectSong(song, card) {
  currentSong = song;

  if (selectedCard) selectedCard.classList.remove("active-song");

  selectedCard = card;
  selectedCard.classList.add("active-song");

  playerTitle.textContent = song.name || "No Song";
  playerImg.src = song.img || "";
}

/* Reset all play buttons */
function resetPlayButtons() {
  document.querySelectorAll(".play-btn").forEach(btn => {
    btn.textContent = "▶";
    btn.classList.remove("playing");
  });
}

/* Play / Pause Song */
function playSong(song, button) {
  const isSameSong = currentSong && currentSong._id === song._id && audioPlayer.src.includes(song.audio);

  if (isSameSong && !audioPlayer.paused) {
    audioPlayer.pause();
    button.textContent = "▶";
    button.classList.remove("playing");
    currentPlayButton = null;
    return;
  }

  if (isSameSong && audioPlayer.paused) {
    audioPlayer.play().catch(err => console.log("Audio error:", err));
    resetPlayButtons();
    button.textContent = "⏸";
    button.classList.add("playing");
    currentPlayButton = button;
    return;
  }

  currentSong = song;
  audioPlayer.src = song.audio || "";
  audioPlayer.play().catch(err => console.log("Audio error:", err));

  playerTitle.textContent = song.name || "No Song";
  playerImg.src = song.img || "";

  resetPlayButtons();

  button.textContent = "⏸";
  button.classList.add("playing");
  currentPlayButton = button;
}

/* Bottom audio controls sync */
audioPlayer.onpause = () => {
  resetPlayButtons();
};

audioPlayer.onplay = () => {
  if (currentPlayButton) {
    resetPlayButtons();
    currentPlayButton.textContent = "⏸";
    currentPlayButton.classList.add("playing");
  }
};

audioPlayer.onended = () => {
  resetPlayButtons();
  currentPlayButton = null;
};

/* Buy */
async function buySong(song) {
  try {
    const res = await fetch(`${API}/api/create-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Number(song.price),
        songId: song._id,
        songName: song.name
      })
    });

    const data = await res.json();

    if (data.payment_session_id) {
      const cashfree = Cashfree({ mode: "production" });

      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self"
      });
    } else {
      alert("Payment start failed");
    }

  } catch (err) {
    alert("Payment error");
  }
}

/* Bottom Buy */
buyBtn.onclick = () => {
  if (currentSong) {
    buySong(currentSong);
  } else {
    alert("Select Song First");
  }
};

loadSongs();