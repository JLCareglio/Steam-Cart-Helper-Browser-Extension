(async () => {
  const url = window.location.href;
  let gameId = parseInt(url.split("/app/")[1].split("/")[0]);
  const subIds = document.querySelectorAll('[name="subid"]');
  const bundleIds = document.querySelectorAll('[name="bundleid"]');
  let savedPurchaseIdLists = (
    await chrome.storage.local.get("savedPurchaseIdLists")
  ).savedPurchaseIdLists || [
    { listName: "Lista por Defecto", purchaseIds: [] },
  ];
  console.log(savedPurchaseIdLists);

  [...subIds, ...bundleIds].forEach((purchase) => {
    const purchaseId = purchase.value;
    if (purchaseId) {
      const typeId = purchase.name;
      const gameE = purchase.closest(".game_area_purchase_game_wrapper");
      const name = gameE
        .querySelector("h1")
        .textContent.trim()
        .replace(/^(\w+\s)/, "")
        .split("\t")[0];
      const btn_addtocart = gameE.querySelector(
        ".btn_addtocart > .btn_green_steamui"
      ).parentNode;

      const button = document.createElement("button");
      const hasPurchaseInLists = savedPurchaseIdLists.some((list) =>
        list.purchaseIds.some((p) => p[typeId] == purchaseId)
      );
      button.innerHTML = hasPurchaseInLists
        ? "🗑️ eliminar" //"📝 Administrar"
        : "💾 guardar";
      button.classList.value = "btn_save";
      button.style.width = btn_addtocart.clientWidth + "px";
      btn_addtocart.appendChild(button);

      button.addEventListener("click", async () => {
        savedPurchaseIdLists = (
          await chrome.storage.local.get("savedPurchaseIdLists")
        ).savedPurchaseIdLists || [
          { listName: "Lista por Defecto", purchaseIds: [] },
        ];
        const [inLists, notInLists] = savedPurchaseIdLists.reduce(
          ([inList, notInList], list) => {
            return list.purchaseIds.some((p) => p[typeId] == purchaseId)
              ? [[...inList, list], notInList]
              : [inList, [...notInList, list]];
          },
          [[], []]
        );
        if (!inLists.length) {
          let dsBundleData = JSON.parse(gameE.dataset.dsBundleData ?? null);
          if (typeId === "bundleid") gameId = null;
          savedPurchaseIdLists[0].purchaseIds.push({
            gameId,
            [typeId]: purchaseId,
            name,
            dsBundleData,
          });
          // button.innerHTML = "📝 Administrar";
          button.innerHTML = "🗑️ eliminar";
        } else {
          const newLists = inLists.map((list) => {
            return {
              ...list,
              purchaseIds: list.purchaseIds.filter(
                (purchase) => purchase[typeId] != purchaseId
              ),
            };
          });
          savedPurchaseIdLists = [...newLists, ...notInLists];
          button.innerHTML = "💾 guardar";
        }
        chrome.storage.local.set({ savedPurchaseIdLists });
      });

      const aux = gameE.children[1];
      if (
        aux &&
        !aux.classList.contains("ds_flag") &&
        !aux.classList.contains("game_area_purchase_not_refundable")
      ) {
        if (aux.classList.contains("game_purchase_area_friends_want"))
          aux.querySelector("p:nth-child(2)").style.maxWidth =
            btn_addtocart.offsetLeft -
            parseInt(
              window.getComputedStyle(aux).paddingLeft.replace("px", "")
            ) +
            "px";
        else {
          let paddingTop = parseInt(
            window.getComputedStyle(aux).paddingTop.replace("px", "")
          );
          aux.style.paddingTop = paddingTop + 25 + "px";
        }
      }

      // Agregando enlaces a SteamSB
      let steamdb = document.createElement("a");
      if (typeId == "subid") {
        steamdb.classList.value = "btn_black btn_small btn_steamDB_subid";
        steamdb.href = `https://steamdb.info/sub/${purchaseId}/`;
        steamdb.innerHTML = `<span data-tooltip-text="View on SteamDB">Sub ${purchaseId}</span>`;
        gameE.querySelector(".game_purchase_action").prepend(steamdb);
      } else {
        const packageE = gameE.querySelector(".btn_addtocart.btn_packageinfo");
        steamdb.classList.value = "btn_black btn_small btn_steamDB_bundleid";
        steamdb.href = `https://steamdb.info/bundle/${purchaseId}/`;
        steamdb.innerHTML = `<span data-tooltip-text="View on SteamDB">Bundle ${purchaseId}</span>`;
        steamdb.style.width = packageE.clientWidth + "px";
        packageE.appendChild(steamdb);
        packageE.parentNode.style.float = "left"
      }
    }
  });
})();
