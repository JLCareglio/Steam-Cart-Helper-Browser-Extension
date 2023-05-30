const leftCol = document.createElement("div");
leftCol.className = "leftcol";
leftCol.style.display = "flex";
leftCol.style.flexWrap = "wrap";
leftCol.style.alignItems = "center";
document.querySelector(".leftcol").style.marginTop = "2px";
document.querySelector(".leftcol").parentNode.prepend(leftCol);
const cartItemList = document.querySelector(".cart_item_list");

let currentUserName = document
  .querySelector("#account_pulldown")
  ?.innerText.trim();
let currentUserId =
  document
    .querySelector("#global_actions .user_avatar")
    ?.href.match(/(\d+)/g)
    ?.shift() ??
  document
    .querySelector("#global_actions .user_avatar")
    ?.href.match(/\/id\/([^/]+)/)
    ?.at(-1);

_get(["userInfo", "savedPurchaseIdLists"], async (resp) => {
  let userInfo = resp.userInfo;
  // let savedPurchaseIdLists = resp.savedPurchaseIdLists || [
  //   { listName: _txt("default_list_name"), purchaseIds: [] },
  // ];
  const btnAddGamesToCart = document.createElement("button");
  const inputFilterByUser = document.createElement("input");
  const inputFilterByUser_datalist = document.createElement("datalist");
  // const selectLists = document.createElement("select");
  let loadingText = _txt("loading") + "...";

  btnAddGamesToCart.innerText = _txt("load");
  btnAddGamesToCart.classList.add("btn_black");
  btnAddGamesToCart.style.height = "29px";
  btnAddGamesToCart.style.margin = "2px";
  btnAddGamesToCart.style.padding = "0 4px";
  btnAddGamesToCart.addEventListener("click", async () => {
    btnAddGamesToCart.style.pointerEvents = "none";
    btnAddGamesToCart.innerText = "🕛 " + loadingText;
    let i = 0;
    const intervalLoading = setInterval(() => {
      const loading = [
        "🕛 " + loadingText,
        "🕐 " + loadingText,
        "🕑 " + loadingText,
        "🕒 " + loadingText,
        "🕓 " + loadingText,
        "🕔 " + loadingText,
        "🕕 " + loadingText,
        "🕖 " + loadingText,
        "🕗 " + loadingText,
        "🕘 " + loadingText,
        "🕙 " + loadingText,
        "🕚 " + loadingText,
      ];
      btnAddGamesToCart.innerText = loading[i % loading.length];
      i++;
    }, 50);

    let savedPurchaseIdLists = (await _get("savedPurchaseIdLists"))
      .savedPurchaseIdLists || [
      { listName: _txt("default_list_name"), purchaseIds: [] },
    ];

    let filteredSavedPurchaseIds = savedPurchaseIdLists[0].purchaseIds;
    let userSelectedGames;
    let userSelectedId = document.querySelector(
      '#users_datalist option[value="' + inputFilterByUser.value + '"]'
    )?.dataset.id;

    const cartItems = Array.from(
      cartItemList.querySelectorAll(".cart_row")
    ).map((item) => ({
      ...item.dataset,
      dsBundleData: JSON.parse(item.dataset.dsBundleData ?? null),
    }));

    console.log("cartItems", cartItems);
    console.log("juegos sin filtrar:");
    console.log(filteredSavedPurchaseIds);

    if (cartItems.length) {
      filteredSavedPurchaseIds = filteredSavedPurchaseIds.filter((purchase) => {
        const purchaseId = purchase.gameId ?? purchase.bundleid;
        const savedGamesIds = purchase.dsBundleData?.m_rgItems.flatMap(
          (ids) => ids.m_rgIncludedAppIDs
        ) ?? [purchase.gameId];
        return !cartItems.some((item) => {
          const itemId = item.dsAppid ?? item.dsBundleid;
          const itemGamesIds = item.dsBundleData?.m_rgItems.flatMap(
            (ids) => ids.m_rgIncludedAppIDs
          ) ?? [item.dsAppid];
          return (
            itemId == purchaseId ||
            savedGamesIds.every((sId) => itemGamesIds.includes(sId))
          );
        });
      });
      console.log("elementos en carro, juegos luego de filtro:");
      console.log(filteredSavedPurchaseIds);
    }

    if (filteredSavedPurchaseIds.length) {
      if (userSelectedId && userSelectedId !== currentUserId) {
        loadingText = _txt("removing_non_giftables");

        filteredSavedPurchaseIds = filteredSavedPurchaseIds.filter(
          (purchase) =>
            !purchase.dsBundleData || !purchase.dsBundleData.m_bRestrictGifting
        );
        console.log("noSelf, juegos luego de quitar los 'no-regalo':");
        console.log(filteredSavedPurchaseIds);

        // loadingText = "cargando (obteniendo 🎮👉🤓)...";
        loadingText = _txt("comparing_games");
        userSelectedGames = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { query: "FetchGames", id: userSelectedId },
            resolve
          );
        });
        console.log("userSelectedGames:", userSelectedGames);

        // loadingText = "cargando (quitando 🎁 que ya tiene 👉🤓)...";
        loadingText = _txt("removing_already_acquired");
        filteredSavedPurchaseIds = filteredSavedPurchaseIds.filter(
          (purchase) => {
            const gameIds = purchase.dsBundleData?.m_rgItems.flatMap(
              (ids) => ids.m_rgIncludedAppIDs
            ) ?? [purchase.gameId];
            return !userSelectedGames.some((userGame) =>
              gameIds.includes(userGame.appid)
            );
          }
        );
        console.log("-userSelectedGames únicos, juegos luego de filtro:");
        console.log(filteredSavedPurchaseIds);
      } else if (!userSelectedId || userSelectedId == currentUserId) {
        // loadingText = "cargando (obteniendo 🫵🎮)...";
        loadingText = _txt("comparing_games");
        userSelectedGames = await fetch(
          "https://store.steampowered.com/dynamicstore/userdata/"
        )
          .then((res) => res.json())
          .then((data) => data.rgOwnedApps);

        console.log("userSelectedGames:", userSelectedGames);

        // loadingText = "cargando (quitando 🎁 que ya tienes)...";
        loadingText = _txt("removing_already_acquired");
        filteredSavedPurchaseIds = filteredSavedPurchaseIds.filter(
          (purchase) => {
            const gameIds = purchase.dsBundleData?.m_rgItems.flatMap(
              (ids) => ids.m_rgIncludedAppIDs
            ) ?? [purchase.gameId];
            return !gameIds.every((id) => userSelectedGames.includes(id));
          }
        );
        console.log("-userSelectedGames totales, juegos luego de filtro:");
        console.log(filteredSavedPurchaseIds);
      }
    }

    loadingText = _txt("removing_subsets");
    filteredSavedPurchaseIds = filteredSavedPurchaseIds.filter((purchase1) => {
      const gameIds1 = purchase1.dsBundleData?.m_rgItems.flatMap(
        (ids) => ids.m_rgIncludedAppIDs
      ) ?? [purchase1.gameId];
      // console.log("gameIds1:", purchase1.name, gameIds1);
      return !filteredSavedPurchaseIds.some((purchase2) => {
        const gameIds2 = purchase2.dsBundleData?.m_rgItems.flatMap(
          (ids) => ids.m_rgIncludedAppIDs
        ) ?? [purchase2.gameId];
        // console.log("gameIds2:", purchase2.name, gameIds2);
        const sonDiferentes = purchase1 !== purchase2;
        // console.log("sonDiferentes:", sonDiferentes);
        if (sonDiferentes) {
          const eval = gameIds1.every((id) => gameIds2.includes(id));
          // console.log("gameIds2 tiene todos los gameIds1:", eval);
        }
        // console.log("------------------");
        return (
          purchase1 !== purchase2 &&
          gameIds1.every((id) => gameIds2.includes(id))
        );
      });
    });
    console.log("juegos luego de quitar subconjuntos:");
    console.log(filteredSavedPurchaseIds);

    loadingText = _txt("adding_to_cart");
    let newCartItem = document.createElement("div");
    let j = 1;
    const cantGames = filteredSavedPurchaseIds.length;
    if (cantGames) {
      for (const game of filteredSavedPurchaseIds) {
        newCartItem.innerHTML = `
              <div class="cart_row even app_impression_tracked">
                <div class="cart_item" style="text-align: center; display: flex; flex-direction: column; justify-content: space-evenly; font-size: 22px;">
                  <p>
                    👀 ${_txt("loading")} ${j + "/" + cantGames}
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
                ${_txt("reloading_web_page")}
              </p>
            </div>`;
      cartItemList.prepend(newCartItem);
      clearInterval(intervalLoading);
      btnAddGamesToCart.innerText = _txt("done");
      window.location.reload();
      // console.log("reload window");
    } else {
      clearInterval(intervalLoading);
      btnAddGamesToCart.innerText = _txt("without_changes");
      setTimeout(() => {
        btnAddGamesToCart.innerText = _txt("load");
        btnAddGamesToCart.style.pointerEvents = "auto";
      }, 700);
    }
  });

  inputFilterByUser_datalist.id = "users_datalist";
  inputFilterByUser.type = "search";
  inputFilterByUser.setAttribute("list", "users_datalist");
  inputFilterByUser.appendChild(inputFilterByUser_datalist);
  inputFilterByUser.placeholder = "🎁 " + _txt("buy_for_me");
  inputFilterByUser.classList.add("btn_black");
  inputFilterByUser.style.height = "29px";
  // inputFilterByUser.style.width = "144px";
  inputFilterByUser.style.margin = "2px";
  inputFilterByUser.style.padding = "0 4px";
  inputFilterByUser.addEventListener("click", (e) => {
    if (e.target.value != "") {
      e.target.value = "";
      // inputFilterByUser.setAttribute("list", "");
      // inputFilterByUser.setAttribute("list", "users_datalist");
      // e.target.blur();
      // e.target.focus();
    }
  });
  inputFilterByUser.addEventListener("change", (e) => {
    const userSelectedId = document.querySelector(
      '#users_datalist option[value="' + inputFilterByUser.value + '"]'
    )?.dataset.id;
    if (userSelectedId === "updateFriends") {
      inputFilterByUser.value = "";
      UpdateFriends();
    }
  });
  if (currentUserId) {
    const optionSelf = document.createElement("option");
    optionSelf.value = _txt("buy_for_me");
    optionSelf.dataset.id = currentUserId;
    inputFilterByUser_datalist.appendChild(optionSelf);
    const optionUpdate = document.createElement("option");
    optionUpdate.value = _txt("update_friends");
    optionUpdate.dataset.id = "updateFriends";
    inputFilterByUser_datalist.appendChild(optionUpdate);
    if (currentUserId === userInfo?.steamid) {
      userInfo.friends.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.userName;
        option.dataset.id = user.id;
        inputFilterByUser_datalist.appendChild(option);
      });
    } else {
      userInfo = { steamid: currentUserId, name: currentUserName };
      UpdateFriends();
    }
  } else {
    inputFilterByUser.style.display = "none";
  }

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

  async function UpdateFriends() {
    inputFilterByUser.disabled = true;
    inputFilterByUser.placeholder = _txt("loading_friends");
    while (inputFilterByUser_datalist.childNodes.length > 2) {
      inputFilterByUser_datalist.removeChild(
        inputFilterByUser_datalist.lastChild
      );
    }
    let friends = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { query: "FetchFriends", id: currentUserId },
        resolve
      );
    });
    userInfo.friends = friends;
    friends.forEach((friend) => {
      const option = document.createElement("option");
      option.value = friend.userName;
      option.dataset.id = friend.id;
      inputFilterByUser_datalist.appendChild(option);
    });

    inputFilterByUser.placeholder = "🎁 " + _txt("buy_for_me");
    inputFilterByUser.disabled = false;
    _set({ userInfo });
  }
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
