const url = window.location.href;
const gameId = url.split("/app/")[1].split("/")[0];
const subIds = document.querySelectorAll('[name="subid"]');
const bundleIds = document.querySelectorAll('[name="bundleid"]');

chrome.storage.local.get("savedPurchaseIds", (result) => {
  let savedPurchaseIds = result.savedPurchaseIds || [];
  console.log(savedPurchaseIds);
  [...subIds, ...bundleIds].forEach((product) => {
    const purchaseId = product.value;
    const name = product
      .closest(".game_area_purchase_game_wrapper")
      .querySelector("h1")
      .textContent.trim()
      .replace(/^(\w+\s)/, "")
      .split("\t")[0];

    const button = document.createElement("button");
    button.innerHTML = savedPurchaseIds.some(
      (product) => product.purchaseId == purchaseId
    )
      ? "➖ Quitar"
      : "➕ Guardar";
    button.classList.add("btn_black");
    button.style.height = "22px";
    button.style.width = "80px";
    button.style.padding = "0 4px";

    product.parentElement.after(button);

    button.addEventListener("click", () => {
      chrome.storage.local.get("savedPurchaseIds", (result) => {
        let savedProductIds = result.savedPurchaseIds || [];
        const index = savedProductIds.findIndex(
          (product) => product.purchaseId == purchaseId
        );

        if (index === -1) {
          savedProductIds.push({ gameId, purchaseId, name });
          button.innerHTML = "➖ Quitar";
        } else {
          savedProductIds.splice(index, 1);
          button.innerHTML = "➕ Guardar";
        }

        chrome.storage.local.set(
          { savedPurchaseIds: savedProductIds },
          () => {}
        );
      });
    });
  });
});
