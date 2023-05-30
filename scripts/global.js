let explorer, runtime, data;
if (typeof browser !== "undefined" && typeof browser.runtime !== "undefined")
  [explorer, runtime, data] = [browser, browser.runtime, storage];
else if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined")
  [explorer, runtime, data] = [chrome, chrome.runtime, chrome.storage];

const _get = (keys, callback) =>
  callback ? data.local.get(keys, callback) : data.local.get(keys);
const _set = (keys, callback) =>
  callback ? data.local.set(keys, callback) : data.local.set(keys);
const _send = (message, callback) =>
  callback
    ? runtime.sendMessage(message, callback)
    : runtime.sendMessage(message);
const _txt = (message, substitutions) =>
  explorer.i18n.getMessage(message, substitutions);
