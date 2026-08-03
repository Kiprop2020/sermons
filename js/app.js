const API_URL = "https://script.google.com/macros/s/AKfycbw0ih9peIYxyE7tswYVkJ38VHuBcAwLHDgtCfSZq74OcQ3ixL8rP0ErutO77iotB1ISgA/exec";


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

    }

    catch (error) {

        console.error(
            "Unable to load sermons:",
            error
        );

    }

}


loadSermons();