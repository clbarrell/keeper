chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
  });
});

chrome.tabs.onActivated.addListener(() => {
  // add to list of timestamps of tabChanges
  chrome.storage.local.get(["tabChanges"], function (result) {
    const tabChanges = result.tabChanges || [];
    tabChanges.push(Date.now());
    // save it again
    chrome.storage.local.set({ tabChanges: tabChanges });
  });
});

const debug = () => {
  chrome.storage.local.get(["tabChanges", "tabActivity"], function (result) {
    console.log("TAB CHANGES");
    console.log(result.tabChanges);
    console.log("TAB ACTIVITY");
    console.log(result.tabActivity);
  });
};
