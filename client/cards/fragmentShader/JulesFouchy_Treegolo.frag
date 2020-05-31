precision mediump float;

varying vec2 vTexCoord;
uniform float u_rand; // random number between 0 and 1

const vec2 u_Begin = vec2(0., 0.);
const float u_Scale = 0.149;
const int u_NbIter = 17;
const float u_Width = 0.089;
const float u_Height = 1.271;
const float u_smoothMinPow = 10.;
const float u_GlowRadius = 0.001;
const float u_ScaleAmount = 0.869;
const vec3 u_GlowColor = vec3(0.861, 0.163, 0.163);
const vec3 u_ColorTrunk = vec3(0.816, 0.618, 0.109);
const vec3 u_ColorLeaves = vec3(0.861, 0.163, 0.163);

float smoothMin( float a, float b)
{
    float res = exp2( -u_smoothMinPow*a ) + exp2( -u_smoothMinPow*b );
    return -log2( res )/u_smoothMinPow;
}

float TAU = 6.28;

vec2 fromAngle(float theta){
	return vec2(cos(theta), sin(theta));
}

vec2 rotate( vec2 v, float theta ){
	float c = cos(theta);
	float s = sin(theta);
	return vec2( c*v.x - s*v.y, s*v.x + c*v.y);
}

float rectangleSDF( vec2 uv ){
	return max(abs(uv.x) - u_Width, abs(uv.y) - u_Height);
}

float treeSDF( vec2 uv, out int iterMinReached ){
  float u_Angle = u_rand;
	float minDist = rectangleSDF(uv);
	iterMinReached = 0;

	for (int i = 0; i < u_NbIter; ++i){
		uv.y -= u_Height;
		if( uv.x < 0.)
			uv = rotate(uv, -u_Angle);
		else
			uv = rotate(uv, u_Angle);
		uv /= u_ScaleAmount;

		float newDist = rectangleSDF(uv);
		if( newDist < minDist ){
			iterMinReached = i;
		}
		minDist = smoothMin(newDist, minDist);
	}

	return minDist;
}

void main() {
	vec2 uv = (vTexCoord - vec2(0.5, 0.27)) * 10.;
    uv.y *= 1.5;
	vec3 color;

	int iterMinReached;
	float d = treeSDF( uv, iterMinReached );

	color = mix(u_ColorTrunk, u_ColorLeaves, float(iterMinReached) / float(u_NbIter));
	float glow = smoothstep(u_GlowRadius, 0., d);
	float alpha = d < 0. ? 1. : glow ;
	if( glow < 0.99999 ){
		color += u_GlowColor;
	}
    color = mix(color, vec3(0.5, 0.2, 0.9), alpha);
	gl_FragColor = vec4(color,1.);
}