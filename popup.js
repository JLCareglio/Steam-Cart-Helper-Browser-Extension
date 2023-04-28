(async () => {
  const btnFriend = document.getElementById("btn_friends");
  btnFriend.disabled = true;
  const resp = await fetch(`https://steamcommunity.com/`);
  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const steamId = JSON.parse(
    doc.querySelector("#webui_config").dataset.userinfo
  ).steamid;
  btnFriend.href = `https://steamcommunity.com/profiles/${steamId}/friends?sch=1`;
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
