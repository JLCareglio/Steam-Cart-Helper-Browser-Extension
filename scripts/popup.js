const baseUrl = "https://steamcommunity.com/";
const loginUrl = baseUrl + "login/";
const parser = new DOMParser();

(async () => {
  const btn = {
    cart: document.getElementById("btn-cart"),
    connection: document.getElementById("btn-connection"),
    friends: document.getElementById("btn-friends"),
    saved: document.getElementById("btn-saved"),
    lists: document.getElementById("btn-lists"),
    help: document.getElementById("btn-help"),
    import: document.getElementById("btn-import"),
    export: document.getElementById("btn-export"),
    settings: document.getElementById("btn-settings"),
  };

  Object.values(btn).forEach((btn) => {
    if (btn) {
      btn.style.width = btn.offsetWidth + "px";
      if (btn.classList.contains("btn-error"))
        btn.onclick = () =>
          alert(
            "🚧funcionalidad en desarrollo🚧\nEstará disponible en futuras versiones"
          );
    }
  });

  btn.cart.onclick = () => window.open("https://store.steampowered.com/cart");
  btn.saved.onclick = () => (window.location.href = "saved.html");
  // btn.lists.onclick = () => window.location.href = "lists.html"
  btn.import.onclick = ImportData;
  btn.export.onclick = ExportData;

  document.getElementById("user-name").onclick = () => window.open(loginUrl);
  document.getElementById("user-img").onclick = () => window.open(loginUrl);
  document.getElementById("user-img").style.pointerEvents = "none";

  let userInfo = (await chrome.storage.local.get("userInfo")).userInfo;
  if (userInfo) {
    // btn.friends.onclick = UpdateFriends;
    document.getElementById("user-img").src = userInfo.img;
    document.getElementById("user-img").style.pointerEvents = "auto";
    document.getElementById("user-name").innerText = userInfo.name;
    btn.connection.innerText = "desconectar";
    btn.connection.classList.add("disconnect");
    btn.connection.style.pointerEvents = "auto";
    btn.connection.onclick = Disconnect;
    // btn.friends.disabled = false;
  } else {
    btn.connection.onclick = Connect;
  }

  async function Connect() {
    btn.connection.style.width = null;
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
    // btn.friends.disabled = true;
  }
  async function UpdateFriends() {
    // btn.friends.disabled = true;
    // btn.friends.style.width = btn.friends.offsetWidth + "px";
    // btn.friends.innerHTML = `
    //   <span style="font-size: 11px">⌛</span>
    //   <span>actua-</span>
    //   <span>lizando</span>`;

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
    // btn.friends.innerHTML = `
    // <span style="font-size: 22px">✅</span>
    // <span>listo</span>`;
    // setTimeout(() => {
    //   btn.friends.innerHTML = `
    //   <span style="font-size: 22px">🎁</span>
    //   <span>amigos</span>`;
    //   btn.friends.disabled = false;
    // }, 700);
  }

  function ImportData() {
    const input = document.createElement("input");
    input.type = "file";

    input.addEventListener("change", (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        try {
          const savedPurchaseIdLists = JSON.parse(content).savedPurchaseIdLists;
          chrome.storage.local.set({ savedPurchaseIdLists });
          btn.import.innerHTML = `
            <span style="font-size: 22px">✅</span>
            <span>listo</span>`;
        } catch (error) {
          console.error(error);
          btn.import.innerHTML = `
            <span style="font-size: 22px">❌</span>
            <span>error</span>`;
        }
        setTimeout(() => {
          btn.import.innerHTML = `
            <span style="font-size: 22px">⬆️</span>
            <span>importar</span>`;
        }, 700);
      };
      reader.readAsText(file);
    });
    input.click();
  }
  function ExportData() {
    chrome.storage.local.get("savedPurchaseIdLists", (resp) => {
      let savedPurchaseIdLists = resp.savedPurchaseIdLists;
      const currentDate = new Date();
      const dateString = currentDate
        .toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
        .replaceAll("/", "-");
      const timeString = currentDate
        .toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replaceAll(":", ".");
      const fileName = `SCH juegos guardados [${dateString} ${timeString}].json`;
      const jsonData = JSON.stringify({ savedPurchaseIdLists });
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      btn.export.innerHTML = `
        <span style="font-size: 22px">✅</span>
        <span>listo</span>`;
      setTimeout(() => {
        btn.export.innerHTML = `
          <span style="font-size: 22px">⬇️</span>
          <span>exportar</span>`;
      }, 700);
    });
  }
})();
