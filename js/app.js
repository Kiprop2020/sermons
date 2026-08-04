const API_URL = "https://script.google.com/macros/s/AKfycbw0ih9peIYxyE7tswYVkJ38VHuBcAwLHDgtCfSZq74OcQ3ixL8rP0ErutO77iotB1ISgA/exec";

const R2_BASE_URL =
    "https://pub-bed1fd7129114b8ab6b0a92c70e3e003.r2.dev";


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

        displayFeaturedSermon(sermons[0]);

        displayRecentSermons(sermons);

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

            <p class="date">
                ${sermon.date}
            </p>

            <h3>
                ${sermon.title}
            </h3>

            <p>
                ${sermon.preacher}
            </p>

            <p>
                ${sermon.bibleBook}
                ${sermon.passage}
            </p>

            <audio
                class="sermon-player"
                controls
                preload="metadata">

                <source
                    src="${audioUrl}"
                    type="audio/mpeg">

                Your browser does not support audio playback.

            </audio>

            <div class="buttons">

                <a
                    href="${audioUrl}"
                    class="button secondary"
                    download>

                    <span class="button-icon download-icon">
                        ↓
                    </span>

                    Download

                </a>

            </div>

        </div>

    `;

}


/* ========================================
   RECENT SERMONS
======================================== */

function displayRecentSermons(sermons) {

    const container =
        document.getElementById("sermon-list");

    if (!sermons.length) {

        container.innerHTML =
            "<p>No sermons available.</p>";

        return;

    }

    container.innerHTML = "";

    sermons.forEach(function(sermon) {

        const card = document.createElement("div");

        card.className = "sermon-card";

        card.innerHTML = `

            <div>

                <h3>
                    ${sermon.title}
                </h3>

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

        `;

        container.appendChild(card);

    });

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

loadSermons();