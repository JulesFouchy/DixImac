precision mediump float;

varying vec2 vTexCoord;
uniform float u_rand; // random number between 0 and 1

void main() {
    vec2 uv = vTexCoord;   // 0 to 1 on both axis
    uv.y *= 1.5;           // same unit on both axis ; 1 unit corresponds to the width of the card (a.k.a. the smaller side)
    uv -= vec2(0.5, 0.75); // center the origin
    uv *= 2.;              // I prefer having 1 as the radius that would perfectly fit rather than 0.5
    
    gl_FragColor = vec4(vec3(uv, 0.), 1.0);
}