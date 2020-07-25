chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
  });
});

chrome.tabs.onActivated.addListener((t) => {
  const currentTabId = t.tabId;
  chrome.tabs.get(currentTabId, (res) => {
    if (
      /moodModal|chrome:\/\/|chrome-extension:\/\//.test(res.url) ||
      (res.pendingUrl &&
        /moodModal|chrome:\/\/|chrome-extension:\/\//.test(res.pendingUrl))
    ) {
      console.log("Not checking a restriced page,", res.url);
      return;
    } else {
      // ONLY DO IF A SAFE WEBSITE
      // add to list of timestamps of tabChanges
      chrome.storage.local.get(
        ["tabChanges", "changeThreshold", "lastAlert"],
        function (result) {
          const tabChanges = result.tabChanges || [];
          const changeThreshold = result.changeThreshold || 5;
          const lastAlert = result.lastAlert || 0;
          tabChanges.push(Date.now());
          // save it again
          chrome.storage.local.set({ tabChanges: tabChanges });

          // check if there's been more than threshold tab changes
          const fiveMins = 1000 * 60 * 5;
          const limit = Date.now() - fiveMins;
          const date = new Date();
          const currentHr = date.getHours();
          const numOfRecentTabChanges = tabChanges.filter((tc) => tc > limit)
            .length;
          if (
            numOfRecentTabChanges > changeThreshold &&
            lastAlert < limit - fiveMins &&
            currentHr > 8 &&
            currentHr < 19 &&
            ![0, 6].includes(date.getDay())
          ) {
            console.log(
              `Getting mood input \nnow:\t${new Date()}, \nlast:\t${new Date(
                lastAlert
              )}`
            );
            chrome.storage.local.set({
              lastAlert: Date.now(),
              lastActiveTab: currentTabId,
            });
            chrome.tabs.create({
              url: chrome.runtime.getURL("scripts/moodModal.html"),
            });
          }
        }
      );
    }
  });
});

const debug = () => {
  chrome.storage.local.get(
    ["tabChanges", "tabActivity", "moodRatings", "lastAlert"],
    function (result) {
      console.log("TAB CHANGES");
      console.log(result.tabChanges);
      console.log("TAB ACTIVITY");
      console.log(result.tabActivity);
      console.log("MOOD RATINGS");
      console.log(result.moodRatings);
      console.log("Last alert");
      console.log(new Date(result.lastAlert));
    }
  );
};

const lastActiveTab = () => {
  chrome.storage.local.get(["lastActiveTab"], function (result) {
    console.log(result.lastActiveTab);
  });
};

const getFromStorage = (key) => {
  chrome.storage.local.get([key], function (result) {
    console.log(result[key]);
  });
};
