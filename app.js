const SHEET_ID = "1Z5zu14YfbphJVqI-b0U3dmANpQICkiWQv6-zCdlrrhU";
const STANDINGS_GID = "0";
const SCHEDULE_GID = "1061639030";

const teams = [
  "Ac Milan", "Aston Villa", "Atalanta", "Atletico Madrid", "Barcelona",
  "Bayern Leverkusen", "Bayern Munich", "Bologna", "Borussia Dortmund", "Celtic",
  "Chelsea", "Feyenoord", "Frankfurt", "Inter Milan", "Juventes", "Lazio",
  "Liverpool", "Man City", "Man United", "Olympic Lyonnais", "Porto", "PSG",
  "PSV", "Rangers", "RB Leipzig", "Real Madrid", "Real Sociedad", "Salzberg",
  "Sporting", "Spurs", "Arsenal"
];

const weekSelect = document.querySelector("#weekSelect");
const standingsBody = document.querySelector("#standingsTable tbody");
const standingsStatus = document.querySelector("#standingsStatus");
const scheduleStatus = document.querySelector("#scheduleStatus");
const scheduleCards = document.querySelector("#scheduleCards");
const weekTitle = document.querySelector("#weekTitle");
const byeText = document.querySelector("#byeText");

let scheduleRows = [];

for (let i = 1; i <= 31; i++) {
  const option = document.createElement("option");
  option.value = String(i);
  option.textContent = `Week ${i}`;
  weekSelect.appendChild(option);
}

weekSelect.addEventListener("change", () => renderSchedule(Number(weekSelect.value)));

