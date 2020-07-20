const submitRating = (rating) => {
  console.log("answered", rating);
  document.getElementById("moodModal").classList.add("hide");

  chrome.storage.local.get(["moodRatings", "lastActiveTab"], function (result) {
    const moodRatings = result.moodRatings || [];
    const lastActiveTab = result.lastActiveTab || null;
    moodRatings.push({ time: Date.now(), rating: Number(rating) });
    // save it again
    chrome.storage.local.set({ moodRatings: moodRatings, lastActiveTab: null }, () => {
      if (lastActiveTab != null) {
        chrome.tabs.getCurrent((t) => {
          chrome.tabs.update(lastActiveTab, { active: true });
          chrome.tabs.remove(t.id);
        });
      } else {
        window.close();
      }
    });
  });
};

// ON LOAD

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("skipButton").addEventListener("click", () => {
    window.close();
  });

  let buttons = document.getElementsByClassName("mood-button");
  for (let btn of buttons) {
    btn.addEventListener("click", (e) => {
      submitRating(e.target.dataset.value);
    });
  }
});

// document.getElementById("keeperlogo").src = chrome.extension.getURL("logos/logo125.png");
