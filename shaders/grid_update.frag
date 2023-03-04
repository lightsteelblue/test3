#version 300 es

precision highp float;

uniform sampler2D u_gridTex;
uniform vec2 u_gridRes;
uniform vec2 u_gravity;
uniform float u_dt;

out vec4 o;

void main() {
    vec4 velMass = texture(u_gridTex, gl_FragCoord.xy / u_gridRes);

    if (velMass.z > 0.) {
        velMass.xy /= velMass.z;
    //velMass.xy -= u_dt * normalize(gl_FragCoord.xy - vec2(32, 32)) * length(gl_FragCoord.xy - vec2(32, 32))*0.01;
        velMass.xy -= u_dt * u_gravity;
    } else {
        velMass.xy = vec2(0);
    }

    // float E = texture(u_gridTex, (gl_FragCoord.xy + vec2(1, 0)) / u_gridRes).w;
    // float W = texture(u_gridTex, (gl_FragCoord.xy + vec2(-1, 0)) / u_gridRes).w;
    // float N = texture(u_gridTex, (gl_FragCoord.xy + vec2(0, 1)) / u_gridRes).w;
    // float S = texture(u_gridTex, (gl_FragCoord.xy + vec2(0, -1)) / u_gridRes).w;
    
    if (velMass.z > 0.25) velMass.w = 0.; // fluid cell
    else if (velMass.z == 0.) velMass.w = 1.; // empty cell 
    else if (velMass.z <= 0.25) velMass.w = 2.; // surface cell

    vec2 cpos = floor(gl_FragCoord.xy);
    if (cpos.x < 2.)
        velMass = vec4(0, 0.*velMass.y, velMass.z, 3);
    if (cpos.x >= u_gridRes.x - 2.)
        velMass = vec4(0, 0.*velMass.y, velMass.z, 3);
    if (cpos.y < 2.)
        velMass = vec4(0.*velMass.x, 0, velMass.z, 3);
    if (cpos.y > u_gridRes.y - 2.)
        velMass = vec4(0.*velMass.x, 0, velMass.z, 3);

    o = velMass;
}