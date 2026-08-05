const API_URL = "https://script.google.com/macros/s/AKfycbw0ih9peIYxyE7tswYVkJ38VHuBcAwLHDgtCfSZq74OcQ3ixL8rP0ErutO77iotB1ISgA/exec";

const R2_BASE_URL =
    "https://pub-bed1fd7129114b8ab6b0a92c70e3e003.r2.dev";


/* ========================================
   GLOBAL SERMON DATA
======================================== */

let allSermons = [];

let featuredSermon = null;

let searchTerm = "";

let displayedSermonsCount = 10;

const sermonsPerLoad = 10;


/* ========================================
   LOAD SERMONS
======================================== */

async function loadSermons() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {

            throw new Error(
                `HTTP error: ${response.status}`
            );

        }

        const sermons = await response.json();

        console.log("Sermons received:", sermons);

        // Store all sermons
        allSermons = sermons;

        // The first sermon is the featured sermon
        featuredSermon = sermons[0];

        // Display the featured sermon
        displayFeaturedSermon(featuredSermon);

        // Populate Year selector
        populateYearFilter(sermons);

        // Display all sermons except the featured sermon
        displayRecentSermons(
            sermons.slice(1)
        );

        // Activate filters
        setupFilters();
        setupSearch();

    }

    catch (error) {

        console.error(
            "Unable to load sermons:",
            error
        );

        showError();

    }

}


/* ========================================
   DATE HELPER
======================================== */

function getSermonDate(dateValue) {

    if (!dateValue) {
        return null;
    }

    // If the API gives us an actual Date object
    if (dateValue instanceof Date) {
        return dateValue;
    }

    const value = String(dateValue).trim();

    // Try normal JavaScript date parsing first
    const parsed = new Date(value);

    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    return null;

}

/* ========================================
   FORMAT DATE FOR DISPLAY
======================================== */

function formatSermonDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date = getSermonDate(dateValue);

    if (!date) {
        return String(dateValue).split("T")[0];
    }

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

}


/* ========================================
   POPULATE YEAR FILTER
======================================== */

function populateYearFilter(sermons) {

    const yearFilter =
        document.getElementById("year-filter");

    if (!yearFilter) {
        return;
    }

    const years = [];

    sermons.forEach(function(sermon) {

        const date =
            getSermonDate(sermon.date);

        if (date) {

            const year =
                date.getFullYear();

            if (!years.includes(year)) {

                years.push(year);

            }

        }

    });

    // Newest year first
    years.sort(function(a, b) {
        return b - a;
    });

    // Keep All Years option
    yearFilter.innerHTML = `
        <option value="all">
            All Years
        </option>
    `;

    years.forEach(function(year) {

        const option =
            document.createElement("option");

        option.value = year;
        option.textContent = year;

        yearFilter.appendChild(option);

    });

}


/* ========================================
   FILTER SETUP
======================================== */

function setupFilters() {

    const yearFilter =
        document.getElementById("year-filter");

    const monthFilter =
        document.getElementById("month-filter");

    if (!yearFilter || !monthFilter) {
        return;
    }

    yearFilter.addEventListener(
        "change",
        applyFilters
    );

    monthFilter.addEventListener(
        "change",
        applyFilters
    );

}


/* ========================================
   APPLY YEAR + MONTH FILTERS
======================================== */

function applyFilters() {

    const yearFilter =
        document.getElementById("year-filter");

    const monthFilter =
        document.getElementById("month-filter");

    const selectedYear =
        yearFilter.value;

    const selectedMonth =
        monthFilter.value;


    const filteredSermons =
        allSermons.filter(function(sermon) {

            // Do not show the featured sermon in Recent Sermons
            if (
                featuredSermon &&
                sermon.fileId === featuredSermon.fileId
            ) {
                return false;
            }

            const date =
                getSermonDate(sermon.date);

            if (!date) {
                return false;
            }

            const sermonYear =
                date.getFullYear();

            // JavaScript months are 0-11
            // Our dropdown uses 1-12
            const sermonMonth =
                date.getMonth() + 1;


            const yearMatches =
                selectedYear === "all" ||
                sermonYear === Number(selectedYear);


            const monthMatches =
                selectedMonth === "all" ||
                sermonMonth === Number(selectedMonth);

            /*Search*/
            
            const searchableText = `

                ${sermon.title || ""}
                
                ${sermon.preacher || ""}

                ${sermon.bibleBook || ""}

                ${sermon.passage || ""}

            `.toLowerCase();


            const searchMatches = 
                searchTerm === "" ||
                searchableText.includes(searchTerm);


            return (
                yearMatches &&
                monthMatches &&
                searchMatches
            );

        });


    displayRecentSermons(filteredSermons);

}


