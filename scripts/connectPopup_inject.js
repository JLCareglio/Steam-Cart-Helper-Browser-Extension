function resetHTML(title) {
  const newHTML = `<head><title>${title}</title></head><body></body>`;
  document.write(newHTML);
  document.close();
  document.body.style.backgroundColor = "#1c1b1f";
  document.body.style.display = "flex";
  document.body.style.justifyContent = "center";
  document.body.style.alignItems = "center";
}

resetHTML("esperando inicio de sesión en steam");

const text = document.createElement("h1");
text.textContent = "cargando...";
text.style.textAlign = "center";
text.style.color = "#e6e1e5";
text.style.fontSize = "88px";
text.style.fontFamily = "sans-serif";
document.body.appendChild(text);

const iframe = document.createElement("iframe");
iframe.src = "https://steamcommunity.com/login/home/?goto=login";
iframe.style.display = "none";
iframe.style.width = "100%";
iframe.style.position = "fixed";
iframe.style.top = "0";
iframe.style.left = "0";
iframe.style.border = "none";
iframe.style.margin = 0;
iframe.style.padding = 0;
iframe.style.overflow = "hidden";
iframe.style.height = "100vh";
// iframe.setAttribute("scrolling", "no");
document.body.appendChild(iframe);

iframe.onload = async () => {
  const iframeBody = iframe.contentDocument?.body;
  if (iframeBody && iframeBody.querySelector(".page_content")) {
    iframeBody.style.overflowX = "hidden";
    const node = iframeBody.querySelector(".page_content");
    iframeBody.insertBefore(node, iframeBody.firstChild);
    const children = iframeBody.children;
    for (let i = 1; i < children.length; i++) {
      children[i].style.display = "none";
    }
    iframeBody.querySelector(".login_bottom_row").remove();
    text.remove();
    iframe.style.display = "block";

    // iframe.onload = () => {
    //   resetHTML("cierre esta ventana");
    //   text.textContent = "cierre esta ventana para continuar";
    //   document.body.appendChild(text);
    // };
    const interval = setInterval(async () => {
      if (
        !iframe.contentDocument?.URL.includes(
          "https://steamcommunity.com/login"
        )
      ) {
        resetHTML("cierre esta ventana");
        text.textContent = "✅";
        document.body.appendChild(text);
        clearInterval(interval);
        window.opener.postMessage("login completed", "*");
      }
    }, 200);
  } else window.opener.postMessage("login completed", "*");
};
