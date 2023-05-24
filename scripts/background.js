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
    case "FetchFriends":
      FetchFriends(request, callback);
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
    const HTML = await resp.text();
    let data = JSON.parse(
      HTML.match(/data-profile-gameslist="(.+?)"/)[1].replace(/&quot;/g, '"')
    );
    callback(data.rgGames);
  } catch (error) {
    try {
      const HTML = await OpenAndExtractHTML(fetchURL);
      let data = JSON.parse(
        HTML.match(/data-profile-gameslist="(.+?)"/)[1].replace(/&quot;/g, '"')
      );
      callback(data.rgGames);
    } catch (error) {
      callback(error);
    }
  }
}

async function FetchFriends(request, callback) {
  const fetchURL = isNaN(request.id)
    ? `https://steamcommunity.com/id/${request.id}/friends`
    : `https://steamcommunity.com/profiles/${request.id}/friends`;

  // fetch(fetchURL)
  //   .then((resp) => resp.text())
  //   .then((html) => callback(html))
  //   .catch((error) => callback(null));

  const regex = {
    friends: /selectable friend_block_v2 persona([\s\S]*?)friend_small_text/g,
    steamid: /data-steamid="(\d+)"/,
    miniprofile: /data-miniprofile="(\d+)"/,
    name: /friend_block_content">(.+?)</,
    src: /src="([^"]*)"/,
  };

  try {
    const HTML = await fetch(fetchURL).then((resp) => resp.text());
    let friends = HTML.match(regex.friends).map((friendData) => {
      const id = friendData.match(regex.steamid)[1];
      const miniProfile = friendData.match(regex.miniprofile)[1];
      const userName = friendData.match(regex.name)[1];
      const img = friendData.match(regex.src)[1];

      return { id, userName, miniProfile, img };
    });
    callback(friends);
  } catch (error) {
    try {
      const HTML = await OpenAndExtractHTML(fetchURL);
      let friends = HTML.match(regex.friends).map((friendData) => {
        const id = friendData.match(regex.steamid)[1];
        const miniProfile = friendData.match(regex.miniprofile)[1];
        const userName = friendData.match(regex.name)[1];
        const img = friendData.match(regex.src)[1];

        return { id, userName, miniProfile, img };
      });
      callback(friends);
    } catch (error) {
      callback(error);
    }
  }
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
