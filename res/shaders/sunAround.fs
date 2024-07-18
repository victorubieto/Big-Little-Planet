varying vec2 v_uv;
varying vec3 v_position;
varying vec3 v_worldPosition;
varying vec3 v_normal;
varying vec3 v_worldNormal;

varying float radial;

uniform float u_time;

vec3 brightnessToColor(float b)
{
	b *= 0.3 + 0.3;
	return vec3(b, b*b*b, b*b*b*b*b);
}

void main() {

	vec3 view_dir = normalize(v_worldPosition - cameraPosition);
	float gradient = pow(abs(dot(view_dir, v_worldNormal)), 2.0) * 2.3;
	
	vec3 color = brightnessToColor(gradient);

	gl_FragColor = vec4(color, gradient);
}