function gvUrl(gid, range) {
  const query = encodeURIComponent(`select *`);
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${gid}&range=${encodeURIComponent(range)}&tq=${query}`;
}

async function fetchSheet(gid, range) {
  const response = await fetch(gvUrl(gid, range));
  const text = await response.text();
  const json = JSON.parse(text.substring(text.indexOf("{") , text.lastIndexOf("}") + 1));
  if (json.status === "error") throw new Error(json.errors?.[0]?.detailed_message || "Could not read spreadsheet data.");
  return json.table.rows.map(row => row.c.map(cell => cell ? cell.v : ""));
}

function cleanTeam(value) {
  return String(value || "").trim();
}

async function loadStandings() {
  try {
    const rows = await fetchSheet(STANDINGS_GID, "A1:H32");
    const data = rows.filter(row => row[1]);
    standingsBody.innerHTML = data.map(row => `
      <tr>
        <td>${row[0] || ""}</td>
        <td>${row[1] || ""}</td>
        <td>${row[2] || 0}</td>
        <td>${row[3] || 0}</td>
        <td>${row[4] || 0}</td>
        <td>${row[5] || 0}</td>
        <td>${row[6] || 0}</td>
        <td><strong>${row[7] || 0}</strong></td>
      </tr>
    `).join("");
    standingsStatus.textContent = "Loaded";
  } catch (error) {
    standingsStatus.textContent = "Needs public sheet access";
    standingsBody.innerHTML = `<tr><td colspan="8"><div class="error">I could not load the standings. Make sure the Google Sheet is viewable by anyone with the link or published to the web.</div></td></tr>`;
  }
}

async function loadSchedule() {
  try {
    const rows = await fetchSheet(SCHEDULE_GID, "A3:E468");
    scheduleRows = rows
      .filter(row => row[0] && row[1] && row[2])
      .map(row => ({
        week: Number(row[0]),
        home: cleanTeam(row[1]),
        away: cleanTeam(row[2]),
        homeScore: row[3],
        awayScore: row[4]
      }));
    scheduleStatus.textContent = "Loaded";
    renderSchedule(Number(weekSelect.value));
  } catch (error) {
    scheduleStatus.textContent = "Needs public sheet access";
    scheduleCards.innerHTML = `<div class="error">I could not load the schedule. Make sure the Google Sheet is viewable by anyone with the link or published to the web.</div>`;
  }
}

function renderSchedule(week) {
  const games = scheduleRows.filter(game => game.week === week);
  weekTitle.textContent = `Week ${week} Schedule`;

  const playingTeams = new Set(games.flatMap(game => [game.home, game.away]).map(cleanTeam));
  const bye = teams.find(team => !playingTeams.has(cleanTeam(team)));
  byeText.textContent = bye ? `Bye this week: ${bye}` : "No bye found for this week.";

  scheduleCards.innerHTML = games.map(game => {
    const hasScore = game.homeScore !== "" && game.awayScore !== "";
    const homeScore = hasScore ? Number(game.homeScore) : "";
    const awayScore = hasScore ? Number(game.awayScore) : "";
    const homeClass = hasScore && homeScore > awayScore ? "winner" : hasScore && homeScore < awayScore ? "loser" : "";
    const awayClass = hasScore && awayScore > homeScore ? "winner" : hasScore && awayScore < homeScore ? "loser" : "";
    const scoreText = hasScore ? `${homeScore} - ${awayScore}` : "vs";
    return `
      <div class="match-card">
        <div class="teams">
          <div class="team home ${homeClass}">${game.home}</div>
          <div class="score">${scoreText}</div>
          <div class="team away ${awayClass}">${game.away}</div>
        </div>
      </div>
    `;
  }).join("");
}

loadStandings();
loadSchedule();





const cardForm = document.querySelector("#cardForm");
const cardsGrid = document.querySelector("#cardsGrid");
const cardsEmpty = document.querySelector("#cardsEmpty");
const cardCount = document.querySelector("#cardCount");
const cardSearch = document.querySelector("#cardSearch");
const exportCardsButton = document.querySelector("#exportCards");
const clearCardsButton = document.querySelector("#clearCards");
const CARD_STORAGE_KEY = "matchAttaxCards";

let cards = loadCards();

function loadCards() {
  try { return JSON.parse(localStorage.getItem(CARD_STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveCards() { localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(cards)); }

function cardMatchesSearch(card, query) {
  const haystack = [card.player, card.team, card.type, card.position, card.rating, card.notes].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function renderCards() {
  if (!cardsGrid || !cardsEmpty) return;
  const query = cardSearch?.value || "";
  const shownCards = cards.filter(card => cardMatchesSearch(card, query));
  const totalQuantity = cards.reduce((sum, card) => sum + Number(card.quantity || 0), 0);
  cardCount.textContent = `${cards.length} card${cards.length === 1 ? "" : "s"} ? ${totalQuantity} total`;
  cardsEmpty.style.display = shownCards.length ? "none" : "block";
  cardsGrid.innerHTML = shownCards.map(card => `
    <article class="collection-card" data-card-id="${card.id}">
      <h3>${escapeHtml(card.player)}</h3>
      <div class="card-meta">
        ${card.team ? `<span class="card-pill">${escapeHtml(card.team)}</span>` : ""}
        ${card.type ? `<span class="card-pill">${escapeHtml(card.type)}</span>` : ""}
        ${card.position ? `<span class="card-pill">${escapeHtml(card.position)}</span>` : ""}
        ${card.rating ? `<span class="card-pill">Rating ${escapeHtml(card.rating)}</span>` : ""}
      </div>
      ${card.notes ? `<p class="card-note">${escapeHtml(card.notes)}</p>` : ""}
      <div class="card-actions">
        <div class="qty-controls">
          <button type="button" data-action="minus" aria-label="Remove one ${escapeHtml(card.player)} card">?</button>
          <span>Qty ${card.quantity}</span>
          <button type="button" data-action="plus" aria-label="Add one ${escapeHtml(card.player)} card">+</button>
        </div>
        <button type="button" class="delete-card" data-action="delete">Delete</button>
      </div>
    </article>`).join("");
}

function getCardFromForm() {
  const formData = new FormData(cardForm);
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    player: String(formData.get("player") || "").trim(),
    team: String(formData.get("team") || "").trim(),
    type: String(formData.get("type") || "Base").trim(),
    position: String(formData.get("position") || "").trim(),
    rating: String(formData.get("rating") || "").trim(),
    quantity: Math.max(1, Number(formData.get("quantity") || 1)),
    notes: String(formData.get("notes") || "").trim(),
    createdAt: new Date().toISOString()
  };
}

cardForm?.addEventListener("submit", event => {
  event.preventDefault();
  const card = getCardFromForm();
  if (!card.player) return;
  cards.unshift(card);
  saveCards();
  cardForm.reset();
  document.querySelector("#cardQty").value = 1;
  renderCards();
});

cardsGrid?.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  const cardElement = event.target.closest(".collection-card");
  if (!button || !cardElement) return;
  const card = cards.find(item => item.id === cardElement.dataset.cardId);
  if (!card) return;
  const action = button.dataset.action;
  if (action === "plus") card.quantity += 1;
  if (action === "minus") card.quantity = Math.max(1, card.quantity - 1);
  if (action === "delete") cards = cards.filter(item => item.id !== card.id);
  saveCards();
  renderCards();
});

cardSearch?.addEventListener("input", renderCards);
clearCardsButton?.addEventListener("click", () => {
  if (!cards.length) return;
  if (!confirm("Clear all cards from this browser?")) return;
  cards = [];
  saveCards();
  renderCards();
});

exportCardsButton?.addEventListener("click", () => {
  const headers = ["Player", "Team", "Type", "Position", "Rating", "Quantity", "Notes"];
  const rows = cards.map(card => [card.player, card.team, card.type, card.position, card.rating, card.quantity, card.notes]);
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "match-attax-cards.csv";
  link.click();
  URL.revokeObjectURL(url);
});

renderCards();
