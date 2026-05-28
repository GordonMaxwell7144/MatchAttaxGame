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
  const haystack = [
    card.player,
    card.team,
    card.type,
    card.position,
    card.attack,
    card.defense,
    card.rating,
    card.cardNumber,
    card.season,
    card.notes
  ].join(" ").toLowerCase();
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
    <article class="collection-card match-card-style" data-card-id="${card.id}">
      <div class="attax-topline">
        <span>${escapeHtml(card.type || "Match Attax")}</span>
        ${card.cardNumber ? `<span>#${escapeHtml(card.cardNumber)}</span>` : ""}
      </div>
      <h3>${escapeHtml(card.player)}</h3>
      <p class="attax-club">${escapeHtml(card.team || "No club set")}</p>
      <div class="attax-stats">
        <div><strong>${escapeHtml(card.attack || "?")}</strong><span>ATT</span></div>
        <div><strong>${escapeHtml(card.defense || "?")}</strong><span>DEF</span></div>
        <div><strong>${escapeHtml(card.rating || "?")}</strong><span>OVR</span></div>
      </div>
      <div class="card-meta">
        ${card.position ? `<span class="card-pill">${escapeHtml(card.position)}</span>` : ""}
        ${card.season ? `<span class="card-pill">${escapeHtml(card.season)}</span>` : ""}
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
    type: String(formData.get("type") || "Base Card").trim(),
    position: String(formData.get("position") || "").trim(),
    attack: String(formData.get("attack") || "").trim(),
    defense: String(formData.get("defense") || "").trim(),
    rating: String(formData.get("rating") || "").trim(),
    cardNumber: String(formData.get("cardNumber") || "").trim(),
    season: String(formData.get("season") || "").trim(),
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
  updateBattleTeamOptions();
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
  updateBattleTeamOptions();
});

cardSearch?.addEventListener("input", renderCards);
clearCardsButton?.addEventListener("click", () => {
  if (!cards.length) return;
  if (!confirm("Clear all cards from this browser?")) return;
  cards = [];
  saveCards();
  renderCards();
  updateBattleTeamOptions();
});