/* ========================================
   FEATURED SERMON
======================================== */

function displayFeaturedSermon(sermon) {

    const container =
        document.getElementById("featured-sermon");

    if (!sermon) {

        container.innerHTML =
            "<p>No sermon available.</p>";

        return;

    }

    const audioUrl =
        `${R2_BASE_URL}/${encodeURIComponent(sermon.fileId)}`;

    container.innerHTML = `

        <div class="featured-content">

    <div class="featured-main">

        <div class="featured-info">

            <h3>
                ${sermon.title}
            </h3>

            <p class="sermon-date">
                ${formatSermonDate(sermon.date)}
            </p>

            <p>

                ${sermon.preacher}

                <span class="separator">
                    •
                </span>

                ${sermon.bibleBook}

                ${sermon.passage}

            </p>

        </div>

        <button
            class="play-button"
            aria-label="Play ${sermon.title}">

            ▶

        </button>

    </div>

            <div class="sermon-player-container">

                <audio
                    class="sermon-player"
                    controls
                    preload="metadata">

                    <source
                        src="${audioUrl}"
                        type="audio/mpeg">

                    Your browser does not support audio playback.

                </audio>

                <button
                    class="rewind-button"
                    type="button">

                    ↶ 10s

                </button>

                <a
                    href="${audioUrl}"
                    class="download-link"
                    download>

                    ↓ Download

                </a>

            </div>

        </div>

    `;


    /* --------------------------------
       GET CONTROLS
    -------------------------------- */

    const playButton =
        container.querySelector(".play-button");

    const playerContainer =
        container.querySelector(
            ".sermon-player-container"
        );

    const featuredAudio =
        container.querySelector(".sermon-player");

    const rewindButton =
        container.querySelector(".rewind-button");


    /* --------------------------------
       PLAY BUTTON
    -------------------------------- */

    playButton.addEventListener(
        "click",
        function() {

            playerContainer.classList.toggle(
                "visible"
            );


            if (
                playerContainer.classList.contains(
                    "visible"
                )
            ) {

                featuredAudio.play();

                playButton.textContent = "❚❚";

                playButton.setAttribute(
                    "aria-label",
                    "Pause " + sermon.title
                );

            }

            else {

                featuredAudio.pause();

                playButton.textContent = "▶";

                playButton.setAttribute(
                    "aria-label",
                    "Play " + sermon.title
                );

            }

        }
    );


    /* --------------------------------
       AUDIO PLAY
    -------------------------------- */

    featuredAudio.addEventListener(
        "play",
        function() {

            // Pause every other sermon player
            document
                .querySelectorAll(".sermon-player")
                .forEach(function(otherAudio) {

                    if (otherAudio !== featuredAudio) {

                        otherAudio.pause();

                    }

                });


            playButton.textContent = "❚❚";

            playButton.classList.add(
                "playing"
            );

        }
    );


    /* --------------------------------
       AUDIO PAUSE
    -------------------------------- */

    featuredAudio.addEventListener(
        "pause",
        function() {

            playButton.textContent = "▶";

            playButton.classList.remove(
                "playing"
            );

            if (!featuredAudio.seeking) {

                playerContainer.classList.remove(
                    "visible"
                );

            }

        }
    );

    rewindButton.addEventListener(
        "click",
        function() {

            featuredAudio.currentTime =
                Math.max(
                    0,
                    featuredAudio.currentTime - 10
                );

        }
    );

}

/* ========================================
   RECENT SERMONS
======================================== */

