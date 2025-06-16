// *************************** Global Variables and Constants *************************** //

let youtubeDropdown = false;
let docsDropdown = false;
let websitesDropdown = false;

let dropDownIcon = document.createElement("img");
dropDownIcon.id = "dropdownIcon";

// *************************** Utility Functions *************************** //

// Function to Render the layout
function renderLayout(result, keepDropdownState = youtubeDropdown) {
  const notesContainer = document.querySelector("#notesContainer");

  if (result.youtube && result.youtube.length > 0) {
    youtubeDropdown = keepDropdownState;

    // Get rid of any existing layouts
    notesContainer.innerHTML = "";
    // also get rid of any prev starter Message
    document.querySelector("#spanEl")?.remove();

    // add the new one
    notesContainer.innerHTML = `
  <div id="youtubeNotesContainer" >
  <div id="youtubeNotesHeader">
  <h2 id="youtubeHeaderText">Markers from Youtube</h2>
  </div>
  </div>
  `;

    // To BE implemented later
    temp = `
    <div id="docsNotesContainer">
      <p>Documents Markers to be implemented later</p>
    </div>
    <div id="websiteNotesContainer">
      <p>Website Markers to be implemented later</p>
    </div>`;

    // NOW we can safely render the cards (DOM is ready)
    renderCards(result);

    renderDropDownIcon();
  } else {
    starterMessage();
  }
}

// Function to Render the DropDown Icon and its functionality
function renderDropDownIcon() {
  const cardElements = document.querySelectorAll(".cards");
  const youtubeNotesHeader = document.querySelector("#youtubeNotesHeader");

  if (youtubeDropdown) {
    dropDownIcon.src = "icons/arrow-expand2.png";

    cardElements.forEach((card) => {
      card.style.display = "flex"; // Show all cards when expanded
      card.style.transition = "all 0.3s ease"; // Smooth transition effect
    });
  } else {
    dropDownIcon.src = "icons/arrow-collapsed2.png";

    cardElements.forEach((card) => {
      card.style.display = "none"; // hide
      card.style.transition = "all 0.3s ease"; // Smooth transition effect
    });
  }

  youtubeNotesHeader.prepend(dropDownIcon);
}

// Function to toggle the dropdown menu
function toggleDropdown(dropdownType) {
  if (dropdownType === "youtube") {
    youtubeDropdown = !youtubeDropdown;
    chrome.storage.local.set({ youtubeDropdown }); // saving for stay after session too
  } else if (dropdownType === "docs") {
    docsDropdown = !docsDropdown;
  } else if (dropdownType === "websites") {
    websitesDropdown = !websitesDropdown;
  }
}

// Function to Render the Cards
function renderCards(result) {
  // Clear existing cards to prevent duplicates

  const youtubeNotesContainer = document.querySelector(
    "#youtubeNotesContainer"
  );
  const existingCards = youtubeNotesContainer.querySelectorAll(".cards");

  existingCards.forEach((card) => card.remove());

  if (result.length !== 0) {
    result.youtube.forEach((video) => {
      const cardElement = document.createElement("div");
      cardElement.id = "card";
      cardElement.className = "cards";
      cardElement.dataset.id = video.id; // Store video ID in the dataset for easy access

      const currentTimeInSeconds = getTimeInSeconds(video.currentTime);
      const title = video.title.slice(0, 26); // Limit title to 26 characters

      cardElement.dataset.time = currentTimeInSeconds; // Store current time in seconds

      // Set the inner HTML of the card element
      cardElement.innerHTML = `
    <img src="https://img.youtube.com/vi/${video.id}/default.jpg" id="thumbnail" alt="Video Thumbnail">
    <div>
      <h3>${title}...</h3>
     <div>
       <p><strong>${video.currentTime} / </strong>${video.duration}</p>
      <div class="tooltip">
       <img src="icons/delete-bin.png" class="deleteBtn" alt="delete Marker" />
        <span class="tooltiptextDelBtn">Delete Marker</span>
      </div>
     </div>
    </div>
    <div class="tooltip">
           <img src="icons/go-to-3.png" class="goTo" alt="go to icon">
           <span class="tooltiptextGoToBtn">Go to video</span>
    </div>
            
           `;

      // Append the new card to the container
      youtubeNotesContainer.appendChild(cardElement);

      // adding click event listener to goTo button in each card
      const goToButton = cardElement.querySelector(".goTo");

      goToButton.addEventListener("click", (event) => {
        const card = event.target.closest(".cards");

        const time = card.dataset.time; // Get the time in seconds from the dataset
        const videoId = card.dataset.id; // Get the video ID from the dataset

        window.open(
          `https://www.youtube.com/watch?v=${videoId}&t=${time}s`,
          "_blank"
        );
      });
    });
  }
}

// Function to Render StarterMessage
function starterMessage() {
  const notesContainer = document.querySelector("#notesContainer");
  const divEl = document.createElement("div");
  divEl.id = "starterMessage";

  divEl.innerHTML = `
   
     <span  id="spanEl" > Add some Markers and watch them appear here..</span>    
     <div id="gettingStartedDiv"> 
      <p style="margin : 0" >New to Extension? 🤔</p>
      <a href="gettingStarted.pdf" target="_blank" id="StarterPdf" style="color:blue; text-decoration:none;" > Read this 📖</a>
     </div>
  `;

  // add new fresh child
  notesContainer.appendChild(divEl);
}

// Function to getVideoTime in Seconds
function getTimeInSeconds(string) {
  let parts = string.split(":");

  let timeInSec = 0;

  if (parts.length == 2) {
    // Format : minutes:seconds
    timeInSec = parseInt(parts[0] * 60 + parseInt(parts[1]));
  } else if (parts.length == 3) {
    // Format : hours:minutes:seconds
    timeInSec = parseInt(
      parts[0] * 3600 + parseInt(parts[1] * 60) + parseInt(parts[2])
    );
  }

  return timeInSec;
}

// *************************** Main Code Execution *************************** //

// Step 1 : Retrive All data from chrome.storage
chrome.storage.local.get(null, (result) => {
  // If a previous dropdown state is stored, use it
  youtubeDropdown = result.youtubeDropdown ?? true; // default: open

  // Initial render, which also calls renderDropDownIcon internally
  renderLayout(result, youtubeDropdown);

  // Add click event listener to the youtube header
  dropDownIcon.addEventListener("click", () => {
    toggleDropdown("youtube");

    // Hack for reRendering coz pure html does not reRender html on change (Libraries like React does)
    renderLayout(result, youtubeDropdown);
  });

  // Add click event listener to the delete button
  const deleteButtons = document.querySelectorAll(".deleteBtn");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const card = event.target.closest(".cards");
      const videoId = card.dataset.id; // Get the video ID from the dataset
      const currentTime = card.dataset.time; // Get the current time in seconds from the dataset

      // Remove the card from the DOM
      card.remove();

      // Remove the marker from storage
      result.youtube = result.youtube.filter(
        (item) => item.id !== videoId && item.currentTime !== currentTime
      );

      // Update the storage with the new data
      chrome.storage.local.set({ youtube: result.youtube }, () => {
        // Re-render the layout after deletion
        renderLayout(result, youtubeDropdown);
      });

      // If the youtube array is empty, show the starter message
      if (result.youtube.length === 0) {
        document.querySelector("#notesContainer").innerHTML = "";
        starterMessage();
      }
    });
  });
});
