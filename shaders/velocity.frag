#version 300 es

precision highp float;

uniform sampler2D tex; // .x:P, .y:b
uniform vec2 u_gridRes;
uniform float u_dt;

out vec4 o;

void main() {
    float e = texture(tex, (gl_FragCoord.xy + vec2(1, 0)) / u_gridRes).x;
    float w = texture(tex, (gl_FragCoord.xy + vec2(-1, 0)) / u_gridRes).x;
    float n = texture(tex, (gl_FragCoord.xy + vec2(0, 1)) / u_gridRes).x;
    float s = texture(tex, (gl_FragCoord.xy + vec2(0, -1)) / u_gridRes).x;
    vec4 c = texture(tex, gl_FragCoord.xy / u_gridRes);

    vec2 vel = -0.5 * vec2(e - w, n - s) * u_dt;

    float wE = texture(tex, (gl_FragCoord.xy + vec2(1, 0)) / u_gridRes).w;
    float wW = texture(tex, (gl_FragCoord.xy + vec2(-1, 0)) / u_gridRes).w;
    float wN = texture(tex, (gl_FragCoord.xy + vec2(0, 1)) / u_gridRes).w;
    float wS = texture(tex, (gl_FragCoord.xy + vec2(0, -1)) / u_gridRes).w;

    // if (wE == 3.) vel.x = -(c.x - w) * u_dt;
    // if (wW == 3.) vel.x = -(e - c.x) * u_dt;
    // if (wN == 3.) vel.y = -(c.x - s) * u_dt;
    // if (wS == 3.) vel.y = -(n - c.x) * u_dt;

    // float mE = texture(tex, (gl_FragCoord.xy + vec2(1, 0)) / u_gridRes).z;
    // float mW = texture(tex, (gl_FragCoord.xy + vec2(-1, 0)) / u_gridRes).z;
    // float mN = texture(tex, (gl_FragCoord.xy + vec2(0, 1)) / u_gridRes).z;
    // float mS = texture(tex, (gl_FragCoord.xy + vec2(0, -1)) / u_gridRes).z;
    //vel = -0.5 * vec2(e - w, n - s) * u_dt;

    // if (texture(tex, (gl_FragCoord.xy + vec2(1, 0)) / u_gridRes).z == 0.)
    //     vel.x = -(c.x - w) * u_dt;
    // if (texture(tex, (gl_FragCoord.xy + vec2(-1, 0)) / u_gridRes).z == 0.)
    //     vel.x = -(e - c.x) * u_dt;
    // if (texture(tex, (gl_FragCoord.xy + vec2(0, 1)) / u_gridRes).z == 0.)
    //     vel.y = -(c.x - s) * u_dt;
    // if (texture(tex, (gl_FragCoord.xy + vec2(0, -1)) / u_gridRes).z == 0.)
    //     vel.y = -(n - c.x) * u_dt;

    if (gl_FragCoord.x < 2.) vel = vec2(0);
    if (gl_FragCoord.x > u_gridRes.x - 2.) vel = vec2(0);
    if (gl_FragCoord.y < 2.) vel = vec2(0);
    if (gl_FragCoord.y > u_gridRes.y - 2.) vel = vec2(0);

    float m = texture(tex, gl_FragCoord.xy / u_gridRes).z;
    o = vec4(vel, 0, 0);
}