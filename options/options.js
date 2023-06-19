(async () => {
  const ui = {
    btn_import: document.getElementById("importButton"),
    btn_export: document.getElementById("exportButton"),
    btn_removeAll: document.getElementById("removeAllButton"),
    btn_github: document.getElementById("githubButton"),
    btn_edgeAddon: document.getElementById("edgeAddonButton"),
    btn_paypal: document.getElementById("paypalButton"),
    title: document.getElementById("title"),
    subtitleChangeLang: document.getElementById("subtitleChangeLang"),
    languageSelect: document.getElementById("languageSelect"),
    subtitleLists: document.getElementById("subtitleLists"),
    warningImport: document.getElementById("warningImport"),
  };

  ui.btn_import.innerText = _txt("btn_import");
  ui.btn_export.innerText = _txt("btn_export");
  ui.btn_removeAll.innerText = _txt("btn_remove_all");
  ui.title.innerText = _txt("title_options");
  ui.subtitleChangeLang.innerText = _txt("change_language");
  ui.subtitleLists.innerText = _txt("manege_lists");
  ui.warningImport.innerText = _txt("warning_import_lists");

  let savedPurchaseIdLists = (await _get("savedPurchaseIdLists"))
    .savedPurchaseIdLists || [
    { listName: _txt("default_list_name"), purchaseIds: [] },
  ];

  ui.btn_import.onclick = ImportData;
  ui.btn_export.onclick = ExportData;
  ui.btn_removeAll.onclick = RemoveData;
  ui.btn_github.onclick = () =>
    window.open(
      "https://github.com/JLCareglio/Steam-Cart-Helper-Browser-Extension"
    );
  ui.btn_edgeAddon.onclick = () =>
    window.open(
      "https://microsoftedge.microsoft.com/addons/detail/steam-cart-helper/afgkhaceenngofnbpbhdbehopaihdoji"
    );
  ui.btn_paypal.onclick = () =>
    window.open("https://www.paypal.com/paypalme/JLCareglio");

  function ImportData() {
    const input = document.createElement("input");
    input.type = "file";

    input.addEventListener("change", (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        try {
          const savedPurchaseIdLists = JSON.parse(content).savedPurchaseIdLists;
          _set({ savedPurchaseIdLists });
          ui.btn_import.innerText = _txt("done");
        } catch (error) {
          ui.btn_import.innerText = `❌ ERROR`;
        }
        setTimeout(() => {
          ui.btn_import.innerText = _txt("btn_import");
        }, 700);
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function ExportData() {
    _get("savedPurchaseIdLists", (resp) => {
      let savedPurchaseIdLists = resp.savedPurchaseIdLists;
      const currentDate = new Date();
      const dateString = currentDate
        .toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
        .replaceAll("/", "-");
      const timeString = currentDate
        .toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replaceAll(":", ".");
      const fileName = `🛒 SCH ${_txt(
        "title"
      )} [${dateString} ${timeString}].json`;
      const jsonData = JSON.stringify({ savedPurchaseIdLists });
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      ui.btn_export.innerText = _txt("done");
      setTimeout(() => {
        ui.btn_export.innerText = _txt("btn_export");
      }, 700);
    });
  }

  function RemoveData() {
    const savedPurchaseIdLists = [
      { listName: _txt("default_list_name"), purchaseIds: [] },
    ];
    _set({ savedPurchaseIdLists });
    ui.btn_removeAll.innerText = _txt("all_removed");
    setTimeout(() => {
      ui.btn_removeAll.innerText = _txt("btn_remove_all");
    }, 700);
  }
})();
