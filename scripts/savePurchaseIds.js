(async () => {
  const url = window.location.href;
  const gameId = url.split("/app/")[1].split("/")[0];
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
    if (purchase.value) {
      const typeId = purchase.name;
      const name = purchase
        .closest(".game_area_purchase_game_wrapper")
        .querySelector("h1")
        .textContent.trim()
        .replace(/^(\w+\s)/, "")
        .split("\t")[0];

      const button = document.createElement("button");
      const hasPurchaseInLists = savedPurchaseIdLists.some((list) =>
        list.purchaseIds.some((p) => p[typeId] == purchaseId)
      );
      button.innerHTML = hasPurchaseInLists
        ? "🗑️ eliminar" //"📝 Administrar"
        : "💾 guardar";
      button.classList.add("btn_black");
      button.style.height = "22px";
      button.style.width = "104px";
      button.style.padding = "0 4px";
      purchase.parentElement.after(button);

      button.addEventListener("click", () => {
        const [inLists, notInLists] = savedPurchaseIdLists.reduce(
          ([inList, notInList], list) => {
            return list.purchaseIds.some((p) => p[typeId] == purchaseId)
              ? [[...inList, list], notInList]
              : [inList, [...notInList, list]];
          },
          [[], []]
        );
        if (!inLists.length) {
          savedPurchaseIdLists[0].purchaseIds.push({
            gameId,
            [typeId]: purchaseId,
            name,
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
    }
  });
})();
