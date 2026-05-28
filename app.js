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

const PHOTO_CARD_SEED_VERSION = "binder-photo-2026-05-27-v1";
const photoCards = [
  {
    "id": "photo-card-001",
    "player": "Jack Grealish",
    "team": "Man City",
    "type": "Base Card",
    "position": "Forward",
    "attack": "82",
    "defense": "44",
    "rating": "",
    "cardNumber": "31",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-002",
    "player": "Ruben Dias",
    "team": "Man City",
    "type": "Base Card",
    "position": "Defender",
    "attack": "43",
    "defense": "86",
    "rating": "",
    "cardNumber": "12",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-003",
    "player": "Ederson",
    "team": "Man City",
    "type": "Base Card",
    "position": "Goalkeeper",
    "attack": "16",
    "defense": "88",
    "rating": "",
    "cardNumber": "11",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-004",
    "player": "Zlatan Ibrahimovic",
    "team": "AC Milan",
    "type": "Vintage Vibes Legend",
    "position": "Forward",
    "attack": "94",
    "defense": "42",
    "rating": "",
    "cardNumber": "428",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-005",
    "player": "Christian Pulisic",
    "team": "AC Milan",
    "type": "Man of the Match",
    "position": "Forward",
    "attack": "88",
    "defense": "42",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-006",
    "player": "Kaka",
    "team": "AC Milan",
    "type": "Trophy Triumph",
    "position": "Midfielder",
    "attack": "95",
    "defense": "45",
    "rating": "",
    "cardNumber": "440",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-007",
    "player": "Ruben Loftus-Cheek",
    "team": "AC Milan",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "77",
    "defense": "64",
    "rating": "",
    "cardNumber": "303",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-008",
    "player": "Theo Hernandez",
    "team": "AC Milan",
    "type": "Base Card",
    "position": "Defender",
    "attack": "74",
    "defense": "86",
    "rating": "",
    "cardNumber": "38",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-009",
    "player": "Davide Calabria",
    "team": "AC Milan",
    "type": "Respect Captain",
    "position": "Defender",
    "attack": "63",
    "defense": "79",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-010",
    "player": "Mike Maignan",
    "team": "AC Milan",
    "type": "Base Card",
    "position": "Goalkeeper",
    "attack": "10",
    "defense": "86",
    "rating": "",
    "cardNumber": "308",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-011",
    "player": "Thierry Henry",
    "team": "Arsenal",
    "type": "Vintage Vibes Legend",
    "position": "Forward",
    "attack": "96",
    "defense": "43",
    "rating": "",
    "cardNumber": "416",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-012",
    "player": "Gabriel Martinelli",
    "team": "Arsenal",
    "type": "Base Card",
    "position": "Forward",
    "attack": "83",
    "defense": "42",
    "rating": "",
    "cardNumber": "43",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-013",
    "player": "Declan Rice",
    "team": "Arsenal",
    "type": "Man of the Match",
    "position": "Midfielder",
    "attack": "76",
    "defense": "94",
    "rating": "",
    "cardNumber": "398",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-014",
    "player": "Kai Havertz",
    "team": "Arsenal",
    "type": "Heritage",
    "position": "Midfielder",
    "attack": "91",
    "defense": "50",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-015",
    "player": "Jorginho",
    "team": "Arsenal",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "56",
    "defense": "79",
    "rating": "",
    "cardNumber": "37",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-016",
    "player": "Tony Adams",
    "team": "Arsenal",
    "type": "Vintage Vibes Legend",
    "position": "Defender",
    "attack": "51",
    "defense": "91",
    "rating": "",
    "cardNumber": "415",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-017",
    "player": "Jurrien Timber",
    "team": "Arsenal",
    "type": "Base Card",
    "position": "Defender",
    "attack": "55",
    "defense": "78",
    "rating": "",
    "cardNumber": "34",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-018",
    "player": "William Saliba",
    "team": "Arsenal",
    "type": "Base Card",
    "position": "Defender",
    "attack": "40",
    "defense": "85",
    "rating": "",
    "cardNumber": "41",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-019",
    "player": "Leandro Trossard",
    "team": "Arsenal",
    "type": "Base Card",
    "position": "Forward",
    "attack": "80",
    "defense": "41",
    "rating": "",
    "cardNumber": "40",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-020",
    "player": "Eddie Nketiah",
    "team": "Arsenal",
    "type": "Base Card",
    "position": "Forward",
    "attack": "76",
    "defense": "35",
    "rating": "",
    "cardNumber": "44",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-021",
    "player": "Jakub Kiwior",
    "team": "Arsenal",
    "type": "Base Card",
    "position": "Defender",
    "attack": "46",
    "defense": "76",
    "rating": "",
    "cardNumber": "32",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-022",
    "player": "Takehiro Tomiyasu",
    "team": "Arsenal",
    "type": "Base Card",
    "position": "Defender",
    "attack": "45",
    "defense": "76",
    "rating": "",
    "cardNumber": "36",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-023",
    "player": "Ademola Lookman",
    "team": "Atalanta",
    "type": "Base Card",
    "position": "Forward",
    "attack": "78",
    "defense": "37",
    "rating": "",
    "cardNumber": "350",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-024",
    "player": "Gianluca Scamacca",
    "team": "Atalanta",
    "type": "Base Card",
    "position": "Forward",
    "attack": "78",
    "defense": "29",
    "rating": "",
    "cardNumber": "348",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-025",
    "player": "Teun Koopmeiners",
    "team": "Atalanta",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "76",
    "defense": "80",
    "rating": "",
    "cardNumber": "348",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-026",
    "player": "Charles De Ketelaere",
    "team": "Atalanta",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "78",
    "defense": "58",
    "rating": "",
    "cardNumber": "349",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-027",
    "player": "Rafael Toloi",
    "team": "Atalanta",
    "type": "Respect Captain",
    "position": "Defender",
    "attack": "49",
    "defense": "76",
    "rating": "",
    "cardNumber": "345",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-028",
    "player": "Axel Witsel",
    "team": "Atletico Madrid",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "51",
    "defense": "78",
    "rating": "",
    "cardNumber": "110",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-029",
    "player": "Antoine Griezmann",
    "team": "Atletico Madrid",
    "type": "Base Card",
    "position": "Forward",
    "attack": "86",
    "defense": "67",
    "rating": "",
    "cardNumber": "109",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-030",
    "player": "Nahuel Molina",
    "team": "Atletico Madrid",
    "type": "Base Card",
    "position": "Defender",
    "attack": "58",
    "defense": "80",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-031",
    "player": "Moussa Diaby",
    "team": "Aston Villa",
    "type": "Base Card",
    "position": "Forward",
    "attack": "79",
    "defense": "43",
    "rating": "",
    "cardNumber": "7",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-032",
    "player": "Leon Bailey",
    "team": "Aston Villa",
    "type": "Base Card",
    "position": "Forward",
    "attack": "79",
    "defense": "36",
    "rating": "",
    "cardNumber": "8",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-033",
    "player": "Pau Torres",
    "team": "Aston Villa",
    "type": "Base Card",
    "position": "Defender",
    "attack": "46",
    "defense": "82",
    "rating": "",
    "cardNumber": "3",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-034",
    "player": "Emiliano Martinez",
    "team": "Aston Villa",
    "type": "Base Card",
    "position": "Goalkeeper",
    "attack": "12",
    "defense": "85",
    "rating": "",
    "cardNumber": "2",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-035",
    "player": "Fermin Lopez",
    "team": "Barcelona",
    "type": "Attax Debut",
    "position": "Midfielder",
    "attack": "74",
    "defense": "42",
    "rating": "",
    "cardNumber": "146",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-036",
    "player": "Andreas Christensen",
    "team": "Barcelona",
    "type": "Base Card",
    "position": "Defender",
    "attack": "37",
    "defense": "79",
    "rating": "",
    "cardNumber": "139",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-037",
    "player": "Robert Lewandowski",
    "team": "Barcelona",
    "type": "Base Card",
    "position": "Forward",
    "attack": "88",
    "defense": "34",
    "rating": "",
    "cardNumber": "149",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-038",
    "player": "Pedri",
    "team": "Barcelona",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "84",
    "defense": "69",
    "rating": "",
    "cardNumber": "146",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-039",
    "player": "Ronald Araujo",
    "team": "Barcelona",
    "type": "Base Card",
    "position": "Defender",
    "attack": "48",
    "defense": "84",
    "rating": "",
    "cardNumber": "138",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-040",
    "player": "Jules Kounde",
    "team": "Barcelona",
    "type": "Base Card",
    "position": "Defender",
    "attack": "57",
    "defense": "84",
    "rating": "",
    "cardNumber": "144",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-041",
    "player": "Lionel Messi",
    "team": "Barcelona",
    "type": "Vintage Vibes Legend",
    "position": "Forward",
    "attack": "99",
    "defense": "36",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-042",
    "player": "Gary Lineker",
    "team": "Barcelona",
    "type": "Vintage Vibes Legend",
    "position": "Forward",
    "attack": "91",
    "defense": "42",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-043",
    "player": "Frenkie de Jong",
    "team": "Barcelona",
    "type": "Man of the Match",
    "position": "Midfielder",
    "attack": "73",
    "defense": "94",
    "rating": "",
    "cardNumber": "397",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-044",
    "player": "Raphinha",
    "team": "Barcelona",
    "type": "Base Card",
    "position": "Forward",
    "attack": "78",
    "defense": "40",
    "rating": "",
    "cardNumber": "142",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-045",
    "player": "Ferran Torres",
    "team": "Barcelona",
    "type": "Base Card",
    "position": "Forward",
    "attack": "80",
    "defense": "37",
    "rating": "",
    "cardNumber": "148",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-046",
    "player": "Marc-Andre ter Stegen",
    "team": "Barcelona",
    "type": "Base Card",
    "position": "Goalkeeper",
    "attack": "11",
    "defense": "87",
    "rating": "",
    "cardNumber": "137",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-047",
    "player": "Aleix Garcia",
    "team": "Bayer Leverkusen",
    "type": "Attax Debut",
    "position": "Midfielder",
    "attack": "61",
    "defense": "77",
    "rating": "",
    "cardNumber": "204",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-048",
    "player": "Matthijs de Ligt",
    "team": "Bayern Munich",
    "type": "Base Card",
    "position": "Defender",
    "attack": "42",
    "defense": "83",
    "rating": "",
    "cardNumber": "210",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-049",
    "player": "Eric Dier",
    "team": "Bayern Munich",
    "type": "Base Card",
    "position": "Defender",
    "attack": "46",
    "defense": "76",
    "rating": "",
    "cardNumber": "203",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-050",
    "player": "Dan Ndoye",
    "team": "Bologna",
    "type": "Attax Debut",
    "position": "Forward",
    "attack": "75",
    "defense": "42",
    "rating": "",
    "cardNumber": "342",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-051",
    "player": "Remo Freuler",
    "team": "Bologna",
    "type": "Limited Edition",
    "position": "Midfielder",
    "attack": "77",
    "defense": "84",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-052",
    "player": "Giovanni Fabbian",
    "team": "Bologna",
    "type": "Attax Debut",
    "position": "Midfielder",
    "attack": "71",
    "defense": "68",
    "rating": "",
    "cardNumber": "338",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-053",
    "player": "Stefan Posch",
    "team": "Bologna",
    "type": "Base Card",
    "position": "Defender",
    "attack": "58",
    "defense": "75",
    "rating": "",
    "cardNumber": "338",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-054",
    "player": "Sam Beukema",
    "team": "Bologna",
    "type": "Attax Debut",
    "position": "Defender",
    "attack": "30",
    "defense": "72",
    "rating": "",
    "cardNumber": "327",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-055",
    "player": "Gregor Kobel",
    "team": "Borussia Dortmund",
    "type": "100 Club",
    "position": "Goalkeeper",
    "attack": "15",
    "defense": "100",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-056",
    "player": "Julian Brandt",
    "team": "Borussia Dortmund",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "80",
    "defense": "52",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-057",
    "player": "Karim Adeyemi",
    "team": "Borussia Dortmund",
    "type": "Heritage",
    "position": "Forward",
    "attack": "87",
    "defense": "40",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-058",
    "player": "Nico Schlotterbeck",
    "team": "Borussia Dortmund",
    "type": "Base Card",
    "position": "Defender",
    "attack": "46",
    "defense": "79",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-059",
    "player": "Marcel Sabitzer",
    "team": "Borussia Dortmund",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "78",
    "defense": "68",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-060",
    "player": "Niklas Sule",
    "team": "Borussia Dortmund",
    "type": "Base Card",
    "position": "Defender",
    "attack": "42",
    "defense": "80",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-061",
    "player": "Emre Can",
    "team": "Borussia Dortmund",
    "type": "Respect Captain",
    "position": "Midfielder",
    "attack": "88",
    "defense": "77",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-062",
    "player": "Luis Palma",
    "team": "Celtic",
    "type": "Heritage",
    "position": "Forward",
    "attack": "83",
    "defense": "40",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-063",
    "player": "Daizen Maeda",
    "team": "Celtic",
    "type": "Base Card",
    "position": "Forward",
    "attack": "73",
    "defense": "46",
    "rating": "",
    "cardNumber": "376",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-064",
    "player": "Benjamin Siegrist",
    "team": "Celtic",
    "type": "Base Card",
    "position": "Goalkeeper",
    "attack": "6",
    "defense": "61",
    "rating": "",
    "cardNumber": "371",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-065",
    "player": "Liam Scales",
    "team": "Celtic",
    "type": "Base Card",
    "position": "Defender",
    "attack": "31",
    "defense": "66",
    "rating": "",
    "cardNumber": "345",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-066",
    "player": "Cole Palmer",
    "team": "Chelsea",
    "type": "Base Card",
    "position": "Forward",
    "attack": "88",
    "defense": "43",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-067",
    "player": "Marc Cucurella",
    "team": "Chelsea",
    "type": "Base Card",
    "position": "Defender",
    "attack": "70",
    "defense": "76",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-068",
    "player": "Conor Gallagher",
    "team": "Chelsea",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "76",
    "defense": "88",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-069",
    "player": "Levi Colwill",
    "team": "Chelsea",
    "type": "Heritage",
    "position": "Defender",
    "attack": "57",
    "defense": "83",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-070",
    "player": "Benoit Badiashile",
    "team": "Chelsea",
    "type": "Base Card",
    "position": "Defender",
    "attack": "61",
    "defense": "76",
    "rating": "",
    "cardNumber": "96",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-071",
    "player": "Moises Caicedo",
    "team": "Chelsea",
    "type": "Man of the Match",
    "position": "Midfielder",
    "attack": "66",
    "defense": "87",
    "rating": "",
    "cardNumber": "400",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-072",
    "player": "Fares Chaibi",
    "team": "Frankfurt",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "73",
    "defense": "59",
    "rating": "",
    "cardNumber": "260",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-073",
    "player": "Omar Marmoush",
    "team": "Frankfurt",
    "type": "Base Card",
    "position": "Forward",
    "attack": "75",
    "defense": "31",
    "rating": "",
    "cardNumber": "251",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-074",
    "player": "Mario Gotze",
    "team": "Frankfurt",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "77",
    "defense": "48",
    "rating": "",
    "cardNumber": "248",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-075",
    "player": "Hugo Ekitike",
    "team": "Frankfurt",
    "type": "Base Card",
    "position": "Forward",
    "attack": "73",
    "defense": "30",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-076",
    "player": "Javier Zanetti",
    "team": "Inter Milan",
    "type": "Trophy Triumph",
    "position": "Defender",
    "attack": "64",
    "defense": "97",
    "rating": "",
    "cardNumber": "440",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-077",
    "player": "Fabio Cannavaro",
    "team": "Inter Milan",
    "type": "Vintage Vibes Legend",
    "position": "Defender",
    "attack": "47",
    "defense": "91",
    "rating": "",
    "cardNumber": "427",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-078",
    "player": "Marco Materazzi",
    "team": "Inter Milan",
    "type": "Vintage Vibes Legend",
    "position": "Defender",
    "attack": "52",
    "defense": "90",
    "rating": "",
    "cardNumber": "426",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-079",
    "player": "Marcus Thuram",
    "team": "Inter Milan",
    "type": "Base Card",
    "position": "Forward",
    "attack": "82",
    "defense": "38",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-080",
    "player": "Alessandro Bastoni",
    "team": "Inter Milan",
    "type": "Base Card",
    "position": "Defender",
    "attack": "58",
    "defense": "84",
    "rating": "",
    "cardNumber": "440",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-081",
    "player": "Yann Sommer",
    "team": "Inter Milan",
    "type": "Base Card",
    "position": "Goalkeeper",
    "attack": "8",
    "defense": "85",
    "rating": "",
    "cardNumber": "299",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-082",
    "player": "Filip Kostic",
    "team": "Juventus",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "81",
    "defense": "62",
    "rating": "",
    "cardNumber": "325",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-083",
    "player": "Weston McKennie",
    "team": "Juventus",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "66",
    "defense": "76",
    "rating": "",
    "cardNumber": "324",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-084",
    "player": "Kenan Yildiz",
    "team": "Juventus",
    "type": "Attax Debut",
    "position": "Forward",
    "attack": "76",
    "defense": "28",
    "rating": "",
    "cardNumber": "330",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-085",
    "player": "Douglas Luiz",
    "team": "Juventus",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "71",
    "defense": "81",
    "rating": "",
    "cardNumber": "326",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-086",
    "player": "Nicolo Fagioli",
    "team": "Juventus",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "61",
    "defense": "75",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-087",
    "player": "Federico Chiesa",
    "team": "Juventus",
    "type": "Base Card",
    "position": "Forward",
    "attack": "82",
    "defense": "42",
    "rating": "",
    "cardNumber": "330",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-088",
    "player": "Danilo",
    "team": "Juventus",
    "type": "Respect Captain",
    "position": "Defender",
    "attack": "59",
    "defense": "77",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-089",
    "player": "Tiago Djalo",
    "team": "Juventus",
    "type": "Base Card",
    "position": "Defender",
    "attack": "36",
    "defense": "77",
    "rating": "",
    "cardNumber": "321",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-090",
    "player": "Federico Gatti",
    "team": "Juventus",
    "type": "Base Card",
    "position": "Defender",
    "attack": "55",
    "defense": "76",
    "rating": "",
    "cardNumber": "320",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-091",
    "player": "Dusan Vlahovic",
    "team": "Juventus",
    "type": "Base Card",
    "position": "Forward",
    "attack": "84",
    "defense": "33",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-092",
    "player": "Gianluigi Buffon",
    "team": "Juventus",
    "type": "Vintage Vibes Legend",
    "position": "Goalkeeper",
    "attack": "22",
    "defense": "96",
    "rating": "",
    "cardNumber": "429",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-093",
    "player": "Mattia Zaccagni",
    "team": "Lazio",
    "type": "Base Card",
    "position": "Forward",
    "attack": "80",
    "defense": "43",
    "rating": "",
    "cardNumber": "386",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-094",
    "player": "Ciro Immobile",
    "team": "Lazio",
    "type": "Respect Captain",
    "position": "Forward",
    "attack": "82",
    "defense": "35",
    "rating": "",
    "cardNumber": "389",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-095",
    "player": "Matteo Guendouzi",
    "team": "Lazio",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "70",
    "defense": "80",
    "rating": "",
    "cardNumber": "366",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-096",
    "player": "Manuel Lazzari",
    "team": "Lazio",
    "type": "Base Card",
    "position": "Defender",
    "attack": "74",
    "defense": "63",
    "rating": "",
    "cardNumber": "366",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-097",
    "player": "Ivan Provedel",
    "team": "Lazio",
    "type": "Base Card",
    "position": "Goalkeeper",
    "attack": "8",
    "defense": "78",
    "rating": "",
    "cardNumber": "362",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-098",
    "player": "Mohamed Salah",
    "team": "Liverpool",
    "type": "Base Card",
    "position": "Forward",
    "attack": "89",
    "defense": "42",
    "rating": "",
    "cardNumber": "69",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-099",
    "player": "Diogo Jota",
    "team": "Liverpool",
    "type": "Base Card",
    "position": "Forward",
    "attack": "84",
    "defense": "50",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-100",
    "player": "Darwin Nunez",
    "team": "Liverpool",
    "type": "Base Card",
    "position": "Forward",
    "attack": "82",
    "defense": "45",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-101",
    "player": "Ryan Gravenberch",
    "team": "Liverpool",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "75",
    "defense": "70",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-102",
    "player": "Curtis Jones",
    "team": "Liverpool",
    "type": "Base Card",
    "position": "Midfielder",
    "attack": "77",
    "defense": "65",
    "rating": "",
    "cardNumber": "65",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-103",
    "player": "Luis Diaz",
    "team": "Liverpool",
    "type": "Man of the Match",
    "position": "Forward",
    "attack": "93",
    "defense": "44",
    "rating": "",
    "cardNumber": "398",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-104",
    "player": "Steven Gerrard",
    "team": "Liverpool",
    "type": "Trophy Triumph",
    "position": "Midfielder",
    "attack": "97",
    "defense": "88",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-105",
    "player": "Alexis Mac Allister",
    "team": "Liverpool",
    "type": "Limited Edition",
    "position": "Midfielder",
    "attack": "88",
    "defense": "84",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-106",
    "player": "Harvey Elliott",
    "team": "Liverpool",
    "type": "Heritage",
    "position": "Midfielder",
    "attack": "86",
    "defense": "57",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-107",
    "player": "Joe Gomez",
    "team": "Liverpool",
    "type": "Base Card",
    "position": "Defender",
    "attack": "55",
    "defense": "78",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-108",
    "player": "Ibrahima Konate",
    "team": "Liverpool",
    "type": "Base Card",
    "position": "Defender",
    "attack": "43",
    "defense": "82",
    "rating": "",
    "cardNumber": "50",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-109",
    "player": "Julian Alvarez",
    "team": "Man City",
    "type": "Base Card",
    "position": "Forward",
    "attack": "83",
    "defense": "48",
    "rating": "",
    "cardNumber": "26",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-110",
    "player": "Savio",
    "team": "Man City",
    "type": "Attax Debut",
    "position": "Forward",
    "attack": "75",
    "defense": "36",
    "rating": "",
    "cardNumber": "24",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-111",
    "player": "Rodri",
    "team": "Man City",
    "type": "Man of the Match",
    "position": "Midfielder",
    "attack": "77",
    "defense": "99",
    "rating": "",
    "cardNumber": "397",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-112",
    "player": "Phil Foden",
    "team": "Man City",
    "type": "100 Club",
    "position": "Midfielder",
    "attack": "100",
    "defense": "59",
    "rating": "",
    "cardNumber": "475",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-113",
    "player": "Kyle Walker",
    "team": "Man City",
    "type": "Respect Captain",
    "position": "Defender",
    "attack": "65",
    "defense": "82",
    "rating": "",
    "cardNumber": "18",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-114",
    "player": "Josko Gvardiol",
    "team": "Man City",
    "type": "Base Card",
    "position": "Defender",
    "attack": "59",
    "defense": "82",
    "rating": "",
    "cardNumber": "",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  },
  {
    "id": "photo-card-115",
    "player": "John Stones",
    "team": "Man City",
    "type": "Base Card",
    "position": "Defender",
    "attack": "49",
    "defense": "84",
    "rating": "",
    "cardNumber": "14",
    "season": "2024/25",
    "quantity": 1,
    "notes": "Added from binder photo",
    "createdAt": "2026-05-27T00:00:00.000Z"
  }
];

function cardIdentity(card) {
  return [card.player, card.team, card.type, card.cardNumber]
    .map(value => String(value || "").trim().toLowerCase())
    .join("|");
}

function seedPhotoCards() {
  if (localStorage.getItem(PHOTO_CARD_SEED_VERSION) === "done") return;
  const existing = new Set(cards.map(cardIdentity));
  const additions = photoCards.filter(card => !existing.has(cardIdentity(card)));
  if (additions.length) {
    cards = [...additions, ...cards];
    saveCards();
  }
  localStorage.setItem(PHOTO_CARD_SEED_VERSION, "done");
}

seedPhotoCards();

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
