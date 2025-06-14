console.log("✅ Content script loaded!");

// Step 1: Store the last Url
let lastUrl = location.href;

// Step 2: Create a new element and add it to the YouTube right controls
const AddButton = function () {
  const youtubeEl = document.getElementsByClassName("ytp-right-controls")[0];

  if (youtubeEl && !document.getElementById("new-button")) {
    const newEl = document.createElement("button");
    newEl.id = "new-button";

    Object.assign(newEl.style, {
      backgroundColor: "rebeccapurple",
      position: "relative",
      bottom: "39%",
      height: "46%",
      right: "2%",
      color: "#f1f1f1",
      borderRadius: "0.5rem",
      cursor: "pointer",
    });

    newEl.textContent = "Add to notes";

    youtubeEl.prepend(newEl);
    console.log("✅ New element with ID 'body' added to the right controls.");
  } else {
    console.log("❌ Element with ID 'body' not found.");
  }
};

// Step 3 : Setting up the MutationObserver to monitor changes in the document
const observer = new MutationObserver(() => {
  // Step 4: Check if the current URL is different from the last stored URL
  if (lastUrl !== location.href) {
    lastUrl = location.href;
    console.log("✅ URL changed to:", lastUrl);
    // Step 5: Recreate the new element if the URL changes
    setTimeout(AddButton, 1000);
  }
});
// Step 6: Start observing the document for changes
observer.observe(document, {
  childList: true,
  subtree: true,
});

// Step 7: Call the function to add the button initially
AddButton();

// Step 8: Add an event listener to the new button
document.addEventListener("click", (event) => {
  console.log(event.target.id);
  if (event.target.id === "new-button") {
    console.log("✅ New button clicked!");

    const curTime = document.querySelector(".ytp-time-current").textContent;
    const videoTitle = document.querySelector(
      ".title.ytd-video-primary-info-renderer"
    ).textContent;
    const videoDuration =
      document.querySelector(".ytp-time-duration").textContent;
    const videoUrl = location.href;
    const videoId = new URL(videoUrl).searchParams.get("v");

    const videoDetails = {
      title: videoTitle,
      currentTime: curTime,
      duration: videoDuration,
      url: videoUrl,
      id: videoId,
    };

    console.log("✅ Video details:", videoDetails);
    console.log("saving to chrome.storage...");

    // Step 9 : store details to the chrome.storage
    chrome.storage.local.get(["youtube"], (result) => {
      const youtube = result.youtube || [];

      // Check if the video is already in the storage
      const videoExists = youtube.some(
        (videoId) => videoId.id === videoDetails.id
      );

      if (!videoExists) {
        youtube.push(videoDetails);
        console.log("✅ Video details saved to chrome.storage:", youtube);

        chrome.storage.local.set({ youtube }, () => {
          console.log("✅ Video details successfully saved to chrome.storage.");
        });
      }
    });
  }
});
