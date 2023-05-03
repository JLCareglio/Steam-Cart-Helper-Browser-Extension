document.addEventListener("DOMContentLoaded", async () => {
  const leftCol = document.createElement("div");
  leftCol.className = "leftcol";
  leftCol.style.display = "flex";
  leftCol.style.flexWrap = "wrap";
  leftCol.style.alignItems = "center";
  document.querySelector(".leftcol").style.marginTop = "2px";
  document.querySelector(".leftcol").parentNode.prepend(leftCol);
  const cartItemList = document.querySelector(".cart_item_list");

  const users = (await chrome.storage.local.get("savedUsers")).savedUsers || [];
  const savedPurchaseIdLists = (
    await chrome.storage.local.get("savedPurchaseIdLists")
  ).savedPurchaseIdLists || [
    { listName: "Lista por Defecto", purchaseIds: [] },
  ];

  const btnAddGamesToCart = document.createElement("button");
  btnAddGamesToCart.innerHTML = "➕ cargar";
  btnAddGamesToCart.classList.add("btn_black");
  btnAddGamesToCart.style.height = "29px";
  btnAddGamesToCart.style.margin = "2px";
  btnAddGamesToCart.style.padding = "0 4px";
  btnAddGamesToCart.addEventListener("click", async () => {
    let savedPurchaseIdLists = (
      await chrome.storage.local.get("savedPurchaseIdLists")
    ).savedPurchaseIdLists || [
      { listName: "Lista por Defecto", purchaseIds: [] },
    ];

    const savedPurchaseIds = savedPurchaseIdLists[0].purchaseIds;
    console.log("savedPurchaseIds:");
    console.log(savedPurchaseIds);

    const userSelectedId = document.querySelector(
      '#options option[value="' +
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
              🎮 ${game.name}
              </p>
            </div>
          </div>`;

        cartItemList.prepend(newCartItem);
        const resp = await MyAddToCart(game);
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
  // btnAddGamesToCart.addEventListener("click", async () => {
  //   const savedPurchaseIds = JSON.parse(localStorage.getItem("savedPurchaseIds"));
  //   const promises = savedPurchaseIds.map((juego) => myAddToCart(juego));
  //   await Promise.all(promises);
  //   window.location.reload();
  // });

  const btnDelSaveGames = document.createElement("button");
  btnDelSaveGames.innerHTML = "🗑️ eliminar todas las listas ⚠️";
  btnDelSaveGames.classList.add("btn_black");
  btnDelSaveGames.style.height = "29px";
  btnDelSaveGames.style.margin = "2px";
  btnDelSaveGames.style.padding = "0 4px";
  btnDelSaveGames.addEventListener("click", () => {
    chrome.storage.local.get("savedPurchaseIdLists", (res) => {
      let savedPurchaseIdLists = res.savedPurchaseIdLists || [
        { listName: "Lista por Defecto", purchaseIds: [] },
      ];
      savedPurchaseIdLists[0].purchaseIds = [];
      chrome.storage.local.set({ savedPurchaseIdLists });
      alert(
        "Todas las listas fueron borradas\n\n🚧función en desarrollo🚧\nEn futuras versiones se podrán administrar los datos en las listas"
      );
    });
  });

  const inputFilterByUser = document.createElement("input");
  inputFilterByUser.classList.add("btn_black");
  inputFilterByUser.style.height = "29px";
  inputFilterByUser.style.width = "144px";
  inputFilterByUser.style.margin = "2px";
  inputFilterByUser.style.padding = "0 4px";
  inputFilterByUser.setAttribute("type", "search");
  inputFilterByUser.setAttribute("id", "inputFilterByUser");
  inputFilterByUser.setAttribute("list", "options");
  inputFilterByUser.placeholder = "🎁 comprar para:";
  inputFilterByUser.addEventListener("click", (e) => (e.target.value = ""));
  const datalist = document.createElement("datalist");
  datalist.setAttribute("id", "options");
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.userName;
    option.dataset.id = user.id;
    datalist.appendChild(option);
  });
  inputFilterByUser.appendChild(datalist);

  const selectLists = document.createElement("select");
  selectLists.classList.add("btn_black");
  selectLists.style.height = "29px";
  selectLists.style.margin = "2px";
  selectLists.style.padding = "0 4px";
  const option = document.createElement("option");
  option.value = "Lista por Defecto";
  option.innerText = "cargar desde:";
  selectLists.appendChild(option);
  savedPurchaseIdLists.forEach((list) => {
    const option = document.createElement("option");
    option.value = list.listName;
    option.innerText = list.listName;
    selectLists.appendChild(option);
  });

  leftCol.prepend(btnDelSaveGames);
  leftCol.prepend(btnAddGamesToCart);
  leftCol.prepend(selectLists);
  leftCol.prepend(inputFilterByUser);

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
          "X-Requested-With": "SteamCartHelper",
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
});
