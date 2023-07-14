const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server Started at http://localhost:3004");
    });
  } catch (e) {
    console.log("db Error: ${e.message}");
    process.exit(1);
  }
};
initializeDBAndServer();

//Get Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
        *
    FROM
        player_details
    ORDER BY
        player_id`;
  const playersArray = await db.all(getPlayersQuery);
  const ans = (playersArray) => {
    return {
      playerId: playersArray.player_id,
      playerName: playersArray.player_name,
    };
  };
  response.send(playersArray.map((eachPlayer) => ans(eachPlayer)));
});

//Get Player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
        *
    FROM
        player_details
    WHERE
        player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  const ans = (player) => {
    return {
      playerId: player.player_id,
      playerName: player.player_name,
    };
  };
  response.send(ans(player));
});

//Put Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE 
        player_details
    SET
        player_name='${playerName}'
    WHERE 
        player_id=${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match API
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
        *
    FROM
        match_details
    WHERE
        match_id=${matchId};`;
  const match = await db.get(getMatchQuery);
  const ans = (match) => {
    return {
      matchId: match.match_id,
      match: match.match,
      year: match.year,
    };
  };
  response.send(ans(match));
});

//Get matches API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
    SELECT 
        match_id,
        match,
        year
    FROM
         player_match_score NATURAL JOIN match_details
    WHERE
        player_id=${playerId};`;
  const playerMatch = await db.all(getMatchesQuery);
  const res = (playerMatch) => {
    return {
      matchId: playerMatch.match_id,
      match: playerMatch.match,
      year: playerMatch.year,
    };
  };
  response.send(playerMatch.map((eachPlayer) => res(eachPlayer)));
});

//Get player API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
    SELECT 
        player_id,
        player_name
    FROM player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const playersArray = await db.all(getPlayerQuery);
  const res = (playersArray) => {
    return {
      playerId: playersArray.player_id,
      playerName: playersArray.player_name,
    };
  };
  response.send(playersArray.map((eachArray) => res(eachArray)));
});

//Get PlayerScores API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT
         player_id,
         player_name,
         SUM(score) AS totalScore,
         SUM(fours) AS totalFours,
         SUM(sixes) AS totalSixes
    FROM
        player_match_score NATURAL JOIN player_details
    WHERE
        player_id=${playerId}
    GROUP BY 
        player_id;`;
  const playerScores = await db.get(getPlayerScoresQuery);
  const res = (playerScores) => {
    return {
      playerId: playerScores.player_id,
      playerName: playerScores.player_name,
      totalScore: playerScores.totalScore,
      totalFours: playerScores.totalFours,
      totalSixes: playerScores.totalSixes,
    };
  };
  response.send(res(playerScores));
});
module.exports = app;
