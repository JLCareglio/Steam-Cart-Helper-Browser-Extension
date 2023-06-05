const btnContainer1 = document.createElement("div");
btnContainer1.classList.value = "leftcol leftcol_sch";
const btnContainer2 = btnContainer1.cloneNode();
const leftCol = document.querySelector(".leftcol");
leftCol.style.marginTop = "2px";
leftCol.parentNode.prepend(btnContainer1, btnContainer2);
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
  btnAddGamesToCart.classList.add("btn_black", "btn_sch");
  const btnLogin = btnAddGamesToCart.cloneNode();
  const btnRemoveAll = btnAddGamesToCart.cloneNode();
  const btnRemoveAlreadyOwned = btnAddGamesToCart.cloneNode();
  const btnRemoveNonGiftables = btnAddGamesToCart.cloneNode();

  const cartItems = Array.from(cartItemList.querySelectorAll(".cart_row")).map(
    (item) => ({
      ...item.dataset,
      dsBundleData: JSON.parse(item.dataset.dsBundleData ?? null),
      cartId: item.id,
      cartGid: item.id.match(/(\d+)/)[0],
      cartDescExt: item
        .querySelector(".cart_item_desc_ext")
        ?.innerHTML.replace(/<.*/, ""),
    })
  );
  console.log("cartItems", cartItems);

  btnAddGamesToCart.innerText = _txt("add_saves_to_cart");
  btnAddGamesToCart.onclick = HandlerAddGames;

  inputFilterByUser.placeholder = "🎁 " + _txt("buy_for_me");
  inputFilterByUser_datalist.id = "users_datalist";
  inputFilterByUser.type = "search";
  inputFilterByUser.setAttribute("list", "users_datalist");
  inputFilterByUser.appendChild(inputFilterByUser_datalist);
  inputFilterByUser.classList.add("btn_black", "btn_sch");
  inputFilterByUser.onclick = (e) => (e.target.value = "");
  inputFilterByUser.onchange = HandlerChangeInputUser;
  inputFilterByUser.onmouseover = HandlerMouseOverInputUser;
  inputFilterByUser.onmouseout = HandlerMouseOutInputUser;

  btnLogin.innerText = _txt("not_logged_in");
  btnLogin.onclick = () => {
    window.location = "https://store.steampowered.com/login/?redir=cart%2F";
    window.open("https://steamcommunity.com/login/home");
  };

  // selectLists.classList.add("btn_black", "btn_sch");
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

  btnContainer1.prepend(btnAddGamesToCart);
  // btnContainer1.prepend(selectLists);

  if (cartItems.length) {
    let userSelectedId = document.querySelector(
      '#users_datalist option[value="' + inputFilterByUser.value + '"]'
    )?.dataset.id;

    const cleanableItems = cartItems.reduce((acc, obj) => {
      const key = obj.cartDescExt;
      if (!acc[key]) acc[key] = [];
      acc[key].push(obj);
      return acc;
    }, {});
    // console.log("cleanableItems", cleanableItems);

    const nonGiftablesItems = cartItems.filter(
      (item) => item.dsBundleData?.m_bRestrictGifting
    );

    if (nonGiftablesItems.length) {
      btnRemoveNonGiftables.innerText = _txt("remove_non_giftables");
      btnRemoveNonGiftables.onclick = async () => {
        DisableButtonsPointerEvents();
        for (const [i, item] of nonGiftablesItems.entries()) {
          btnRemoveNonGiftables.innerText = `🫧 ${_txt("removing")} (${i + 1}/${
            nonGiftablesItems.length
          })...`;
          const resp = await MyRemoveFromCart(item.cartGid);
          console.log(await resp);
          cartItemList.querySelector("#" + item.cartId).remove();
        }
        btnRemoveNonGiftables.innerText = _txt("reloading_web_page");
        window.location = window.location;
      };
      btnRemoveNonGiftables.style.display =
        userSelectedId && userSelectedId !== currentUserId ? "auto" : "none";
      btnContainer2.prepend(btnRemoveNonGiftables);
    }

    for (const key in cleanableItems) {
      if (key == "undefined") continue;
      const items = cleanableItems[key];
      const btn = document.createElement("button");
      btn.innerText = `${_txt("clean")} ${items.length}: '${key}'`;
      btn.classList.add("btn_black", "btn_sch");
      btn.addEventListener("click", async () => {
        DisableButtonsPointerEvents();
        for (const [i, item] of items.entries()) {
          btn.innerText = `🍃 ${_txt("removing")} (${i + 1}/${
            items.length
          })...`;
          const resp = await MyRemoveFromCart(item.cartGid);
          console.log(await resp);
          cartItemList.querySelector("#" + item.cartId).remove();
        }
        btn.innerText = _txt("reloading_web_page");
        window.location = window.location;
      });
      btnContainer2.appendChild(btn);
    }

    btnRemoveAll.innerText = _txt("remove_all_from_cart");
    btnRemoveAll.onclick = MyForgetCart;
    btnContainer1.appendChild(btnRemoveAll);
  }

  if (currentUserId) {
    btnContainer1.prepend(inputFilterByUser);

    const optionSelf = document.createElement("option");
    optionSelf.value = "🫵 " + _txt("buy_for_me");
    optionSelf.setAttribute("name", _txt("buy_for_me").toLowerCase());
    optionSelf.dataset.id = currentUserId;
    inputFilterByUser_datalist.appendChild(optionSelf);
    const optionUpdate = document.createElement("option");
    optionUpdate.value = "🗄️ " + _txt("update_user_info");
    optionUpdate.setAttribute("name", _txt("update_user_info").toLowerCase());
    optionUpdate.dataset.id = "updateUserInfo";
    inputFilterByUser_datalist.appendChild(optionUpdate);
    if (currentUserId === userInfo?.steamid) {
      userInfo.friends.forEach((user) => {
        const option = document.createElement("option");
        option.value = "🎁 " + user.userName;
        option.setAttribute("name", user.userName.toLowerCase());
        option.dataset.id = user.id;
        inputFilterByUser_datalist.appendChild(option);
      });
    } else {
      userInfo = { steamid: currentUserId, name: currentUserName };
      UpdateUserInfo();
    }
  } else {
    inputFilterByUser.style.display = "none";
    btnContainer1.appendChild(btnLogin);
  }

  async function HandlerAddGames() {
    DisableButtonsPointerEvents(true);
    let loadingText = _txt("loading") + "...";
    const btnAddGamesToCartWidth = btnAddGamesToCart.clientWidth + "px";
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
      } else if (
        currentUserId &&
        (!userSelectedId || userSelectedId == currentUserId)
      ) {
        // loadingText = "cargando (obteniendo 🫵🎮)...";
        loadingText = _txt("comparing_games");
        userSelectedGames = userInfo.games;
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
                <div class="cart_item cart_loading_sch">
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
        console.log(await resp);
        j++;
      }
      newCartItem.innerHTML = `
            <div class="cart_row even app_impression_tracked">
              <p class="cart_item cart_reloading_sch">
                ${_txt("reloading_web_page")}
              </p>
            </div>`;
      cartItemList.prepend(newCartItem);
      clearInterval(intervalLoading);
      btnAddGamesToCart.style.width = btnAddGamesToCartWidth;
      btnAddGamesToCart.innerText = _txt("done");
      window.location = window.location;
      // console.log("reload window");
    } else {
      clearInterval(intervalLoading);
      btnAddGamesToCart.style.width = btnAddGamesToCartWidth;
      btnAddGamesToCart.innerText = _txt("without_changes");
      setTimeout(() => {
        btnAddGamesToCart.style.width = "";
        btnAddGamesToCart.innerText = _txt("add_saves_to_cart");
        DisableButtonsPointerEvents(false);
      }, 700);
    }
  }

  async function HandlerChangeInputUser(e) {
    const targetName = /^(🎁 |🗄️ |🫵 ).*/.test(e.target.value)
      ? e.target.value.split(" ").slice(1).join(" ").toLowerCase()
      : e.target.value.toLowerCase().trim();
    console.log({ targetName }, e.target.value);
    let userSelectedId = e.target.querySelector(
      '#users_datalist option[name="' + targetName + '"]'
    )?.dataset.id;

    console.log("Seleccionado: ", e.target.value, userSelectedId);

    if (!userSelectedId) {
      e.target.value = "";
      e.target.placeholder = _txt("nonexistent_user");
      userInfo.lastUserSelected = null;
      setTimeout(() => {
        e.target.placeholder = "🎁 " + _txt("buy_for_me");
      }, 1000);
      btnRemoveAlreadyOwned.style.display = "block";
      btnRemoveNonGiftables.style.display = "none";
      // if (!btnRemoveNonGiftables.parentElement && cartItems.length) {
      //   let loadingText = _txt("comparing_games");
      //   let userSelectedGames = await new Promise((resolve) => {
      //     chrome.runtime.sendMessage(
      //       { query: "FetchGames", id: userSelectedId },
      //       resolve
      //     );
      //   });
      //   console.log("userSelectedGames:", userSelectedGames);

      //   // loadingText = _txt("removing_already_acquired");
      //   const ownedItems = cartItems.filter((item) => {
      //     const gameIds = item.dsBundleData?.m_rgItems.flatMap(
      //       (ids) => ids.m_rgIncludedAppIDs
      //     ) ?? [item.gameId];
      //     return !userSelectedGames.some((userGame) =>
      //       gameIds.includes(userGame.appid)
      //     );
      //   });

      //   if (ownedItems.length) {
      //     btnRemoveAlreadyOwned.style.display = "block";
      //   }
      // }
    } else if (userSelectedId == "updateUserInfo") UpdateUserInfo();
    else if (userSelectedId != currentUserId) {
      const friendName = userInfo.friends.find(
        (friend) => friend.id == userSelectedId
      ).userName;
      e.target.value = "🎁 " + friendName;
      userInfo.lastUserSelected = {
        userSelectedName: e.target.value,
        userName: friendName,
        id: userSelectedId,
      };
      btnRemoveAlreadyOwned.style.display = "none";
      btnRemoveNonGiftables.style.display = "block";
    } else if (userSelectedId == currentUserId) {
      e.target.value = "🫵 " + _txt("buy_for_me");
      userInfo.lastUserSelected = {
        userSelectedName: e.target.value,
        userName: currentUserName,
        id: userSelectedId,
      };
      btnRemoveAlreadyOwned.style.display = "block";
      btnRemoveNonGiftables.style.display = "none";
    }
  }
  function HandlerMouseOverInputUser(e) {
    const userSelectedId = e.target.querySelector(
      '#users_datalist option[value="' + e.target.value + '"]'
    )?.dataset.id;
    if (!userSelectedId) return;

    userInfo.lastUserSelected = {
      userSelectedName: e.target.value,
      userName: e.target.value.replace("🎁 ", ""),
      id: userSelectedId,
    };
    e.target.value = "";
    e.target.placeholder = userInfo.lastUserSelected.userSelectedName;
  }
  function HandlerMouseOutInputUser(e) {
    if (!userInfo.lastUserSelected) return;
    e.target.value = userInfo.lastUserSelected.userSelectedName;
    userInfo.lastUserSelected = null;
    e.target.placeholder = "🎁 " + _txt("buy_for_me");
  }

  async function UpdateUserInfo() {
    DisableButtonsPointerEvents(true);
    btnRemoveNonGiftables.style.display = "none";
    btnRemoveAlreadyOwned.style.display = "block";
    inputFilterByUser.disabled = true;
    inputFilterByUser.value = "";
    inputFilterByUser.placeholder = _txt("loading_friends");
    userInfo.lastUserSelected = null;
    while (inputFilterByUser_datalist.childNodes.length > 2) {
      inputFilterByUser_datalist.removeChild(
        inputFilterByUser_datalist.lastChild
      );
    }
    let friends = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { query: "FetchFriends", id: currentUserId, force: true },
        resolve
      );
    });
    console.log(friends);
    friends.sort((a, b) => a.id.localeCompare(b.id));
    friends.sort((a, b) => a.userName.localeCompare(b.userName));

    userInfo.friends = friends;
    friends.forEach((friend) => {
      const option = document.createElement("option");
      option.value = "🎁 " + friend.userName;
      option.setAttribute("name", friend.userName.toLowerCase());
      option.dataset.id = friend.id;
      inputFilterByUser_datalist.appendChild(option);
    });
    inputFilterByUser.placeholder = _txt("loading_games");
    let games = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { query: "FetchCurrentUserGames", force: true },
        resolve
      );
    });
    userInfo.games = games;

    inputFilterByUser.placeholder = _txt("done");
    inputFilterByUser.disabled = false;
    DisableButtonsPointerEvents(false);
    setTimeout(() => {
      inputFilterByUser.placeholder = "🎁 " + _txt("buy_for_me");
    }, 1000);
    _set({ userInfo });
  }

  function MyAddToCart(request) {
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
        headers: { "X-Requested-With": "SteamCartHelper" },
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  function MyRemoveFromCart(gid) {
    const g_sessionID = document.querySelector("[name='sessionid']").value;
    const formData = new FormData();
    formData.set("action", "remove_line_item");
    formData.set("lineitem_gid", gid);
    formData.set("sessionid", g_sessionID);

    return new Promise((resolve, reject) => {
      fetch(`https://store.steampowered.com/cart/`, {
        credentials: "include",
        method: "POST",
        body: formData,
        headers: { "X-Requested-With": "SteamCartHelper" },
      })
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  function MyForgetCart() {
    try {
      document.querySelector(".remove_ctn>a").dispatchEvent(new Event("click"));
    } catch (error) {
      const date = new Date();
      date.setTime(date.getTime() + -10 * 24 * 60 * 60 * 1000);
      const expires = "expires=" + date.toGMTString();
      document.cookie = "shoppingCartGID" + "=-1; " + expires + "; path=/";
      window.location = window.location;
    }
  }

  function DisableButtonsPointerEvents(disable = true) {
    const cssValue = disable ? "none" : "auto";
    btnContainer1.style.pointerEvents = cssValue;
    btnContainer2.style.pointerEvents = cssValue;
  }
});
