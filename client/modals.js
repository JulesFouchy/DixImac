{
    const modals = document.getElementsByClassName("modal")
    // Close Button
    const closeButtons = document.getElementsByClassName("close")
    for (let i = 0; i < closeButtons.length; ++i) {
        closeButtons[i].onclick = () => {
            modals[i].style.display = "none";
        }
    }
    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.className === "modal") {
            for (let i = 0; i < modals.length; ++i) {
                modals[i].style.display = "none";
            }
        }
    }
}

const openModal = (id) => {
    document.getElementById(id).style.display = "block"
}