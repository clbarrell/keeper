const submitRating = (rating) => {
  console.log("answered", rating);
  document.getElementById("moodModal").classList.add("hide");
  const radio = document.querySelector('input[type="radio"]:checked');
  const radioValue = radio ? radio.value : null;
  chrome.storage.local.get(
    ["moodRatings", "lastActiveTab", "onOffTaskRatings"],
    function (result) {
      const moodRatings = result.moodRatings || [];
      const onOffTaskRatings = result.onOffTaskRatings || [];
      const lastActiveTab = result.lastActiveTab || null;
      moodRatings.push({ time: Date.now(), rating: Number(rating) });
      if (radioValue != null) {
        onOffTaskRatings.push({ time: Date.now(), rating: radioValue });
      }

      // save it again
      chrome.storage.local.set(
        {
          moodRatings: moodRatings,
          lastActiveTab: null,
          onOffTaskRatings: onOffTaskRatings,
        },
        () => {
          if (lastActiveTab != null) {
            chrome.tabs.getCurrent((t) => {
              chrome.tabs.update(lastActiveTab, { active: true });
              chrome.tabs.remove(t.id);
            });
          } else {
            window.close();
          }
        }
      );
    }
  );
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

  document.getElementById(
    "time"
  ).innerText = `Asked @ ${new Date().toLocaleTimeString()}`;
});

// document.getElementById("keeperlogo").src = chrome.extension.getURL("logos/logo125.png");
