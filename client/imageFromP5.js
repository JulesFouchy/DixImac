
const baseURL = 'http://diximac.herokuapp.com/client/cards' // 'http://localhost:2000/client/cards'

const renderCard = ({fileName, fileFolder, generationMethod, sourceCode, seed}) => {
	const url = baseURL + '/' + fileFolder + '/' + fileName
    switch (generationMethod) {
        case 0: // static image file (jpeg/png/...)
            return url
        case 1: // p5 script
            const srcCode = sourceCode //|| (await axios.get(url)).data
            p5ForScripts.drawScript(srcCode, seed || Math.random()*10000000)
            return p5ForScripts.getfuData()
        case 2: // fragment shader
			const srcCode2 = sourceCode //|| (await axios.get(url)).data
            p5ForFragmentShaders.drawShader(srcCode2, seed || Math.random())
            return p5ForFragmentShaders.getfuData()
        default:
            return 'ERRRROR'
    }
}

const p5ForFragmentShaders = new p5( p => {
    p.setup = () => {
		p.createCanvas(500, 750, p.WEBGL)
		p.canvas.style = "display: none;"
		p.noLoop()
    }
    p.getfuData = () => p.canvas.toDataURL("image/png")
    p.drawShader = (fragmentSource, rand) => {
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
        p.rect(-p.width/2, -p.height/2, p.width, p.height)
    }
}, document.body)

const p5ForScripts = new p5( p => {
    p.setup = () => {
        p.createCanvas(500, 750)
		p.canvas.style = "display: none;"
		p.noLoop()
    }
    p.getfuData = () => p.canvas.toDataURL("image/png")
    p.drawScript = (scriptStr, rand) => {
        p.background(0)
        p.randomSeed(rand)
        eval(scriptStr)
    }
}, document.body)


function setup() {
	document.getElementById("defaultCanvas0").style = "display: none;"
	noLoop()
}