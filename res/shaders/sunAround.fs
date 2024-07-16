varying vec2 v_uv;
varying vec3 v_position;
varying vec3 v_worldPosition;

varying float radial;

uniform float u_time;
// uniform sampler2D u_textures[6];

vec3 brightnessToColor(float b)
{
	b += 0.2;
	b *= 0.8 + 0.7;
	return vec3(b, b*b*b, b*b*b*b*b);
}

void main() {
	//vec3 color = texture2D( u_textures[1], vUv ).rgb;

	//vec3 color = vec3(v_position.z, 0.0, 0.0);
	
	vec3 color1 = vec3(0.0);
	vec3 color2 = vec3(1.0,0.0,0.0);
	vec3 color = mix(color1, color2, radial);
	gl_FragColor = vec4(color, 1.0);
}