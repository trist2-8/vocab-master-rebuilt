chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "vocab.html" });
});
