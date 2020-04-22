function setup() {
	document.getElementById("defaultCanvas0").style = "display: none;"
}

imageFromP5script = (scriptStr, seed) => {
	createCanvas(500, 750)
	const oCanvas = document.getElementById("defaultCanvas0")
	oCanvas.style = "display: none;"
	background(0)
	randomSeed(seed)
	eval(scriptStr)
	const data = oCanvas.toDataURL("image/png")
	oCanvas.remove()
	return data
}