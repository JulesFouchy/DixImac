const p5ForShaders = new p5( p => {
	p.setup = function() {
		p.createCanvas(500, 750, WEBGL)
		p.canvas.style = "display: none;"
	};

	p.drawShader = function(fragmentSource, rand) {
		p.background(0)
		const vertSrc = `attribute vec3 aPosition;
		attribute vec2 aTexCoord;
		
		varying vec2 vTexCoord;
		
		void main() {
		  vTexCoord = aTexCoord;
		
		  vec4 positionVec4 = vec4(aPosition, 1.0);
		  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
		
		  gl_Position = positionVec4;
		}`
		const myShader = new p5.Shader(p._renderer, vertSrc, fragmentSource)
		p.shader(myShader)
		myShader.setUniform('u_rand', rand)
		p.rect(-width/2, -height/2, width, height)
	}
})

function setup() {
	document.getElementById("defaultCanvas0").style = "display: none;"
}

imageFromP5script = (scriptStr, seed) => {
	createCanvas(500, 750)
	background(0)
	randomSeed(seed)
	eval(scriptStr)

	const oCanvas = document.getElementById("defaultCanvas0")
	const data = oCanvas.toDataURL("image/png")
	oCanvas.remove()
	return data
}

imageFromFragmentShader = (fragmentSource, rand) => {
	p5ForShaders.drawShader(fragmentSource, rand)
	return p5ForShaders.canvas.toDataURL("image/png")
}