(async () => {
  const leftCol = document.querySelector(".leftcol");
  const cartItemList = document.querySelector(".cart_item_list");
  const urlFriends = document.querySelector(
    '.submenu_username a[href*="/friends"]'
  ).href;
  // const resp = await fetch(urlFriends);
  // console.log(resp);
  const users = (await chrome.storage.local.get("savedUsers")).savedUsers || [];
  console.log("Usuarios actualmente guardados:");
  console.log(users);
  const savedPurchaseIds =
    (await chrome.storage.local.get("savedPurchaseIds")).savedPurchaseIds || [];
  console.log("Compras actualmente guardadas:");
  console.log(savedPurchaseIds);

  async function getData() {
    const users =
      (await chrome.storage.local.get("savedUsers")).savedUsers || [];
    console.log("Usuarios actualmente guardados:");
    console.log(users);
    const savedPurchaseIds =
      (await chrome.storage.local.get("savedPurchaseIds")).savedPurchaseIds ||
      [];
    console.log("Compras actualmente guardadas:");
    console.log(savedPurchaseIds);
  }

  const btnAddGamesToCart = document.createElement("button");
  btnAddGamesToCart.innerHTML = "📋 Agregar juegos en lista";
  btnAddGamesToCart.classList.add("btn_black");
  btnAddGamesToCart.style.height = "29px";
  btnAddGamesToCart.style.padding = "0 4px";
  btnAddGamesToCart.addEventListener("click", async () => {
    chrome.storage.local.get("savedPurchaseIds", async (result) => {
      const savedPurchaseIds = result.savedPurchaseIds || [];
      console.log("Compras actualmente guardadas:");
      console.log(savedPurchaseIds);

      const user = users.find((user) => user.id == inputFilterByUser.value);
      const savedPurchaseIdsFilter = savedPurchaseIds.filter(
        (game) =>
          !user?.games?.some((userGame) => userGame.appid == parseInt(game.id))
      );

      let newCartItem = document.createElement("div");
      let i = 1;

      for (const game of savedPurchaseIdsFilter) {
        newCartItem.innerHTML = `
          <div class="cart_row even app_impression_tracked">
            <div class="cart_item" style="text-align: center; display: flex; flex-direction: column; justify-content: space-evenly; font-size: 22px;">
              <p>
                👀 cargando ${i} de ${savedPurchaseIdsFilter.length}
              </p>
              <p>
              🎮 ${game.name} <=> 🔑 ${game.subId}
              </p>
            </div>
          </div>`;

        cartItemList.prepend(newCartItem);
        const resp = await myAddToCart(game.subId);
        console.log(resp);
        i++;
      }
      newCartItem.innerHTML = `
        <div class="cart_row even app_impression_tracked">
          <p class="cart_item" style="display: flex; justify-content: center; align-items: center; font-size: 22px;">
            ✅ recargando pagina...
          </p>
        </div>`;
      cartItemList.prepend(newCartItem);

      console.log("Juegos cargados, recargando pagina...");
      // window.location.reload();
    });
  });
  // btnAddGamesToCart.addEventListener("click", async () => {
  //   const savedPurchaseIds = JSON.parse(localStorage.getItem("savedPurchaseIds"));
  //   const promises = savedPurchaseIds.map((juego) => myAddToCart(juego));
  //   await Promise.all(promises);
  //   window.location.reload();
  // });

  const btnDelSaveGames = document.createElement("button");
  btnDelSaveGames.innerHTML = "🗑️ Eliminar lista";
  btnDelSaveGames.classList.add("btn_black");
  btnDelSaveGames.style.height = "29px";
  btnDelSaveGames.style.margin = "0 2px 0 0";
  btnDelSaveGames.style.padding = "0 4px";
  btnDelSaveGames.addEventListener("click", () => {
    chrome.storage.local.remove("savedPurchaseIds");
  });

  const inputFilterByUser = document.createElement("input");
  inputFilterByUser.classList.add("btn_black");
  inputFilterByUser.style.height = "26px";
  inputFilterByUser.style.margin = "0 0 0 2px";
  inputFilterByUser.style.padding = "0 4px";
  inputFilterByUser.setAttribute("type", "search");
  inputFilterByUser.setAttribute("id", "inputFilterByUser");
  inputFilterByUser.setAttribute("list", "opciones");
  inputFilterByUser.placeholder = "🎁 Regalar a:";
  const datalist = document.createElement("datalist");
  datalist.setAttribute("id", "opciones");
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.userName;
    option.dataset.id = user.id;
    datalist.appendChild(option);
  });
  inputFilterByUser.appendChild(datalist);

  leftCol.prepend(inputFilterByUser);
  leftCol.prepend(btnAddGamesToCart);
  leftCol.prepend(btnDelSaveGames);

  const myAddToCart = (subid) => {
    return new Promise((resolve, reject) => {
      const g_sessionID = document.querySelector("[name='sessionid']").value;
      const form = document.createElement("form");
      form.setAttribute("name", `add_to_cart_${subid}`);
      form.setAttribute("action", "https://store.steampowered.com/cart/");
      form.setAttribute("method", "POST");
      form.style.display = "none";

      const actionInput = document.createElement("input");
      actionInput.setAttribute("type", "hidden");
      actionInput.setAttribute("name", "action");
      actionInput.setAttribute("value", "add_to_cart");

      const subidInput = document.createElement("input");
      subidInput.setAttribute("type", "hidden");
      subidInput.setAttribute("name", "subid");
      subidInput.setAttribute("value", subid);

      const sessionidInput = document.createElement("input");
      sessionidInput.setAttribute("type", "hidden");
      sessionidInput.setAttribute("name", "sessionid");
      sessionidInput.setAttribute("value", g_sessionID);

      form.appendChild(actionInput);
      form.appendChild(subidInput);
      form.appendChild(sessionidInput);

      window.document.body.appendChild(form);
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
      })
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };
})();