exportCardsButton?.addEventListener("click", () => {
  const headers = ["Player", "Team", "Type", "Position", "Attack", "Defense", "Overall", "Card Number", "Season", "Quantity", "Notes"];
  const rows = cards.map(card => [card.player, card.team, card.type, card.position, card.attack, card.defense, card.rating, card.cardNumber, card.season, card.quantity, card.notes]);
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


const homeBattleTeam = document.querySelector("#homeBattleTeam");
const awayBattleTeam = document.querySelector("#awayBattleTeam");
const runBattleButton = document.querySelector("#runBattle");
const battleResult = document.querySelector("#battleResult");
const positionOrder = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

function normalizePosition(position) {
  const value = String(position || "").toLowerCase();
  if (value.includes("goal") || value === "gk") return "Goalkeeper";
  if (value.includes("def")) return "Defender";
  if (value.includes("mid")) return "Midfielder";
  if (value.includes("for") || value.includes("att") || value.includes("striker")) return "Forward";
  return "";
}

function cardPower(card, slotPosition) {
  const attack = Number(card.attack || 0);
  const defense = Number(card.defense || 0);
  const actualPosition = normalizePosition(card.position);
  const outOfPosition = actualPosition !== slotPosition;
  const penalty = outOfPosition ? 20 : 0;
  return { total: attack + defense - penalty, outOfPosition, attack, defense, actualPosition };
}

function teamNamesFromCards() {
  return [...new Set(cards.map(card => card.team).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function updateBattleTeamOptions() {
  if (!homeBattleTeam || !awayBattleTeam) return;
  const names = teamNamesFromCards();
  const previousHome = homeBattleTeam.value;
  const previousAway = awayBattleTeam.value;
  const options = names.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
  homeBattleTeam.innerHTML = options || `<option value="">Add cards first</option>`;
  awayBattleTeam.innerHTML = options || `<option value="">Add cards first</option>`;
  if (names.includes(previousHome)) homeBattleTeam.value = previousHome;
  if (names.includes(previousAway)) awayBattleTeam.value = previousAway;
  if (!awayBattleTeam.value && names.length > 1) awayBattleTeam.value = names[1];
}

function cardsForTeam(team) {
  return cards
    .filter(card => card.team === team)
    .flatMap(card => {
      const quantity = Math.max(1, Number(card.quantity || 1));
      return Array.from({ length: quantity }, (_, index) => ({ ...card, battleCopy: index + 1 }));
    });
}

function hasRequiredPositions(teamCards) {
  return positionOrder.every(position => teamCards.some(card => normalizePosition(card.position) === position));
}

function nextPositionSlots(homeCards, count) {
  const remainingByPosition = Object.fromEntries(positionOrder.map(position => [position, homeCards.filter(card => normalizePosition(card.position) === position).length]));
  const slots = [];
  for (const position of positionOrder) {
    if (remainingByPosition[position] > 0 && slots.length < count) {
      slots.push(position);
      remainingByPosition[position] -= 1;
    }
  }
  let guard = 0;
  while (slots.length < count && guard < 500) {
    for (const position of positionOrder) {
      if (remainingByPosition[position] > 0 && slots.length < count) {
        slots.push(position);
        remainingByPosition[position] -= 1;
      }
    }
    guard += 1;
    if (!Object.values(remainingByPosition).some(Boolean)) break;
  }
  return slots;
}

function pickCardForSlot(pool, slotPosition, preferPosition = true) {
  let candidates = preferPosition ? pool.filter(card => normalizePosition(card.position) === slotPosition) : [];
  if (!candidates.length) candidates = pool;
  candidates.sort((a, b) => cardPower(b, slotPosition).total - cardPower(a, slotPosition).total);
  const chosen = candidates[0];
  pool.splice(pool.indexOf(chosen), 1);
  return chosen;
}

function buildBattleLineups(homeCards, awayCards) {
  const battleCount = Math.min(homeCards.length, awayCards.length);
  const slots = nextPositionSlots(homeCards, battleCount);
  const homePool = [...homeCards];
  const awayPool = [...awayCards];
  return slots.map(slot => ({
    slot,
    homeCard: pickCardForSlot(homePool, slot, true),
    awayCard: pickCardForSlot(awayPool, slot, true)
  }));
}

function runTeamBattle() {
  if (!battleResult) return;
  const homeTeam = homeBattleTeam.value;
  const awayTeam = awayBattleTeam.value;
  if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
    battleResult.innerHTML = `<div class="battle-warning">Choose two different teams.</div>`;
    return;
  }
  const homeCards = cardsForTeam(homeTeam);
  const awayCards = cardsForTeam(awayTeam);
  if (homeCards.length < 4 || awayCards.length < 4) {
    battleResult.innerHTML = `<div class="battle-warning">Both teams need at least 4 cards: 1 GK, 1 DEF, 1 MID, and 1 ATT.</div>`;
    return;
  }
  if (!hasRequiredPositions(homeCards) || !hasRequiredPositions(awayCards)) {
    battleResult.innerHTML = `<div class="battle-warning">Both teams must have at least 1 Goalkeeper, 1 Defender, 1 Midfielder, and 1 Forward/Attack card.</div>`;
    return;
  }
  const rounds = buildBattleLineups(homeCards, awayCards);
  let homeGoals = 0;
  let awayGoals = 0;
  const roundHtml = rounds.map((round, index) => {
    const homePower = cardPower(round.homeCard, round.slot);
    const awayPower = cardPower(round.awayCard, round.slot);
    const homeWon = homePower.total > awayPower.total;
    const awayWon = awayPower.total > homePower.total;
    if (homeWon) homeGoals += 1;
    if (awayWon) awayGoals += 1;
    return `
      <div class="battle-round">
        <div class="battle-round-title"><span>Round ${index + 1}</span><span>Position slot: ${round.slot}</span></div>
        <div class="battle-matchup">
          <div class="battle-card-side ${homeWon ? "won" : awayWon ? "lost" : ""}">
            <div class="battle-card-player">${escapeHtml(round.homeCard.player)}</div>
            <div class="battle-card-detail">${escapeHtml(round.homeCard.position || "No position")} ? ATT ${escapeHtml(round.homeCard.attack || 0)} + DEF ${escapeHtml(round.homeCard.defense || 0)}</div>
            ${homePower.outOfPosition ? `<div class="out-position">Out of position: -20</div>` : ""}
          </div>
          <div class="battle-total">${homePower.total} - ${awayPower.total}</div>
          <div class="battle-card-side away ${awayWon ? "won" : homeWon ? "lost" : ""}">
            <div class="battle-card-player">${escapeHtml(round.awayCard.player)}</div>
            <div class="battle-card-detail">${escapeHtml(round.awayCard.position || "No position")} ? ATT ${escapeHtml(round.awayCard.attack || 0)} + DEF ${escapeHtml(round.awayCard.defense || 0)}</div>
            ${awayPower.outOfPosition ? `<div class="out-position">Out of position: -20</div>` : ""}
          </div>
        </div>
      </div>`;
  }).join("");

  battleResult.innerHTML = `
    <div class="battle-scoreboard">
      <div class="battle-team-name">${escapeHtml(homeTeam)}</div>
      <div class="battle-score">${homeGoals} - ${awayGoals}</div>
      <div class="battle-team-name away">${escapeHtml(awayTeam)}</div>
    </div>
    <div class="battle-rounds">${roundHtml}</div>`;
}

runBattleButton?.addEventListener("click", runTeamBattle);
updateBattleTeamOptions();
