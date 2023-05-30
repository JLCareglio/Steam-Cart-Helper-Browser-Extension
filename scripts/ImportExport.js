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
        btn.import.innerHTML = `
            <span style="font-size: 22px">✅</span>
            <span>listo</span>`;
      } catch (error) {
        console.error(error);
        btn.import.innerHTML = `
            <span style="font-size: 22px">❌</span>
            <span>error</span>`;
      }
      setTimeout(() => {
        btn.import.innerHTML = `
            <span style="font-size: 22px">⬆️</span>
            <span>importar</span>`;
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
    const fileName = `SCH juegos guardados [${dateString} ${timeString}].json`;
    const jsonData = JSON.stringify({ savedPurchaseIdLists });
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    btn.export.innerHTML = `
        <span style="font-size: 22px">✅</span>
        <span>listo</span>`;
    setTimeout(() => {
      btn.export.innerHTML = `
          <span style="font-size: 22px">⬇️</span>
          <span>exportar</span>`;
    }, 700);
  });
}
