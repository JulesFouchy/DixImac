const setBgDaytime = (containerName, bWithBoat) => {
    const el = document.getElementsByClassName(containerName)[0]
    const hour = new Date().getHours()
    if (hour >= 22 || hour <= 4)
        el.classList.add(bWithBoat ? "bg-night-boat" : "bg-night")
    else if (hour <= 8)
        el.classList.add(bWithBoat ? "bg-dawn-boat" : "bg-dawn")
    else if (hour <= 19)
        el.classList.add(bWithBoat ? "bg-day-boat" : "bg-day")
    else
        el.classList.add(bWithBoat ? "bg-dusk-boat" : "bg-dusk")
}