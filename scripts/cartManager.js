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

  const btnAddGamesToCart = document.createElement("button");
  btnAddGamesToCart.innerHTML = "📋 Agregar juegos en lista";
  btnAddGamesToCart.classList.add("btn_black");
  btnAddGamesToCart.style.height = "29px";
  btnAddGamesToCart.style.padding = "0 4px";
  btnAddGamesToCart.addEventListener("click", async () => {
    chrome.storage.local.get("savedPurchaseIds", async (result) => {
      const savedPurchaseIds = result.savedPurchaseIds || [];

      const userSelectedId = document.querySelector(
        '#opciones option[value="' +
          document.querySelector("#inputFilterByUser").value +
          '"]'
      )?.dataset.id;
      const cartItems = Array.from(cartItemList.querySelectorAll(".cart_row"));
      const user = users.find((user) => user.id == userSelectedId);
      const savedPurchaseIdsFilter = savedPurchaseIds.filter((game) => {
        return (
          !cartItems.some(
            (cartItem) => cartItem.dataset.dsAppid == game.gameId
          ) && !user?.games?.some((userGame) => userGame.appid == game.gameId)
        );
      });
      console.log("juegos ya filtrados:");
      console.log(savedPurchaseIdsFilter);

      let newCartItem = document.createElement("div");
      let i = 1;

      if (savedPurchaseIdsFilter.length) {
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
          const resp = await MyAddToCart({ subid: game.purchaseId });
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
        window.location.reload();
      }
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

  const MyAddToCart = (request) => {
    const g_sessionID = document.querySelector("[name='sessionid']").value;
    const formData = new FormData();
    formData.set("action", "add_to_cart");

    if (request.subid) {
      formData.set("subid", parseInt(request.subid, 10));
    } else if (request.bundleid) {
      formData.set("bundleid", parseInt(request.bundleid, 10));
    } else {
      return Promise.reject(
        new Error("Error: no se ha especificado ni subid ni bundleid")
      );
    }

    formData.set("sessionid", g_sessionID);

    return new Promise((resolve, reject) => {
      fetch(`https://store.steampowered.com/cart/addtocart`, {
        credentials: "include",
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "SteamDB",
        },
      })
        .then((response) => {
          if (response.status === 401) {
            storeSessionId = null;
          }
          return response.json();
        })
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };
})();
