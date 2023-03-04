#version 300 es

layout(location = 0) in vec4 pPosVel;
layout(location = 1) in vec4 pC;

uniform sampler2D u_gridTex;
uniform vec2 u_gridRes;
uniform float u_dt;
uniform vec2 mouse_pos;

out vec4 o_posVel;
out vec4 o_C;

void main() {
    mat2 C = mat2(pC);

    vec2 cpos = floor(pPosVel.xy);
    vec2 r = pPosVel.xy - cpos - 0.5;

    vec2[3] weights = vec2[](
        0.5 * (0.5 - r) * (0.5 - r)
        , 0.75 - r * r
        , 0.5 * (0.5 + r) * (0.5 + r));

    vec2 vel = vec2(0);
    mat2 B = mat2(0);
    float mass = 0.;
    for (int cy = 0; cy < 3; ++cy)
        for (int cx = 0; cx < 3; ++cx) {
            float w = weights[cx].x * weights[cy].y;

            vec4 grid = texelFetch(u_gridTex, ivec2(cpos) + ivec2(cx, cy) - 1, 0);
            //if (grid.w == 3.) continue;

            grid *= w;
            vel += grid.xy;
            //mass += w;
            vec2 r_ = -r + vec2(cx, cy) - 1.;  
            B += mat2(grid.xy * r_.x, grid.xy * r_.y);
        }
    vec2 pos = pPosVel.xy + u_dt * vel;

    if (true) {
        vec2 dist = pos - mouse_pos;
        if (dot(dist, dist) < 64.*4. && dot(dist, dist) > 0.000001) {
            vec2 n = normalize(dist);
            vec2 force = n;
            vel += force;
        }
    }
    o_C = vec4(4. * B);

    // boundaries
#if 1
    vec2 x_n = pos;
    float wall_min = 2.5;
    vec2 wall_max = u_gridRes - 2.5;
    if (x_n.x < wall_min) vel.x += (wall_min - x_n.x) / u_dt*1.;
    if (x_n.x > wall_max.x) vel.x += (wall_max.x - x_n.x)  / u_dt*1.;
    if (x_n.y < wall_min) vel.y += (wall_min - x_n.y)  / u_dt*1.;
    if (x_n.y > wall_max.y) vel.y += (wall_max.y - x_n.y)  / u_dt*1.;
#endif
    //pos.y = max(pos.y, 1.5);
    pos = clamp(pos, vec2(2), u_gridRes - 2.);
    o_posVel = vec4(pos, vel);
}
