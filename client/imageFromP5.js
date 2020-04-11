let oCanvas

function setup() {
	createCanvas(500, 750)
	oCanvas = document.getElementById("defaultCanvas0")
}

imageFromP5script = (scriptStr, seed) => {
	background(0)
	randomSeed(seed)
	eval(scriptStr)
	return oCanvas.toDataURL("image/png")
}