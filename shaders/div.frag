#version 300 es

precision highp float;

uniform sampler2D tex;
uniform sampler2D pressureTex;
uniform vec2 u_gridRes;
uniform float u_dt;

out vec4 o;

void main() {
    float E = texture(tex, (gl_FragCoord.xy + vec2(1, 0)) / u_gridRes).x;
    float W = texture(tex, (gl_FragCoord.xy + vec2(-1, 0)) / u_gridRes).x;
    float N = texture(tex, (gl_FragCoord.xy + vec2(0, 1)) / u_gridRes).y;
    float S = texture(tex, (gl_FragCoord.xy + vec2(0, -1)) / u_gridRes).y;
    vec4 c = texture(tex, gl_FragCoord.xy / u_gridRes);

    float div = -0.5 * (E - W + N - S) / u_dt;

    float a = 0.25*0.25*abs(c.x - 4.)*0.25*(c.z - 4.)/(u_dt*u_dt);

    if (a > 0.) div += a;
    else if (a < 0. && div > 0.)div = max(div+a, 0.);

    if (c.z <= 0.) div = 0.;

    o = vec4(texture(pressureTex, gl_FragCoord.xy / u_gridRes).x,div,c.z,c.w);
}
