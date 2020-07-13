const setBgDaytime = (containerName, bWithBoat) => {
    const el = document.getElementsByClassName(containerName)[0]
    console.log("gfyrd")
    if (bWithBoat) {
        el.classList.add("bg-night-boat")
    }
    else {
        el.classList.add("bg-dawn")
    }
}