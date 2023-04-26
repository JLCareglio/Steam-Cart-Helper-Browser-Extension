chrome.storage.local.get("savedUsers", (result) => {
  let users = result.savedUsers || [];
  console.log("Usuarios actualmente guardados:");
  console.log(users);
  let searchResults = document.querySelectorAll(
    ".selectable.friend_block_v2.persona"
  );

  searchResults.forEach((friend) => {
    let friendId = friend.dataset.steamid;
    let friendMiniProfile = friend.dataset.miniprofile;
    let friendImg = friend.querySelector("img").src;
    let friendName = friend
      .querySelector(".friend_block_content")
      .textContent.trim()
      .split("\n")[0];

    const btn = document.createElement("button");
    btn.style.position = "absolute";
    btn.style.right = "0";
    btn.style.zIndex = "3";
    btn.style.height = "50%";
    const btnUpdate = btn.cloneNode();
    btnUpdate.innerText = "🔄️";
    btnUpdate.style.bottom = "0";
    if (users.some((user) => user.id == friendId)) {
      btn.innerText = "➖";
    } else {
      btn.innerText = "➕";
      btnUpdate.hidden = true;
    }
    btn.addEventListener("click", () => {
      chrome.storage.local.get("savedUsers", (result) => {
        users = result.savedUsers || [];
        const index = users.findIndex((user) => user.id == friendId);

        if (index === -1) {
          users.push({
            id: friendId,
            userName: friendName,
            miniProfile: friendMiniProfile,
            img: friendImg,
          });
          btn.innerHTML = "➖";
          btnUpdate.hidden = false;
          btnUpdate.dispatchEvent(new MouseEvent("click"));
        } else {
          users.splice(index, 1);
          btn.innerHTML = "➕";
          btnUpdate.hidden = true;
        }

        chrome.storage.local.set({ savedUsers: users });
      });
    });
    btnUpdate.addEventListener("click", async () => {
      btnUpdate.innerText = "🕛";
      let i = 0;
      const intervalId = setInterval(() => {
        const emojis = [
          "🕛",
          "🕐",
          "🕑",
          "🕒",
          "🕓",
          "🕔",
          "🕕",
          "🕖",
          "🕗",
          "🕘",
          "🕙",
          "🕚",
        ];
        btnUpdate.innerText = emojis[i % emojis.length];
        i++;
      }, 50);
      await updateUserGames(friendId);
      clearInterval(intervalId);
      btnUpdate.innerText = "✅";
      setTimeout(() => {
        btnUpdate.innerText = "🔄️";
      }, 500);
    });
    friend.prepend(btnUpdate);
    friend.prepend(btn);
  });

  const updateUserGames = async (userId) => {
    const resp = await fetch(
      `https://steamcommunity.com/profiles/${userId}/games/?tab=all`
    );
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const data = JSON.parse(
      doc.querySelector("#gameslist_config").dataset.profileGameslist
    );
    const userName = data.strProfileName;
    const userID = data.strSteamId;
    const games = data.rgGames;

    chrome.storage.local.get("savedUsers", (result) => {
      let users = result.savedUsers || [];
      let index = users.findIndex((user) => user.id === userID);

      if (index === -1) {
        throw `userId "${userId}" no encontrado`
      } else {
        users[index].userName = userName;
        users[index].games = games;
      }

      chrome.storage.local.set({ savedUsers: users }, () => {
        console.log(`Juegos de ${users[index].userName} actualizados:`);
        console.log(users[index].games);
      });
    });
  };
});
 