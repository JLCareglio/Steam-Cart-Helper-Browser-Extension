const leftCol = document.createElement("div");
leftCol.className = "leftcol";
leftCol.style.display = "flex";
leftCol.style.flexWrap = "wrap";
leftCol.style.alignItems = "center";
document.querySelector(".leftcol").style.marginTop = "2px";
document.querySelector(".leftcol").parentNode.prepend(leftCol);
const cartItemList = document.querySelector(".cart_item_list");

chrome.storage.local.get(["userInfo", "savedPurchaseIdLists"], async (resp) => {
  let userInfo = resp.userInfo;
  let savedPurchaseIdLists = resp.savedPurchaseIdLists || [
    { listName: "Lista por Defecto", purchaseIds: [] },
  ];

  const btnAddGamesToCart = document.createElement("button");
  btnAddGamesToCart.innerHTML = "➕ cargar";
  btnAddGamesToCart.classList.add("btn_black");
  btnAddGamesToCart.style.height = "29px";
  btnAddGamesToCart.style.margin = "2px";
  btnAddGamesToCart.style.padding = "0 4px";
  btnAddGamesToCart.addEventListener("click", async () => {
    btnAddGamesToCart.style.pointerEvents = "none";
    btnAddGamesToCart.innerText = "🕛 cargando...";
    let i = 0;
    const intervalLoading = setInterval(() => {
      const loading = [
        "🕛 cargando...",
        "🕐 cargando...",
        "🕑 cargando...",
        "🕒 cargando...",
        "🕓 cargando...",
        "🕔 cargando...",
        "🕕 cargando...",
        "🕖 cargando...",
        "🕗 cargando...",
        "🕘 cargando...",
        "🕙 cargando...",
        "🕚 cargando...",
      ];
      btnAddGamesToCart.innerText = loading[i % loading.length];
      i++;
    }, 50);

    let savedPurchaseIdLists = (
      await chrome.storage.local.get("savedPurchaseIdLists")
    ).savedPurchaseIdLists || [
      { listName: "Lista por Defecto", purchaseIds: [] },
    ];

    const savedPurchaseIds = savedPurchaseIdLists[0].purchaseIds;
    console.log(savedPurchaseIds);

    let userSelectedGames;
    let userSelectedId = document.querySelector(
      '#options option[value="' +
        document.querySelector("#inputFilterByUser").value +
        '"]'
    )?.dataset.id;
    if (userSelectedId) {
      const promiseFetchGames = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { query: "FetchGames", id: userSelectedId },
          resolve
        );
      });
      userSelectedGames = promiseFetchGames;
    }

    const cartItems = Array.from(cartItemList.querySelectorAll(".cart_row"));
    // const user = users.find((user) => user.id == userSelectedId);
    const savedPurchaseIdsFilter = savedPurchaseIds.filter((game) => {
      return (
        !cartItems.some(
          (cartItem) => cartItem.dataset.dsAppid == game.gameId
        ) &&
        !userSelectedGames?.some((userGame) => userGame.appid == game.gameId)
      );
    });
    console.log("juegos ya filtrados:");
    console.log(savedPurchaseIdsFilter);

    let newCartItem = document.createElement("div");
    let j = 1;

    if (savedPurchaseIdsFilter.length) {
      for (const game of savedPurchaseIdsFilter) {
        newCartItem.innerHTML = `
              <div class="cart_row even app_impression_tracked">
                <div class="cart_item" style="text-align: center; display: flex; flex-direction: column; justify-content: space-evenly; font-size: 22px;">
                  <p>
                    👀 cargando ${j} de ${savedPurchaseIdsFilter.length}
                  </p>
                  <p>
                  🎮 ${game.name}
                  </p>
                </div>
              </div>`;

        cartItemList.prepend(newCartItem);
        const resp = await MyAddToCart(game);
        console.log(resp);
        j++;
      }
      newCartItem.innerHTML = `
            <div class="cart_row even app_impression_tracked">
              <p class="cart_item" style="display: flex; justify-content: center; align-items: center; font-size: 22px;">
                ✅ recargando pagina...
              </p>
            </div>`;
      cartItemList.prepend(newCartItem);
      clearInterval(intervalLoading);
      btnAddGamesToCart.innerText = "✅ listo";
      window.location.reload();
    } else {
      clearInterval(intervalLoading);
      btnAddGamesToCart.innerText = "✅ sin cambios";
      setTimeout(() => {
        btnAddGamesToCart.innerText = "➕ cargar";
        btnAddGamesToCart.style.pointerEvents = "auto";
      }, 700);
    }
  });
  // btnAddGamesToCart.addEventListener("click", async () => {
  //   const savedPurchaseIds = JSON.parse(localStorage.getItem("savedPurchaseIds"));
  //   const promises = savedPurchaseIds.map((juego) => myAddToCart(juego));
  //   await Promise.all(promises);
  //   window.location.reload();
  // });

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
  if (userInfo) {
    const option = document.createElement("option");
    option.value = `mí (${userInfo.name})`;
    option.dataset.id = userInfo.steamid;
    datalist.appendChild(option);
    userInfo.friends.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.userName;
      option.dataset.id = user.id;
      datalist.appendChild(option);
    });
  } else inputFilterByUser.disabled = true;
  inputFilterByUser.appendChild(datalist);

  // const selectLists = document.createElement("select");
  // selectLists.classList.add("btn_black");
  // selectLists.style.height = "29px";
  // selectLists.style.margin = "2px";
  // selectLists.style.padding = "0 4px";
  // const option = document.createElement("option");
  // option.value = "0";
  // option.innerText = "cargar desde:";
  // selectLists.appendChild(option);
  // savedPurchaseIdLists.forEach((list, index) => {
  //   const option = document.createElement("option");
  //   option.value = index;
  //   option.innerText = list.listName;
  //   selectLists.appendChild(option);
  // });

  leftCol.prepend(btnAddGamesToCart);
  // leftCol.prepend(selectLists);
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
