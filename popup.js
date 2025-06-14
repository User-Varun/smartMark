// *************************** Global Variables and Constants *************************** //

let youtubeDropdown = false;
let docsDropdown = false;
let websitesDropdown = false;

let dropDownIcon = document.createElement("img");
dropDownIcon.id = "dropdownIcon";

const YoutubeNotesContainer = document.getElementById("youtubeNotesContainer");

// *************************** Utility Functions *************************** //

// Function to toggle the dropdown menu
function toggleDropdown(dropdownType) {
  if (dropdownType === "youtube") {
    youtubeDropdown = !youtubeDropdown;
  } else if (dropdownType === "docs") {
    docsDropdown = !docsDropdown;
  } else if (dropdownType === "websites") {
    websitesDropdown = !websitesDropdown;
  }
}

// Function to Render the Cards
function renderCards(result) {
  // Clear existing cards to prevent duplicates
  const existingCards = YoutubeNotesContainer.querySelectorAll(".cards");

  existingCards.forEach((card) => card.remove());

  result.youtube.forEach((video) => {
    const cardElement = document.createElement("div");
    cardElement.id = "card";
    cardElement.className = "cards";
    cardElement.dataset.id = video.id; // Store video ID in the dataset for easy access

    const title = video.title.slice(0, 26); // Limit title to 26 characters

    cardElement.innerHTML = `
           <img src="https://img.youtube.com/vi/${video.id}/default.jpg" id="thumbnail" alt="Video Thumbnail">
           <div>
            <h3>${title}...</h3>
            <p><strong>${video.currentTime} / </strong>${video.duration}</p>
          </div>
           <div class="tooltip">
           <img src="icons/go-to.png" class="goTo" alt="go to icon">
           <span class="tooltiptext">Go to video</span>
           </div>
            
        `;

    // adding click event listener to goTo button in each card
    const goToButton = cardElement.querySelector(".goTo");

    goToButton.addEventListener("click", (event) => {
      const card = event.target.closest(".cards");

      console.log(card);
    });

    // Append the new card to the container
    YoutubeNotesContainer.appendChild(cardElement);

    // Add click event listener to the card to open the video in a new tab
    const button = cardElement.querySelector(".goTo");

    button.addEventListener("click", () => {
      const videoId = cardElement.dataset.id; // Get the video ID from the dataset
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      window.open(videoUrl, "_blank"); // Open the video in a new tab
    });
  });
}

// Function to Render the DropDown Icon and its functionality
function renderDropDownIcon() {
  const cardElements = document.querySelectorAll(".cards");

  if (youtubeDropdown) {
    dropDownIcon.src = "icons/arrow-expand.png";

    cardElements.forEach((card) => {
      card.style.display = "flex"; // Show all cards when expanded
      card.style.transition = "all 0.3s ease"; // Smooth transition effect
    });
  } else {
    dropDownIcon.src = "icons/arrow-collapsed.png";

    cardElements.forEach((card) => {
      card.style.display = "none"; // hide
      card.style.transition = "all 0.3s ease"; // Smooth transition effect
    });
  }

  youtubeNotesHeader.prepend(dropDownIcon);
}

// *************************** Main Code Execution *************************** //

// Step 1 : Retrive All data from chrome.storage
chrome.storage.local.get(null, (result) => {
  // Initial Render for DropDown
  renderDropDownIcon();

  // Add click event listener to the dropdown icon
  dropDownIcon.addEventListener("click", () => {
    toggleDropdown("youtube");

    // Hack for reRendering coz pure html does not reRender html on change (Libraries like React does)
    renderCards(result);
    renderDropDownIcon();
  });
});
