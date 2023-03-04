#version 300 es

layout(location = 0) in vec4 pPosVel;
layout(location = 1) in vec4 pC;

uniform vec2 u_gridRes;

out vec4 v_pPosVel;
out mat2 v_pC;

void main() {
    v_pPosVel = pPosVel;
    v_pC = mat2(pC); // (xy,zw)=(c0,c1)

    gl_Position = vec4(2. * ((floor(v_pPosVel.xy) + 0.5) / u_gridRes) - 1., 0., 1.);
    gl_PointSize = 3.0;
}
