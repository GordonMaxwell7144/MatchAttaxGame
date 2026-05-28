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
    const data = rows.slice(1).filter(row => row[1]);
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
    scheduleRows = rows.slice(1)
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
