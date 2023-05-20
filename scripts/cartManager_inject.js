const leftCol = document.createElement("div");
leftCol.className = "leftcol";
leftCol.style.display = "flex";
leftCol.style.flexWrap = "wrap";
leftCol.style.alignItems = "center";
document.querySelector(".leftcol").style.marginTop = "2px";
document.querySelector(".leftcol").parentNode.prepend(leftCol);
const cartItemList = document.querySelector(".cart_item_list");

let currentUserName = document.querySelector("#account_pulldown")?.innerText;
let currentUserId =
  document
    .querySelector("#global_actions .user_avatar")
    ?.href.match(/(\d+)/g)
    ?.shift() ??
  document
    .querySelector("#global_actions .user_avatar")
    ?.href.match(/\/id\/([^/]+)/)
    ?.at(-1);

chrome.storage.local.get(["userInfo", "savedPurchaseIdLists"], async (resp) => {
  let userInfo = resp.userInfo;
  // let savedPurchaseIdLists = resp.savedPurchaseIdLists || [
  //   { listName: "Lista por Defecto", purchaseIds: [] },
  // ];
  const btnAddGamesToCart = document.createElement("button");
  const inputFilterByUser = document.createElement("input");
  const inputFilterByUser_datalist = document.createElement("datalist");
  // const selectLists = document.createElement("select");

  btnAddGamesToCart.innerText = "➕ cargar";
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

    let userSelectedGames;
    let userSelectedId = document.querySelector(
      '#users_datalist option[value="' + inputFilterByUser.value + '"]'
    )?.dataset.id;
    if (userSelectedId) {
      userSelectedGames = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { query: "FetchGames", id: userSelectedId },
          resolve
        );
      });
    }

    const cartItems = Array.from(cartItemList.querySelectorAll(".cart_row"));
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

  inputFilterByUser_datalist.id = "users_datalist";
  inputFilterByUser.type = "search";
  inputFilterByUser.setAttribute("list", "users_datalist");
  inputFilterByUser.appendChild(inputFilterByUser_datalist);
  inputFilterByUser.placeholder = "🎁 comprar para:";
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
    optionSelf.value = `mí (${currentUserName})`;
    optionSelf.dataset.id = currentUserId;
    inputFilterByUser_datalist.appendChild(optionSelf);
    const optionUpdate = document.createElement("option");
    optionUpdate.value = `actualizar amigos`;
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
    console.log("Actualizando Amigos");
    inputFilterByUser.disabled = true;
    inputFilterByUser.placeholder = "cargando amigos...";
    while (inputFilterByUser_datalist.childNodes.length > 2) {
      inputFilterByUser_datalist.removeChild(
        inputFilterByUser_datalist.lastChild
      );
    }
    let friendsHTML = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { query: "FetchFriendsHTML", id: currentUserId },
        resolve
      );
    });
    const doc = new DOMParser().parseFromString(friendsHTML, "text/html");
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

        const option = document.createElement("option");
        option.value = friendName;
        option.dataset.id = friendId;
        inputFilterByUser_datalist.appendChild(option);
      }
      inputFilterByUser.placeholder = "🎁 comprar para:";
      inputFilterByUser.disabled = false;
      chrome.storage.local.set({ userInfo });
    } catch (error) {
      inputFilterByUser.placeholder = "❌ ERROR";
      console.error(error);
    }
    console.log("Amigos Actualizados");
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
