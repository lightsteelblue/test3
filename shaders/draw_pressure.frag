#version 300 es

precision highp float;

uniform sampler2D tex;
uniform vec2 canvasSize;
out vec4 o;

void main() {
    vec4 a = texture(tex, gl_FragCoord.xy / canvasSize);
    o = vec4(pow(a.x / 5.,1.), 0, 0, 1);
    if (a.w == 0.) o = vec4(0.3, 0.5, 1, 1);
    if (a.w == 1.) o = vec4(0, 0, 0, 1);
    if (a.w == 2.) o = vec4(0.2, 0.9, 0.2, 1);
    if (a.w == 3.) o = vec4(0.5, 0.2, 0.2, 1);
    //o = vec4(a.w/3., 0, 0, 1);
    //o = vec4(a.x > 0. ? 1 : 0, abs(a.y*10.), a.z>4.?1:0, 1);

    //o = vec4(a.x * 2., 0, 0, 1);
}