const API = "https://praveen-music-store.onrender.com";

const recentList = document.getElementById("recentList");
const songList = document.getElementById("songList");
const audioPlayer = document.getElementById("audioPlayer");
const playerTitle = document.getElementById("playerTitle");
const playerImg = document.getElementById("playerImg");
const buyBtn = document.querySelector(".buy-btn");

let allSongs = [];
let filteredSongs = [];
let currentSong = null;
let selectedCard = null;
let currentPlayButton = null;
function showSkeleton(){
  songList.innerHTML = "";

  for(let i = 0; i < 5; i++){
    songList.innerHTML += `
      <div class="song-card skeleton-card">
        <div class="song-left">
          <div class="skeleton-img"></div>
          <div class="song-info">
            <div class="skeleton-line big"></div>
            <div class="skeleton-line small"></div>
          </div>
        </div>
          <div class="skeleton-btn"></div>
          <div class="skeleton-btn"></div>
        </div>
      </div>
    `;
  }
}

/* =========================
   PAYMENT VERIFY + DOWNLOAD
========================= */

window.addEventListener("load", async () => {

  const params = new URLSearchParams(window.location.search);

  const songId = params.get("song");
  const orderId = params.get("order_id");

  if (songId && orderId) {

    try {

      const res = await fetch(
        `${API}/api/verify-payment/${orderId}/${songId}`
      );

      const data = await res.json();

      console.log("VERIFY RESPONSE:", data);

      if (data.paid && data.downloadUrl) {

        alert("Payment Successful 🎉 Download starting...");

        window.location.href = data.downloadUrl;

      } else {

        alert("Payment not completed. Download locked.");

      }

    } catch (err) {

      console.log("VERIFY ERROR:", err);

      alert("Payment verification failed");

    }

  }

});

const searchInput =
document.getElementById("searchInput");

searchInput.addEventListener("input", () => {

  const value =
  searchInput.value.toLowerCase();

  const searched =
  allSongs.filter(song =>

    song.name.toLowerCase()
    .includes(value)

  );

  renderSongs(searched);

});

/* Load Songs */
async function loadSongs() {

  try {

    showSkeleton();

    const res =
    await fetch(`${API}/api/songs`);

    if (!res.ok)
    throw new Error("API failed");

    const songs =
    await res.json();

    if (!Array.isArray(songs))
    throw new Error("Invalid songs data");

    allSongs = songs;
    filteredSongs = songs;

    /* Trending latest songs */
    renderSongs(
      allSongs.slice(0, 10)
    );

  } catch (err) {

    console.log(
      "SONG LOAD ERROR:",
      err
    );

    songList.innerHTML =

    `<p style="color:red;text-align:center;">
      Songs load nahi ho rahe
    </p>`;

  }

}

