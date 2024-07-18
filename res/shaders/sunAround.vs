varying vec2 v_uv;
varying vec3 v_position;
varying vec3 v_worldPosition;
varying vec3 v_normal;
varying vec3 v_worldNormal;
varying float radial;

uniform vec3 u_bboxMin;
uniform vec3 u_bboxMax;

void main() {

    radial = (position.y - u_bboxMin.y) / (u_bboxMax.y - u_bboxMin.y);

    v_uv = uv;
    v_normal = normal;
    v_position = position;
    v_worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    v_worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);

    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
}