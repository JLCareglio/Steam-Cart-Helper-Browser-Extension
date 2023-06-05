chrome.runtime.onMessage.addListener((request, sender, callback) => {
  if (!sender || !sender.tab || !("query" in request)) return false;
  switch (request.query) {
    case "FetchGames":
      FetchGames(request, callback);
      return true;
    case "FetchFriends":
      FetchFriends(request, callback);
      return true;
    case "FetchCurrentUserGames":
      FetchCurrentUserGames(request, callback);
      return true;
  }

  return false;
});

async function FetchGames(request, callback) {
  const fetchURL = isNaN(request.id)
    ? `https://steamcommunity.com/id/${request.id}/games/?tab=all`
    : `https://steamcommunity.com/profiles/${request.id}/games/?tab=all`;
  const options = request.force
    ? { cache: "reload", credentials: "include" }
    : {};

  try {
    const resp = await fetch(fetchURL, options);
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

async function FetchCurrentUserGames(request, callback) {
  const fetchURL = "https://store.steampowered.com/dynamicstore/userdata/";
  const options = request.force
    ? { cache: "reload", credentials: "include" }
    : {};

  try {
    const resp = await fetch(fetchURL, options);
    const JSON = await resp.json();
    const data = JSON.rgOwnedApps;
    if (!data.length) throw "Fallo al intentar obtener juegos";
    callback(data);
  } catch (error) {
    try {
      await OpenAndExtractJSON(fetchURL);
      const resp = await fetch(fetchURL, {
        cache: "reload",
        credentials: "include",
      });
      const JSON = await resp.json();
      const data = JSON.rgOwnedApps;
      if (!data.length) throw "El usuario no tiene juegos";
      callback(data);
    } catch (error) {
      callback(error);
    }
  }
}

async function FetchFriends(request, callback) {
  const fetchURL = isNaN(request.id)
    ? `https://steamcommunity.com/id/${request.id}/friends`
    : `https://steamcommunity.com/profiles/${request.id}/friends`;
  const options = request.force
    ? { cache: "reload", credentials: "include" }
    : {};

  const regex = {
    friends: /selectable friend_block_v2 persona([\s\S]*?)friend_small_text/g,
    steamid: /data-steamid="(\d+)"/,
    miniprofile: /data-miniprofile="(\d+)"/,
    name: /friend_block_content">(.+?)</,
    src: /src="([^"]*)"/,
  };

  try {
    const HTML = await fetch(fetchURL, options).then((resp) => resp.text());
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
      callback([]);
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

function OpenAndExtractJSON(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: url, active: false }, (tab) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: () => {
            const html = document.documentElement.innerText;
            const json = JSON.parse(html);
            return json;
          },
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
