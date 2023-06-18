(async () => {
  const dataset = document.querySelector(
    "#game_area_purchase_top > div"
  ).dataset;
  const name = document
    .querySelector("#game_area_purchase_top > div > h1")
    .textContent.trim()
    .replace(/^(\w+\s)/, "")
    .split("\t")[0];

  const bundleid = dataset.dsBundleid;
  const dsBundleData = JSON.parse(dataset.dsBundleData);
  const btns_addtocart = document.querySelectorAll(".btn_addtocart");
  let savedPurchaseIdLists = (await _get("savedPurchaseIdLists"))
    .savedPurchaseIdLists || [
    { listName: _txt("default_list_name"), purchaseIds: [] },
  ];

  console.log({
    dataset,
    bundleid,
    dsBundleData,
    btns_addtocart,
    savedPurchaseIdLists,
  });

  btns_addtocart.forEach((btn_addtocart) => {
    const button = document.createElement("button");
    const hasPurchaseInLists = savedPurchaseIdLists.some((list) =>
      list.purchaseIds.some((p) => p.bundleid == bundleid)
    );
    button.innerHTML = hasPurchaseInLists
      ? _txt("btn_remove") //"📝 Administrar"
      : _txt("btn_save");
    button.classList.value = "btn_save";
    button.style.width = btn_addtocart.clientWidth + "px";
    btn_addtocart.appendChild(button);

    button.addEventListener("click", async () => {
      savedPurchaseIdLists = (await _get("savedPurchaseIdLists"))
        .savedPurchaseIdLists || [
        { listName: _txt("default_list_name"), purchaseIds: [] },
      ];
      const [inLists, notInLists] = savedPurchaseIdLists.reduce(
        ([inList, notInList], list) => {
          return list.purchaseIds.some((p) => p.bundleid == bundleid)
            ? [[...inList, list], notInList]
            : [inList, [...notInList, list]];
        },
        [[], []]
      );
      if (!inLists.length) {
        savedPurchaseIdLists[0].purchaseIds.push({
          bundleid,
          name,
          dsBundleData,
        });
        // button.innerHTML = "📝 Administrar";
        // button.innerHTML = _txt("btn_remove");
        btns_addtocart.forEach(
          (b) => (b.querySelector(".btn_save").innerHTML = _txt("btn_remove"))
        );
      } else {
        const newLists = inLists.map((list) => {
          return {
            ...list,
            purchaseIds: list.purchaseIds.filter(
              (purchase) => purchase.bundleid != bundleid
            ),
          };
        });
        savedPurchaseIdLists = [...newLists, ...notInLists];
        // button.innerHTML = _txt("btn_save");
        btns_addtocart.forEach(
          (b) => (b.querySelector(".btn_save").innerHTML = _txt("btn_save"))
        );
      }
      _set({ savedPurchaseIdLists });
    });
  });
})();
