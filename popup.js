function closeWindow(myWindow) {
  console.log("AA");
  myWindow.close();
}

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
  document.getElementById("user-name").onclick = () =>
    window.open("https://steamcommunity.com/login");
  document.getElementById("user-img").onclick = () =>
    window.open("https://steamcommunity.com/login");
  document.getElementById("user-img").style.pointerEvents = "none";

  let userInfo = (await chrome.storage.local.get("userInfo")).userInfo;
  if (userInfo) {
    btn.friends.onclick = () =>
      window.open(
        `https://steamcommunity.com/profiles/${userInfo.steamid}/friends?sch=1`
      );

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
      const loginUrl =
        "https://steamcommunity.com/login/home/?goto=login&sch=1";
      btn.connection.innerText = "en espera";
      const loginWindow = window.open(
        loginUrl,
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
        const html = await fetch(`https://steamcommunity.com/`).then((resp) =>
          resp.text()
        );
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        userInfo = JSON.parse(
          doc.querySelector("#webui_config").dataset.userinfo
        );
        console.log(userInfo);
        const actionMenu = doc.getElementById("global_actions");
        userInfo.name = actionMenu
          .querySelector("#account_pulldown")
          .innerText.replace(/[\n\t]/g, "");
        userInfo.img = actionMenu.querySelector(".user_avatar img").src;
        // const miniProfile = userInfo.accountid;
        console.log(userInfo);
        btn.friends.addEventListener("click", () =>
          window.open(
            `https://steamcommunity.com/profiles/${userInfo.steamid}/friends?sch=1`
          )
        );
        document.getElementById("user-img").src = userInfo.img;
        document.getElementById("user-img").style.pointerEvents = "auto";
        document.getElementById("user-name").innerText = userInfo.name;
        chrome.storage.local.set({ userInfo });
        btn.connection.innerText = "desconectar";
        btn.connection.classList.add("disconnect");
        btn.connection.onclick = Disconnect;
        btn.friends.disabled = false;
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
})();

// Ejemplo para obtener lista de amigos de 76561199236658330
// const resp = await fetch(
//   "https://steamcommunity.com/profiles/76561199236658330/friends/"
// );
// const html = await resp.text();
// const parser = new DOMParser();
// const doc = parser.parseFromString(html, "text/html");
// doc.querySelectorAll(".selectable.friend_block_v2.persona");
