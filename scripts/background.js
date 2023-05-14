// let runtime;
// if (typeof browser !== "undefined" && typeof browser.runtime !== "undefined")
//   runtime = browser.runtime;
// else if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined")
//   runtime = chrome.runtime;
// else throw new Error("API runtime no encontrado");

chrome.runtime.onMessage.addListener((request, sender, callback) => {
  if (!sender || !sender.tab || !("query" in request)) return false;
  if (request.query === "FetchGames") return FetchGames(request, callback);
  // switch (request.query) {
  //   case "FetchGames":
  //     return FetchGames(request, callback);
  // }
  return false;
});

function FetchGames(request, callback) {
  fetch(`https://steamcommunity.com/profiles/${request.id}/games/?tab=all`)
    .then((resp) => resp.text())
    .then((html) => {
      let data = JSON.parse(
        html.match(/data-profile-gameslist="(.+?)"/)[1].replace(/&quot;/g, '"')
      );
      // const userName = data.strProfileName;
      // const userID = data.strSteamId;
      const games = data.rgGames;
      callback(games);
      return true;
    })
    .catch((e) => false);
}