/* Select / Highlight Song */
function selectSong(song, card) {
  currentSong = song;

  /* Save recently played */

let recentSongs =
JSON.parse(
  localStorage.getItem("recentSongs")
) || [];

recentSongs =
recentSongs.filter(
  s => s._id !== song._id
);

recentSongs.unshift(song);

recentSongs =
recentSongs.slice(0, 10);

localStorage.setItem(
  "recentSongs",
  JSON.stringify(recentSongs)
);

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
  "Content-Type": "application/json",
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

/* Recently Played */
function loadRecentlyPlayed(){

  const recentSongs =
  JSON.parse(localStorage.getItem("recentSongs")) || [];

  if(!recentList) return;

  recentList.innerHTML = "";

  if(recentSongs.length === 0){

    recentList.innerHTML =

    `<p style="text-align:center;color:#aaa;">
      No recent songs
    </p>`;

    return;

  }

  recentSongs.forEach((song) => {

    const card =
    document.createElement("div");

    card.className = "song-card";

    card.innerHTML = `

      <div class="song-left">

        <img src="${song.img || ""}">

        <div class="song-info">

          <h3>${song.name || "No Name"}</h3>

          <p>Recently Played</p>

        </div>

      </div>

      <div class="song-actions">

        <button class="play-btn">▶</button>

      </div>

    `;

    const playBtn =
    card.querySelector(".play-btn");

    card.onclick = () =>
    selectSong(song, card);

    playBtn.onclick = (e) => {

      e.stopPropagation();

      selectSong(song, card);

      playSong(song, playBtn);

    };

    recentList.appendChild(card);

  });

}

loadSongs();
loadRecentlyPlayed();

function renderSongs(songs){

  songList.innerHTML = "";

  if(songs.length === 0){
    songList.innerHTML =
    `<p style="text-align:center;">No songs found</p>`;
    return;
  }

  songs.forEach((song, index) => {

    const card = document.createElement("div");
    card.className = "song-card";

    const favorites =
    JSON.parse(localStorage.getItem("favorites")) || [];

    const isFavorite =
    favorites.includes(song._id);
    card.innerHTML = `
      <div class="song-left">

        <img src="${song.img || ""}">

        <div class="song-info">
          <h3>${index + 1}. ${song.name || "No Name"}</h3>
          <p>${song.category || "Trending"}</p>
        </div>

      </div>

      <div class="song-actions">
  <button class="play-btn">▶</button>
  <button class="fav-btn">
  ${isFavorite ? "❤️" : "♡"}
</button>
  <button class="share-btn">↗</button>
  <button class="price-btn">₹${song.price || 0}</button>
</div>
    `;

    const playBtn =
    card.querySelector(".play-btn");

    const priceBtn =
    card.querySelector(".price-btn");
    const shareBtn = card.querySelector(".share-btn");
    const favBtn = card.querySelector(".fav-btn");
  

    card.onclick = () =>
    selectSong(song, card);

    playBtn.onclick = (e) => {

      e.stopPropagation();

      selectSong(song, card);

      playSong(song, playBtn);

    };

    shareBtn.onclick = (e) => {
  e.stopPropagation();

  const text = `Check this song: ${song.name} - Praveen Music Store`;
  const url = "https://praveenmarandi62-lang.github.io/Praveen-Music-Store/";

  window.open(
    `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
    "_blank"
  );
};

favBtn.onclick = (e) => {

  e.stopPropagation();

  let favorites =
  JSON.parse(localStorage.getItem("favorites")) || [];

  if(favorites.includes(song._id)){

    favorites =
    favorites.filter(id => id !== song._id);

    favBtn.textContent = "♡";

  }else{

    favorites.push(song._id);

    favBtn.textContent = "❤️";

  }

  localStorage.setItem(
    "favorites",
    JSON.stringify(favorites)
  );

};

priceBtn.onclick = (e) => {
  e.stopPropagation();
  selectSong(song, card);
  buySong(song);
};

    songList.appendChild(card);

  });

}

document.querySelectorAll(".categories button")
.forEach(btn => {

  btn.onclick = () => {

    /* Remove old active */
    document
    .querySelectorAll(".categories button")
    .forEach(b =>
      b.classList.remove("active-category")
    );

    /* Add active */
    btn.classList.add("active-category");

    const category =
    btn.textContent.trim();

    if(category === "All"){

      renderSongs(allSongs.slice(0, 10));

      return;

    }

    const filtered =
    allSongs.filter(song =>

      (song.category || "")
      .toLowerCase()
      ===
      category.toLowerCase()

    );

    renderSongs(filtered);

  };

});

/* Disable Right Click */
document.addEventListener("contextmenu", (e)=>{
  e.preventDefault();
});

/* Disable Copy */
document.addEventListener("copy", (e)=>{
  e.preventDefault();
});

/* Disable Cut */
document.addEventListener("cut", (e)=>{
  e.preventDefault();
});

/* Disable Select */
document.addEventListener("selectstart", (e)=>{
  e.preventDefault();
});
