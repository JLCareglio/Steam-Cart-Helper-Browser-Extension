// let runtime;
// if (typeof browser !== "undefined" && typeof browser.runtime !== "undefined")
//   runtime = browser.runtime;
// else if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined")
//   runtime = chrome.runtime;
// else throw new Error("API runtime no encontrado");

chrome.runtime.onMessage.addListener((request, sender, callback) => {
  if (!sender || !sender.tab || !("query" in request)) return false;
  if (request.query === "FetchGames") {
    FetchGames(request.id)
      .then((games) => callback(games))
      .catch((error) => callback(null));
    return true;
  }
  return false;
});

//

function FetchGames(id) {
  return fetch(`https://steamcommunity.com/profiles/${id}/games/?tab=all`)
    .then((resp) => resp.text())
    .then((html) => {
      let data = JSON.parse(
        html.match(/data-profile-gameslist="(.+?)"/)[1].replace(/&quot;/g, '"')
      );
      // console.log(data);
      return data.rgGames;
    });
}
