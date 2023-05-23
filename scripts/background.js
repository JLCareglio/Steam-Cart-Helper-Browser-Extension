// let runtime;
// if (typeof browser !== "undefined" && typeof browser.runtime !== "undefined")
//   runtime = browser.runtime;
// else if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined")
//   runtime = chrome.runtime;
// else throw new Error("API runtime no encontrado");

chrome.runtime.onMessage.addListener((request, sender, callback) => {
  if (!sender || !sender.tab || !("query" in request)) return false;
  switch (request.query) {
    case "FetchGames":
      FetchGames(request, callback);
      return true;
    case "FetchFriendsHTML":
      FetchFriendsHTML(request, callback);
      return true;
  }

  return false;
});

async function FetchGames(request, callback) {
  const fetchURL = isNaN(request.id)
    ? `https://steamcommunity.com/id/${request.id}/games/?tab=all`
    : `https://steamcommunity.com/profiles/${request.id}/games/?tab=all`;

  try {
    const resp = await fetch(fetchURL);
    const html = await resp.text();
    let data = JSON.parse(
      html.match(/data-profile-gameslist="(.+?)"/)[1].replace(/&quot;/g, '"')
    );
    callback(data.rgGames);
  } catch (error) {
    try {
      const html = await OpenAndExtractHTML(fetchURL);
      let data = JSON.parse(
        html.match(/data-profile-gameslist="(.+?)"/)[1].replace(/&quot;/g, '"')
      );
      callback(data.rgGames);
    } catch (error) {
      callback(error);
    }
  }
}

function FetchFriendsHTML(request, callback) {
  const fetchURL = isNaN(request.id)
    ? `https://steamcommunity.com/id/${request.id}/friends`
    : `https://steamcommunity.com/profiles/${request.id}/friends`;

  fetch(fetchURL)
    .then((resp) => resp.text())
    .then((html) => callback(html))
    .catch((error) => callback(null));
}

function OpenAndExtractHTML(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: url, active: false }, (tab) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: () => document.documentElement.innerHTML,
        },
        (result) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(result[0].result);
          chrome.tabs.remove(tab.id);
        }
      );
    });
  });
}
