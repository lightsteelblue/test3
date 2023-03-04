#version 300 es

precision highp float;

uniform sampler2D velTex;
uniform sampler2D pressureTex;
uniform vec2 u_gridRes;
uniform float u_dt;

out vec4 o;

void main() {
    float pE = texture(pressureTex, (gl_FragCoord.xy + vec2(1, 0)) / u_gridRes).x;
    float pEE = texture(pressureTex, (gl_FragCoord.xy + vec2(2, 0)) / u_gridRes).x;
    float pW = texture(pressureTex, (gl_FragCoord.xy + vec2(-1, 0)) / u_gridRes).x;
    float pWW = texture(pressureTex, (gl_FragCoord.xy + vec2(-2, 0)) / u_gridRes).x;
    float pN = texture(pressureTex, (gl_FragCoord.xy + vec2(0, 1)) / u_gridRes).x;
    float pNN = texture(pressureTex, (gl_FragCoord.xy + vec2(0, 2)) / u_gridRes).x;
    float pS = texture(pressureTex, (gl_FragCoord.xy + vec2(0, -1)) / u_gridRes).x;
    float pSS = texture(pressureTex, (gl_FragCoord.xy + vec2(0, -2)) / u_gridRes).x;
    float pC = texture(pressureTex, gl_FragCoord.xy / u_gridRes).x;

    float dpdxe = (pE - pC) - 0.25 * ((pE - pW) + (pEE - pC));
    float dpdyn = (pN - pC) - 0.25 * ((pN - pS) + (pNN - pC));
    float dpdxw = (pC - pW) - 0.25 * ((pC - pWW) + (pE - pW));
    float dpdys = (pC - pS) - 0.25 * ((pC - pSS) + (pN - pS));

    vec2 uE = texture(velTex, (gl_FragCoord.xy + vec2(1, 0)) / u_gridRes).xw;
    vec2 uW = texture(velTex, (gl_FragCoord.xy + vec2(-1, 0)) / u_gridRes).xw;
    vec2 vN = texture(velTex, (gl_FragCoord.xy + vec2(0, 1)) / u_gridRes).yw;
    vec2 vS = texture(velTex, (gl_FragCoord.xy + vec2(0, -1)) / u_gridRes).yw;
    vec2 uvC = texture(velTex, gl_FragCoord.xy / u_gridRes).xy;

    float ufe_ = 0.5 * (uE.x + uvC.x);
    float vfn_ = 0.5 * (vN.x + uvC.y);
    float ufw_ = 0.5 * (uW.x + uvC.x);
    float vfs_ = 0.5 * (vS.x + uvC.y);

    vec2 flux1 = vec2(ufe_, vfn_) - 0.5 * vec2(dpdxe, dpdyn) * u_dt;
    vec2 flux2 = vec2(ufw_, vfs_) - 0.5 * vec2(dpdxw, dpdys) * u_dt;

    if (uE.y == 3.) flux1.x = 0.;
    if (uW.y == 3.) flux2.x = 0.;
    if (vN.y == 3.) flux1.y = 0.;
    if (vS.y == 3.) flux2.y = 0.;

    if (uE.y == 1.) flux1.x = flux2.x;;
    if (uW.y == 1.) flux2.x = flux1.x;
    if (vN.y == 1.) flux1.y = flux2.y;
    if (vS.y == 1.) flux2.y = flux1.y;

    vec4 c = texture(velTex, gl_FragCoord.xy / u_gridRes);
    float div = -(flux1.x - flux2.x + flux1.y - flux2.y) / u_dt;
#if 1
    float a = abs(c.z - 1.)*(c.z - 1.)/(u_dt*u_dt);
    if (a > 0.) div += a;
    else if (a < 0. && div > 0.)div = max(div+a, 0.);
#endif

    o = vec4(pC,div,c.z,c.w);
}