function displayRecentSermons(sermons) {

    const container =
        document.getElementById("sermon-list");

    if (!sermons.length) {

        container.innerHTML =
            "<p>No sermons found for the selected period.</p>";

        return;

    }

    container.innerHTML = "";

    // Determine how many sermons to display
    const sermonsToDisplay =
        sermons.slice(0, displayedSermonsCount);


    sermonsToDisplay.forEach(function(sermon) {

        const card =
            document.createElement("div");

        card.className = "sermon-card";

        const audioUrl =
            `${R2_BASE_URL}/${encodeURIComponent(sermon.fileId)}`;

        card.innerHTML = `

            <div class="sermon-info">

                <h3>
                    ${sermon.title}
                </h3>

                <p class="sermon-date">
                    ${formatSermonDate(sermon.date)}
                </p>

                <p>

                    ${sermon.preacher}

                    <span class="separator">
                        •
                    </span>

                    ${sermon.bibleBook}

                    ${sermon.passage}

                </p>

            </div>

            <button
                class="play-button"
                aria-label="Play ${sermon.title}">

                ▶

            </button>

            <div class="sermon-player-container">

                <audio
                    class="sermon-player"
                    controls
                    preload="metadata">

                    <source
                        src="${audioUrl}"
                        type="audio/mpeg">

                    Your browser does not support audio playback.

                </audio>

                <button
                    class="rewind-button"
                    type="button">

                    ↶ 10s

                </button>

                <a
                    href="${audioUrl}"
                    class="download-link"
                    download>

                    ↓ Download

                </a>

            </div>

        `;


        container.appendChild(card);


        const playButton =
            card.querySelector(".play-button");


        const playerContainer =
            card.querySelector(".sermon-player-container");


        const audio =
            card.querySelector("audio");

        const rewindButton =
            card.querySelector(".rewind-button");

        /* --------------------------------
           PLAY BUTTON
        -------------------------------- */

        playButton.addEventListener(
            "click",
            function() {

                playerContainer.classList.toggle(
                    "visible"
                );


                if (
                    playerContainer.classList.contains(
                        "visible"
                    )
                ) {

                    audio.play();

                    playButton.textContent = "❚❚";

                    playButton.setAttribute(
                        "aria-label",
                        "Pause " + sermon.title
                    );

                }

                else {

                    audio.pause();

                    playButton.textContent = "▶";

                    playButton.setAttribute(
                        "aria-label",
                        "Play " + sermon.title
                    );

                }

            }
        );


        /* --------------------------------
           AUDIO PLAY
        -------------------------------- */

        audio.addEventListener(
            "play",
            function() {

                // Pause any other sermon playing
                document
                    .querySelectorAll(".sermon-player")
                    .forEach(function(otherAudio) {

                        if (otherAudio !== audio) {

                            otherAudio.pause();

                        }

                    });


                playButton.textContent = "❚❚";

                playButton.classList.add(
                    "playing"
                );

            }
        );


        /* --------------------------------
           AUDIO PAUSE
        -------------------------------- */

        audio.addEventListener(
            "pause",
            function() {

                playButton.textContent = "▶";

                playButton.classList.remove(
                    "playing"
                );

                // Keep the player visible when the user
                // is interacting with the HTML5 controls.
                if (!audio.seeking) {

                    playerContainer.classList.remove(
                        "visible"
                    );

                }

            }
        );

        rewindButton.addEventListener(
            "click",
            function() {

                audio.currentTime =
                    Math.max(
                        0,
                        audio.currentTime - 10
                    );

            }
        );

    });

        // Add Load More button if there are more sermons
    if (sermons.length > displayedSermonsCount) {

        const loadMoreButton =
            document.createElement("button");

        loadMoreButton.className =
            "load-more-button";

        loadMoreButton.textContent =
            "Load More";

        loadMoreButton.addEventListener(
            "click",
            function() {

                displayedSermonsCount += sermonsPerLoad;

                displayRecentSermons(sermons);

            }
        );

        container.appendChild(loadMoreButton);

    }

}

/* ========================================
   ERROR
======================================== */

function showError() {

    const featured =
        document.getElementById("featured-sermon");

    const sermons =
        document.getElementById("sermon-list");


    featured.innerHTML = `
        <p>
            We couldn't load the latest sermon.
            Please try again later.
        </p>
    `;


    sermons.innerHTML = `
        <p>
            We couldn't load the sermons.
            Please try again later.
        </p>
    `;

}


/* ========================================
   START
======================================== */

/* ========================================
   SEARCH
======================================== */

function setupSearch() {

    const searchToggle =
        document.querySelector(".search-toggle");

    const searchContainer =
        document.querySelector(".search-container");

    const searchInput =
        document.getElementById("search-input");


    if (!searchToggle || !searchContainer || !searchInput) {
        return;
    }


    searchToggle.addEventListener("click", function() {

        const isVisible =
            searchContainer.classList.toggle("visible");

        searchToggle.setAttribute(
            "aria-expanded",
            isVisible
        );


        if (isVisible) {

            searchInput.focus();

        }

    });


    searchInput.addEventListener(
        "input",
        function() {

            searchTerm =
                searchInput.value.trim().toLowerCase();

            applyFilters();

            // Close search when search box is cleared
            if (searchTerm == "") {

                searchContainer.classList.remove("visible");

                searchToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );

}


loadSermons();