#version 300 es

precision highp float;

out vec4 o;

void main() {
    o = vec4(gl_FragCoord.xy/7., 0, 1);
}