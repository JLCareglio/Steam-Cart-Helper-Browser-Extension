(async () => {
  const btn = {
    back: document.getElementById("btn-back"),
    removeAll: document.getElementById("btn-removeAll"),
  };
  let savedPurchaseIdLists = (await _get("savedPurchaseIdLists"))
    .savedPurchaseIdLists || [
    { listName: _txt("default_list_name"), purchaseIds: [] },
  ];
  console.log(savedPurchaseIdLists[0].purchaseIds);
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

    const link = `https://store.steampowered.com/${
      game.subid ? "app/" + game.gameId : "bundle/" + listItem.id
    }`;

    listItem.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() === "button") RemoveGame(game);
      else window.open(link);
    });

    listItem.appendChild(deleteButton);
    listItem.appendChild(listName);
    listContainer.appendChild(listItem);
  });

  if (!listContainer.children.length)
    listContainer.innerHTML = `<h1 style="padding: 22px;margin: 8px;">${_txt(
      "no_games_saved"
    )}</h1>`;

  function RemoveGame(game) {
    const id = game.subid ?? game.bundleid;
    document.getElementById(id).remove();
    savedPurchaseIdLists[0].purchaseIds =
      savedPurchaseIdLists[0].purchaseIds.filter(
        (game) => (game.subid ?? game.bundleid) !== id
      );
    _set({ savedPurchaseIdLists });
    if (!listContainer.children.length) {
      listContainer.innerHTML = `<h1 style="padding: 22px;margin: 8px;">${_txt(
        "all_removed"
      )}</h1>`;
      setTimeout(() => {
        listContainer.innerHTML = `<h1 style="padding: 22px;margin: 8px;">${_txt(
          "no_games_saved"
        )}</h1>`;
      }, 900);
    }
  }
})();
