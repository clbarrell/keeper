// eslint-disable-next-line no-use-before-define
if (typeof submitRating == "undefined") {
  var submitRating;
  var showHelpText;
  var close;
}

submitRating = (rating) => {
  console.log(rating);
  close();
  chrome.storage.local.get(["moodRatings"], function (result) {
    const moodRatings = result.moodRatings || [];
    moodRatings.push({ time: Date.now(), rating: Number(rating) });
    // save it again
    chrome.storage.local.set({ moodRatings: moodRatings });
  });
};

showHelpText = (text) => {
  document.getElementById("ratingHelper").innerText = text;
};

close = () => {
  document.getElementById("modalBackdrop").remove();
  document.getElementById("moodModal").remove();
};

fetch(chrome.extension.getURL("/scripts/moodModal.html"))
  .then((response) => response.text())
  .then((data) => {
    document.body.innerHTML += data;
    // other code
    document.getElementById("skipButton").addEventListener("click", (e) => {
      close();
    });

    let buttons = document.getElementsByClassName("mood-button");
    for (let btn of buttons) {
      btn.addEventListener("click", (e) => {
        submitRating(e.target.dataset.value);
      });

      btn.addEventListener("mouseover", (e) => {
        showHelpText(e.target.dataset.desc);
      });

      btn.addEventListener("mouseout", (e) => {
        document.getElementById("ratingHelper").innerText = "";
      });
    }

    document.getElementById("keeperlogo").src = chrome.extension.getURL("logos/logo125.png");
  })
  .catch((err) => {
    // handle error
    console.log(err);
  });
