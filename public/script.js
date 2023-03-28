async function loadImages(images, redirect1, redirect2, text) {
    const response = await axios.get("/random_project.json");
    images.src = response.data.cover.smaller_square_image_url;
    redirect1.href = response.data.permalink;
    redirect2.href = response.data.permalink;
    text.innerHTML = response.data.user.username + " - " + response.data.title;
}

async function initialisation() {
    const images = document.getElementsByClassName("pic");
    const redirect1 = document.getElementsByClassName("redirect1");
    const redirect2 = document.getElementsByClassName("redirect2");
    const text = document.getElementsByClassName("text");

    for (let i = 0; i < images.length; i++) {
        images[i].src = "small_square.png";
    }

    for (i = 0; i < images.length; i++) {
        loadImages(images[i], redirect1[i], redirect2[i], text[i]);
    }
}

const card = $("#model");

const randomButton = $("#randomButton");

randomButton.on("click", () => {
    initialisation();
})

function containersBuilder() {
    for (let i = 0; i < 20; i++) {
        $("#contain").append($(card.html()));
    }

    initialisation();
}

window.onload = containersBuilder;
