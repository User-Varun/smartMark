// *************************** Global Variables **************************************
const youtubeEl = document.getElementsByClassName("ytp-right-controls")[0];
const button = document.createElement("button"); // Single reusable button
button.id = "new-button";
let cachedYoutubeMarks = []; // In-memory cache of stored timestamps

// **************************** Utility Functions ****************************

/**
 * Converts a timestamp string (e.g., "1:23" or "1:02:03") into total seconds.
 */
function getTimeInSeconds(timeStr) {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

/**
 * Renders the button with different styles based on its state:
 * mark, marked, alreadyMarked, or done.
 */
function renderButton(ButtonWhich) {
  // Common styling
  button.style.position = "relative";
  button.style.bottom = "39%";
  button.style.right = "2%";
  button.style.height = "46%";
  button.style.minWidth = "110px";
  button.style.minHeight = "32px";
  button.style.border = "none";
  button.style.borderRadius = "0.5rem";
  button.style.cursor = "pointer";
  button.style.fontWeight = "600";
  button.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.15)";
  button.style.transition = "all 0.15s ease-in-out";
  button.style.fontFamily = "'YouTube Sans', sans-serif";

  // State-specific text and colors
  if (ButtonWhich === "mark") {
    button.textContent = "Mark";
    button.style.backgroundColor = "rebeccapurple";
    button.style.color = "white";
  } else if (ButtonWhich === "marked") {
    button.textContent = "Marked ☑️";
    button.style.backgroundColor = "#2c2c2c";
    button.style.color = "#e7e7e7";
  } else if (ButtonWhich === "alreadyMarked") {
    button.textContent = "Already Marked";
    button.style.backgroundColor = "red";
    button.style.color = "white";
  } else if (ButtonWhich === "done") {
    button.textContent = "Done ✅";
    button.style.backgroundColor = "green";
    button.style.color = "white";
  }

  // Append the button only once to YouTube's right-controls bar
  if (youtubeEl && !document.getElementById("new-button")) {
    youtubeEl.prepend(button);
  }
}

// ***************************** Main Code *****************************

// Step 0: Load cached markers from chrome.storage
chrome.storage.local.get(["youtube"], (result) => {
  cachedYoutubeMarks = result.youtube || [];
});

// Step 1: Keep track of current page URL for changes
let lastUrl = location.href;

// Step 2: On initial script load, if button isn't already on page, render it
if (youtubeEl && !document.getElementById("new-button")) {
  renderButton("mark");
}

// Step 3: Watch for URL changes (e.g., navigating to another video)
const observer = new MutationObserver(() => {
  if (lastUrl !== location.href) {
    lastUrl = location.href;

    // Reload cache from storage when video changes
    chrome.storage.local.get(["youtube"], (result) => {
      cachedYoutubeMarks = result.youtube || [];
    });

    // Reset button to default state after navigating
    setTimeout(() => renderButton("mark"), 2000);
  }
});

observer.observe(document, {
  childList: true,
  subtree: true,
});

// ✅ Step 4.1: Every second, check current playback time to auto-update button
setInterval(() => {
  const curTimeEl = document.querySelector(".ytp-time-current");
  const videoTitleEl = document.querySelector(
    ".title.ytd-video-primary-info-renderer"
  );
  if (!curTimeEl || !videoTitleEl) return;

  const curTimeStr = curTimeEl.textContent;
  const curTimeSec = getTimeInSeconds(curTimeStr);
  const videoId = new URL(location.href).searchParams.get("v");

  // Default to showing "Mark"
  let showState = "mark";

  // Check cached timestamps for overlap ±2 seconds
  for (const item of cachedYoutubeMarks) {
    if (item.id === videoId) {
      const markedSec = getTimeInSeconds(item.currentTime);
      if (Math.abs(markedSec - curTimeSec) <= 2) {
        showState = "marked";
        break;
      }
    }
  }

  renderButton(showState);
}, 1000);

// ✅ Step 5: When the button is clicked, add or reject marker
document.addEventListener("click", (event) => {
  if (event.target.id === "new-button") {
    const curTimeEl = document.querySelector(".ytp-time-current");
    const titleEl = document.querySelector(
      ".title.ytd-video-primary-info-renderer"
    );
    const durationEl = document.querySelector(".ytp-time-duration");
    if (!curTimeEl || !titleEl || !durationEl) return;

    // Gather current video details
    const curTimeStr = curTimeEl.textContent;
    const curTimeSec = getTimeInSeconds(curTimeStr);
    const videoTitle = titleEl.textContent;
    const videoDuration = durationEl.textContent;
    const videoId = new URL(location.href).searchParams.get("v");

    const newEntry = {
      title: videoTitle,
      currentTime: curTimeStr,
      duration: videoDuration,
      id: videoId,
    };

    // Check for existing entries within ±2 seconds
    const overlap = cachedYoutubeMarks.some((item) => {
      return (
        item.id === videoId &&
        Math.abs(getTimeInSeconds(item.currentTime) - curTimeSec) <= 2
      );
    });

    if (!overlap) {
      renderButton("done"); // Immediate feedback
      setTimeout(() => renderButton("marked"), 2000);

      // Save to cache and then to chrome.storage
      cachedYoutubeMarks.push(newEntry);
      chrome.storage.local.set({ youtube: cachedYoutubeMarks });
    } else {
      renderButton("alreadyMarked"); // Respect existing marker
      setTimeout(() => renderButton("mark"), 2000);
    }
  }
});
