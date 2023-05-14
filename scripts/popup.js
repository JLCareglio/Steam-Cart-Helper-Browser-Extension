const baseUrl = "https://steamcommunity.com/";
const loginUrl = baseUrl + "login/";
const parser = new DOMParser();

(async () => {
  const btn = {
    cart: document.getElementById("btn-cart"),
    connection: document.getElementById("btn-connection"),
    friends: document.getElementById("btn-friends"),
    lists: document.getElementById("btn-lists"),
    help: document.getElementById("btn-help"),
    import: document.getElementById("btn-import"),
    export: document.getElementById("btn-export"),
    settings: document.getElementById("btn-settings"),
  };

  Object.values(btn).forEach((btn) => {
    if (btn.classList.contains("btn-error"))
      btn.onclick = () =>
        alert(
          "🚧funcionalidad en desarrollo🚧\nEstará disponible en futuras versiones"
        );
  });

  btn.cart.onclick = () => window.open("https://store.steampowered.com/cart");
  document.getElementById("user-name").onclick = () => window.open(loginUrl);
  document.getElementById("user-img").onclick = () => window.open(loginUrl);
  document.getElementById("user-img").style.pointerEvents = "none";

  let userInfo = (await chrome.storage.local.get("userInfo")).userInfo;
  if (userInfo) {
    btn.friends.onclick = UpdateFriends;
    document.getElementById("user-img").src = userInfo.img;
    document.getElementById("user-img").style.pointerEvents = "auto";
    document.getElementById("user-name").innerText = userInfo.name;
    btn.connection.innerText = "desconectar";
    btn.connection.classList.add("disconnect");
    btn.connection.style.pointerEvents = "auto";
    btn.connection.onclick = Disconnect;
    btn.friends.disabled = false;
  } else {
    btn.connection.onclick = Connect;
  }

  async function Connect() {
    btn.connection.style.pointerEvents = "none";
    document.getElementById("user-img").style.pointerEvents = "none";
    btn.connection.classList.remove("btn-error");
    btn.connection.innerText = "conectando...";
    if (!(await tryConnect())) {
      btn.connection.innerText = "en espera";
      const loginWindow = window.open(
        `${loginUrl}home/?goto=login&sch=1`,
        "conectando...",
        "width=500, height=400"
      );
      loginWindow.moveTo(
        screenLeft / 2,
        screenTop + btn.connection.offsetTop + btn.connection.offsetHeight
      );
      window.onmessage = (event) => {
        // if (event.origin != "https://steamcommunity.com") return;
        if ((event.data = "login completed")) loginWindow.close();
      };

      const waitForLoginWindowClose = new Promise((resolve) => {
        const interval = setInterval(() => {
          if (loginWindow.closed) {
            clearInterval(interval);
            resolve();
          }
        }, 500);
      });

      await waitForLoginWindowClose;
      btn.connection.innerText = "conectando...";
      if (!(await tryConnect())) {
        btn.connection.innerText = "sesión no iniciada";
        btn.connection.classList.add("btn-error");
      }
    }

    btn.connection.style.pointerEvents = "auto";

    async function tryConnect() {
      try {
        let html = await fetch(baseUrl).then((resp) => resp.text());
        let doc = parser.parseFromString(html, "text/html");
        userInfo = JSON.parse(
          doc.querySelector("#webui_config").dataset.userinfo
        );
        const actionMenu = doc.getElementById("global_actions");
        userInfo.name = actionMenu
          .querySelector("#account_pulldown")
          .innerText.replace(/[\n\t]/g, "");
        userInfo.img = actionMenu.querySelector(".user_avatar img").src;
        // const miniProfile = userInfo.accountid;

        console.log("userInfo", userInfo);
        document.getElementById("user-img").src = userInfo.img;
        document.getElementById("user-name").innerText = userInfo.name;
        chrome.storage.local.set({ userInfo });
        btn.connection.innerText = "sincronizando...";
        btn.connection.classList.add("disconnect");

        await UpdateFriends();

        document.getElementById("user-img").style.pointerEvents = "auto";
        btn.connection.innerText = "desconectar";
        btn.connection.onclick = Disconnect;
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    }
  }
  async function Disconnect() {
    chrome.storage.local.remove("userInfo");
    btn.connection.innerText = "conectar";
    btn.connection.classList.remove("disconnect");
    document.getElementById("user-img").src = "images/no-avatar.jpg";
    document.getElementById("user-img").style.pointerEvents = "none";
    document.getElementById("user-name").innerText = "";
    btn.connection.onclick = Connect;
    btn.friends.disabled = true;
  }
  async function UpdateFriends() {
    btn.friends.disabled = true;
    btn.friends.innerHTML = `
      <span style="font-size: 22px">⌛</span>
      <span>actualizando</span>`;

    html = await fetch(`${baseUrl}profiles/${userInfo.steamid}/friends`).then(
      (resp) => resp.text()
    );
    doc = parser.parseFromString(html, "text/html");
    try {
      const friendsHtml = doc.querySelectorAll(
        ".selectable.friend_block_v2.persona"
      );
      userInfo.friends = [];

      for (let friend of friendsHtml) {
        let friendId = friend.dataset.steamid;
        let friendMiniProfile = friend.dataset.miniprofile;
        let friendImg = friend.querySelector("img").src;
        let friendName = friend
          .querySelector(".friend_block_content")
          .textContent.trim()
          .split("\n")[0];

        userInfo.friends.push({
          id: friendId,
          userName: friendName,
          miniProfile: friendMiniProfile,
          img: friendImg,
        });
      }
      chrome.storage.local.set({ userInfo });
    } catch (error) {
      console.error(error);
    }
    btn.friends.disabled = false;
    btn.friends.innerHTML = `
    <span style="font-size: 22px">🎁</span>
    <span>amigos</span>`;
  }
})();

// Ejemplo para obtener lista de amigos de 76561199236658330
// const resp = await fetch(
//   "https://steamcommunity.com/profiles/76561199236658330/friends/"
// );
// const html = await resp.text();
// const parser = new DOMParser();
// const doc = parser.parseFromString(html, "text/html");
// doc.querySelectorAll(".selectable.friend_block_v2.persona");
