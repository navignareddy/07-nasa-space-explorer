const apiKey = "u31txSEUcqpFWNjiNMYBDhQ9XKcMvdphrilgmUNj";

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const getImagesButton = document.querySelector(".filters button");
const gallery = document.getElementById("gallery");

const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "There are more stars in the universe than grains of sand on Earth.",
  "Neutron stars can spin 600 times every second.",
  "Jupiter has the shortest day of all the planets.",
  "Light from the Sun takes about 8 minutes to reach Earth.",
  "One million Earths could fit inside the Sun.",
  "Mars has the biggest volcano in the solar system.",
  "Some stars are older than the entire solar system."
];

setupDateInputs(startDateInput, endDateInput);

function getRandomFact() {
  return spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

function createSpaceFactSection() {
  let factBox = document.getElementById("spaceFact");

  if (!factBox) {
    factBox = document.createElement("section");
    factBox.id = "spaceFact";
    factBox.className = "space-fact";
    factBox.innerHTML = `
      <h2>Did You Know?</h2>
      <p>${getRandomFact()}</p>
    `;
    gallery.parentNode.insertBefore(factBox, gallery);
  } else {
    factBox.querySelector("p").textContent = getRandomFact();
  }
}

function showLoading() {
  gallery.innerHTML = `
    <div class="loading">
      🔄 Loading space photos...
    </div>
  `;
}

function showMessage(message) {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🌌</div>
      <p>${message}</p>
    </div>
  `;
}

function getYouTubeEmbedUrl(url) {
  if (!url) return "";
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }
  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
}

function closeModal() {
  const modal = document.getElementById("spaceModal");
  if (modal) modal.classList.add("hidden");
}

function openModal(item) {
  let modal = document.getElementById("spaceModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "spaceModal";
    modal.className = "modal hidden";
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" aria-label="Close modal">×</button>
        <div class="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.classList.contains("modal-close")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  const modalBody = modal.querySelector(".modal-body");

  if (item.media_type === "image") {
    modalBody.innerHTML = `
      <img src="${item.hdurl || item.url}" alt="${item.title}" class="modal-image" />
      <h2>${item.title}</h2>
      <p class="modal-date">${formatDate(item.date)}</p>
      <p class="modal-text">${item.explanation}</p>
    `;
  } else if (item.media_type === "video") {
    const embedUrl = getYouTubeEmbedUrl(item.url);
    modalBody.innerHTML = `
      <iframe
        class="modal-video"
        src="${embedUrl}"
        title="${item.title}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
      <h2>${item.title}</h2>
      <p class="modal-date">${formatDate(item.date)}</p>
      <p class="modal-text">${item.explanation}</p>
    `;
  } else {
    modalBody.innerHTML = `
      <h2>${item.title}</h2>
      <p class="modal-date">${formatDate(item.date)}</p>
      <p class="modal-text">${item.explanation}</p>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer">Open media</a>
    `;
  }

  modal.classList.remove("hidden");
}

function createGalleryCard(item) {
  const card = document.createElement("article");
  card.className = "gallery-card";

  let mediaHTML = "";

  if (item.media_type === "image") {
    mediaHTML = `
      <img src="${item.url}" alt="${item.title}" class="gallery-image" />
    `;
  } else if (item.media_type === "video") {
    mediaHTML = `
      <div class="video-card">
        <div class="video-icon">▶</div>
        <p>Video</p>
      </div>
    `;
  } else {
    mediaHTML = `
      <div class="video-card">
        <div class="video-icon">?</div>
        <p>Media</p>
      </div>
    `;
  }

  card.innerHTML = `
    ${mediaHTML}
    <div class="card-info">
      <h3>${item.title}</h3>
      <p>${formatDate(item.date)}</p>
      ${item.media_type === "video" ? '<span class="video-badge">Video</span>' : ""}
    </div>
  `;

  card.addEventListener("click", () => openModal(item));
  return card;
}

function renderGallery(items) {
  gallery.innerHTML = "";

  if (!items.length) {
    showMessage("No photos found for that date range.");
    return;
  }

  items.forEach((item) => {
    gallery.appendChild(createGalleryCard(item));
  });
}

function isFutureDate(dateString) {
  const selected = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected > today;
}

async function fetchSpacePhotos() {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (!startDate || !endDate) {
    showMessage("Please pick a start date and an end date.");
    return;
  }

  if (startDate > endDate) {
    showMessage("The start date must come before the end date.");
    return;
  }

  if (isFutureDate(startDate) || isFutureDate(endDate)) {
    showMessage("Please choose a date on or before today.");
    return;
  }

  createSpaceFactSection();
  showLoading();

  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      const message = data?.msg || data?.error?.message || "NASA API request failed.";
      throw new Error(message);
    }

    const items = Array.isArray(data) ? data : [data];
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    renderGallery(items);
  } catch (error) {
    console.error("NASA error:", error);
    showMessage(`Oops! ${error.message}`);
  }
}

getImagesButton.addEventListener("click", fetchSpacePhotos);

createSpaceFactSection();