let oCanvas

function setup() {
	createCanvas(500, 750)
	oCanvas = document.getElementById("defaultCanvas0")
}

imageFromP5script = (scriptStr, seed) => {
	background(200, 15, 60)
	return oCanvas.toDataURL("image/png")
}