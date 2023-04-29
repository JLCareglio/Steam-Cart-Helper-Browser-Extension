(async () => {
  const btnFriend = document.getElementById("btn_friends");
  btnFriend.disabled = true;
  const resp = await fetch(`https://steamcommunity.com/`);
  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const userInfo = JSON.parse(
    doc.querySelector("#webui_config").dataset.userinfo
  );
  2;
  const actionMenu = doc.getElementById("global_actions");
  const userName = actionMenu
    .querySelector("#account_pulldown")
    .innerText.replace(/[\n\t]/g, "");
  const userImg = actionMenu.querySelector(".user_avatar img").src;
  const steamId = userInfo.steamid;
  const miniProfile = userInfo.accountid;
  btnFriend.addEventListener("click", () =>
    window.open(`https://steamcommunity.com/profiles/${steamId}/friends?sch=1`)
  );
  btnFriend.disabled = false;
})();

// Ejemplo para obtener lista de amigos de 76561199236658330
// const resp = await fetch(
//   "https://steamcommunity.com/profiles/76561199236658330/friends/"
// );
// const html = await resp.text();
// const parser = new DOMParser();
// const doc = parser.parseFromString(html, "text/html");
// doc.querySelectorAll(".selectable.friend_block_v2.persona");
