document.documentElement.style.display = "none";
document.addEventListener("DOMContentLoaded", async () => {
  const node = document.getElementById("friends_list");
  const tileBar = node.querySelector(".profile_friends.title_bar");
  const searchBarContainer = node.querySelector(".searchBarContainer");

  document.body.insertBefore(node, document.body.firstChild);
  searchBarContainer.style.justifyContent = "center";
  // searchBarContainer.querySelector("input").style.width = "100%";
  tileBar.style.justifyContent = "center";
  tileBar.style.backgroundColor = "transparent";
  node.querySelector(".profile_friends.search_results").style.justifyContent =
    "center";
  node
    .querySelectorAll(".state_block")
    .forEach((sb) => (sb.style.textAlign = "center"));
  node.querySelector("#manage_friends").remove();
  tileBar.querySelector(".profile_friends.title").remove();
  tileBar.querySelector("#manage_friends_control").remove();
  tileBar.querySelector("#add_friends_button").remove();
  node.insertBefore(searchBarContainer, tileBar);

  const btnAddAll = document.createElement("button");
  btnAddAll.id = "btn_add_all";
  btnAddAll.innerHTML = "<span>💾 guardar todos</span>";
  btnAddAll.classList.add("btn_black", "btn_medium");
  btnAddAll.style.margin = "0px 4px 4px 4px";
  const btnRemoveAll = btnAddAll.cloneNode();
  btnRemoveAll.innerHTML = "<span>🗑️ quitar todos</span>";
  btnRemoveAll.id = "btn_remove_all";
  const btnUpdateGames = btnAddAll.cloneNode();
  btnUpdateGames.innerHTML = "<span>🔄️ actualizar datos guardados</span>";
  btnUpdateGames.id = "btn_update_games";
  tileBar.appendChild(btnAddAll);
  tileBar.appendChild(btnRemoveAll);
  tileBar.appendChild(btnUpdateGames);

  while (document.body.lastChild !== node)
    document.body.removeChild(document.body.lastChild);

  document.documentElement.style.display = "block";

  chrome.storage.local.get(["savedUsers", "userInfo"], (r) => {
    let userInfo = r.userInfo;
    let users = r.savedUsers || [];
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

      friend.querySelector("a").remove();

      const btn = document.createElement("button");
      btn.classList.add("btn_black", "btn_small");
      btn.style.position = "absolute";
      btn.style.right = "0";
      btn.style.zIndex = "3";
      btn.style.height = "50%";
      btn.style.cursor = "pointer";

      const btnUpdate = btn.cloneNode();
      btnUpdate.innerText = "🔄️";
      btnUpdate.style.bottom = "0";
      if (users.some((user) => user.id == friendId)) {
        btn.innerText = "🗑️";
      } else {
        btn.innerText = "💾";
        btnUpdate.classList.remove("btn_black", "btn_small");
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
            btn.innerHTML = "🗑️";
            btnUpdate.classList.add("btn_black", "btn_small");
            btnUpdate.hidden = false;
            btnUpdate.dispatchEvent(new MouseEvent("click"));
          } else {
            users.splice(index, 1);
            btn.innerHTML = "💾";
            btnUpdate.classList.remove("btn_black", "btn_small");
            btnUpdate.hidden = true;
          }

          chrome.storage.local.set({ savedUsers: users });
        });
      });
      btnUpdate.addEventListener("click", async () => {
        btnUpdate.style.pointerEvents = "none";
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
          btnUpdate.style.pointerEvents = "auto";
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
          throw `userId "${userId}" no encontrado`;
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
});
