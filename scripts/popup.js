(async () => {
  const btn = {
    back: document.getElementById("btn-back"),
    removeAll: document.getElementById("btn-removeAll"),
  };
  let savedPurchaseIdLists = (
    await chrome.storage.local.get("savedPurchaseIdLists")
  ).savedPurchaseIdLists || [
    { listName: "Lista por Defecto", purchaseIds: [] },
  ];
  const listContainer = document.getElementById("list-container");

  // btn.back.onclick = () => (window.location.href = "popup.html");
  btn.removeAll.onclick = () =>
    savedPurchaseIdLists[0].purchaseIds.forEach((game) => RemoveGame(game));

  savedPurchaseIdLists[0].purchaseIds.forEach(function (game) {
    let listItem = document.createElement("li");
    let listName = document.createElement("span");
    let deleteButton = document.createElement("button");

    listItem.id = game.subid ?? game.bundleid;
    listName.textContent = game.name;
    deleteButton.innerText = "🗑️";
    deleteButton.className = "btn-delete";

    listItem.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() === "button") RemoveGame(game);
      else window.open("https://store.steampowered.com/app/" + game.gameId);
    });

    listItem.appendChild(deleteButton);
    listItem.appendChild(listName);
    listContainer.appendChild(listItem);
  });

  if (!listContainer.children.length)
    listContainer.innerHTML = `<h1 style="padding: 22px;margin: 8px;">sin juegos guardados</h1>`;

  function RemoveGame(game) {
    const id = game.subid ?? game.bundleid;
    document.getElementById(id).remove();
    savedPurchaseIdLists[0].purchaseIds =
      savedPurchaseIdLists[0].purchaseIds.filter(
        (game) => (game.subid ?? game.bundleid) !== id
      );
    chrome.storage.local.set({ savedPurchaseIdLists });
    if (!listContainer.children.length) {
      listContainer.innerHTML = `<h1 style="padding: 22px;margin: 8px;">✅ todo eliminado</h1>`;
      setTimeout(() => {
        listContainer.innerHTML = `<h1 style="padding: 22px;margin: 8px;">sin juegos guardados</h1>`;
      }, 900);
    }
  }
})();
