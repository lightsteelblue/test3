import { loadTextFileAsync } from './load.js';
import { Vec2 } from './mathtype.js';
import * as GLU from './glutils.js';
import { ShaderProgram, ShaderProgramTF } from './shaderprogram.js';
import { FramebufferObject } from './framebufferobject.js';

let _gl;

const gridX = 32*6;
const gridY = 32*4;
const _dp = 0.25;

const _gravity = new Vec2(0, 0.3);
const _rho0 = 1;

const _vertFilenames = [
    'p2g.vert',
    'fullscreen.vert',
    'g2p.vert',
];
const _fragFilenames = [
    'p2g.frag',
    'grid_update.frag',
    'tf_dummy.frag',
    'div.frag',
    'sor.frag',
    'velocity.frag',
    'draw_pressure.frag',
    'rhie_chow.frag',
];

let _vertSources;
let _fragSources;

let _P2GProgram;
let _G2PProgram;
let _gridUpdateProgram;
let _divProgram;
let _SORProgram;
let _velProgram;
let _div2Program;

let _drawProgram;

let _gridFBO_r;
let _gridFBO_w;
let _pressureFBO_r;
let _pressureFBO_w;

let _pPosVelVBO_r;
let _pCVBO_r;
let _pJVBO_r;
let _pPosVelVBO_w;
let _pCVBO_w;
let _pJVBO_w;

let _particleCount;
let _dt;
let _volume0;
let _mass0;

let _pointerPos;

export const loadShaderFilesAsync = async () => {
    let paths = [..._vertFilenames, ..._fragFilenames].map(n => './shaders/' + n);
    let sources = await loadTextFileAsync(...paths);
    _vertSources = sources.slice(0, _vertFilenames.length);
    _fragSources = sources.slice(_vertFilenames.length);
};

export const init = (gl) => {
    _gl = gl;
    
    _dt = 0.5;
    _volume0 = _dp**2;
    _mass0 = _rho0 * _volume0;

    _pointerPos = new Vec2(1000);

    _P2GProgram = new ShaderProgram(_gl, _vertSources[0], _fragSources[0], [0, 1], [4, 4]);
    _G2PProgram = new ShaderProgramTF(_gl, _vertSources[2], _fragSources[2], ['o_posVel', 'o_C'], [0, 1], [4, 4]);
    _divProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[3], null, null);
    _SORProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[4], null, null);
    _velProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[5], null, null);
    _drawProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[6], null, null);
    _div2Program = new ShaderProgram(_gl, _vertSources[1], _fragSources[7], null, null);

    _gridUpdateProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[1], null, null);

    _gridFBO_r = new FramebufferObject(_gl, gridX, gridY, [['tex', 'RGBA32F']]);
    _gridFBO_w = new FramebufferObject(_gl, gridX, gridY, [['tex', 'RGBA32F']]);
    _pressureFBO_r = new FramebufferObject(_gl, gridX, gridY, [['tex', 'RGBA32F']]);
    _pressureFBO_w = new FramebufferObject(_gl, gridX, gridY, [['tex', 'RGBA32F']]);


    _gl.clearColor(0, 0, 0, 0);
    _pressureFBO_r.bind();
    _gl.clear(_gl.COLOR_BUFFER_BIT);

    let pos = [];
    if (false) {
    pos = [16, 16];
    } else {
    for (let y = 0; y < gridY /2; y+=_dp)
        for (let x = 0; x < gridX / 2; x+=_dp) {
            pos.push(x + 0.*Math.random() + 2.25);
            pos.push(y + 0.*Math.random() + 2.25);
        }
    }

    _particleCount = pos.length / 2;

    console.log(_particleCount);

    let posVel = new Array(pos.length * 2).fill(0);
    for (let i = 0; i < pos.length * 2; i+=2) {
        posVel[2*i] = pos[i];
        posVel[2*i + 1] = pos[i + 1];
    }

    let C = new Array(_particleCount * 4).fill(0);
    let J = new Array(_particleCount).fill(1);
    [_pPosVelVBO_r, _pCVBO_r, _pJVBO_r] = [posVel, C, J].map(x => GLU.createVBO(_gl, x));
    [_pPosVelVBO_w, _pCVBO_w, _pJVBO_w] = [posVel, C, J].map(x => GLU.createVBO(_gl, x));
};

export const step = () => {
    _clearGrid();
    _P2G();
    _updateGrid();
    _G2P();
};

export const setPointerPos = (pos) => {
    _pointerPos = pos;
};

export const render = (renderer) => {
    renderer.setRenderingSimulationArea(new Vec2(0), new Vec2(gridX, gridY));

    //_gridFBO_r.bind();
    //_pressureFBO_r.bind();
    //_gl.bindFramebuffer(_gl.DRAW_FRAMEBUFFER, null);
    //_gl.blitFramebuffer(0, 0, gridX, gridY, 0, 0, canvas.width, canvas.height, _gl.COLOR_BUFFER_BIT, _gl.NEAREST);

    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    _drawProgram.use();
    GLU.bindTextureUniform(_gl, 0, _drawProgram.uniform('tex'), _pressureFBO_r.texture('tex'));
    _gl.uniform2f(_drawProgram.uniform('canvasSize'), 640, 640);
    //_gl.drawArrays(_gl.TRIANGLES, 0, 3);

    renderer.renderParticles(_particleCount, _dp*1.2, _pPosVelVBO_r, _pJVBO_r);
};

const _clearGrid = () => {
    _gl.clearColor(0, 0, 0, 0);

    _gridFBO_w.bind();
    _gl.clear(_gl.COLOR_BUFFER_BIT);
};

const _updateGrid = () => {
    _gridFBO_w.bind();
    _gridUpdateProgram.use();
    GLU.bindTextureUniform(_gl, 0, _gridUpdateProgram.uniform('u_gridTex'), _gridFBO_r.texture('tex'));
    _gl.uniform2f(_gridUpdateProgram.uniform('u_gridRes'), gridX, gridY);
    _gl.uniform2f(_gridUpdateProgram.uniform('u_gravity'), _gravity.x, _gravity.y);
    _gl.uniform1f(_gridUpdateProgram.uniform('u_dt'), _dt);
    _gl.drawArrays(_gl.TRIANGLES, 0, 3);

    if (false) {
        _pressureFBO_w.bind();
        _divProgram.use();
        GLU.bindTextureUniform(_gl, 0, _divProgram.uniform('tex'), _gridFBO_w.texture('tex'));
        GLU.bindTextureUniform(_gl, 1, _divProgram.uniform('pressureTex'), _pressureFBO_r.texture('tex'));
        _gl.uniform2f(_divProgram.uniform('u_gridRes'), gridX, gridY);
        _gl.uniform1f(_divProgram.uniform('u_dt'), _dt);
        _gl.drawArrays(_gl.TRIANGLES, 0, 3);

        [_pressureFBO_r, _pressureFBO_w] = [_pressureFBO_w, _pressureFBO_r];
    } else {
        _pressureFBO_w.bind();
        _div2Program.use();
        GLU.bindTextureUniform(_gl, 0, _div2Program.uniform('velTex'), _gridFBO_w.texture('tex'));
        GLU.bindTextureUniform(_gl, 1, _div2Program.uniform('pressureTex'), _pressureFBO_r.texture('tex'));
        _gl.uniform2f(_div2Program.uniform('u_gridRes'), gridX, gridY);
        _gl.uniform1f(_div2Program.uniform('u_dt'), _dt);
        _gl.drawArrays(_gl.TRIANGLES, 0, 3);

        [_pressureFBO_r, _pressureFBO_w] = [_pressureFBO_w, _pressureFBO_r];
    }

    for (let i = 0; i < 20; i++) {
        _SORProgram.use();
        _gl.uniform2f(_SORProgram.uniform('N'), gridX, gridY);
        
        _pressureFBO_w.bind();
        GLU.bindTextureUniform(_gl, 0, _SORProgram.uniform('tex'), _pressureFBO_r.texture('tex'));
        _gl.uniform1i(_SORProgram.uniform('red_black'), 0);
        _gl.drawArrays(_gl.TRIANGLES, 0, 3);

        _pressureFBO_r.bind();
        GLU.bindTextureUniform(_gl, 0, _SORProgram.uniform('tex'), _pressureFBO_w.texture('tex'));
        _gl.uniform1i(_SORProgram.uniform('red_black'), 1);
        _gl.drawArrays(_gl.TRIANGLES, 0, 3);
    }



    _gridFBO_w.bind();
    _velProgram.use();
    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.ONE, _gl.ONE);
    GLU.bindTextureUniform(_gl, 0, _velProgram.uniform('tex'), _pressureFBO_r.texture('tex'));
    _gl.uniform2f(_velProgram.uniform('u_gridRes'), gridX, gridY);
    _gl.uniform1f(_velProgram.uniform('u_dt'), _dt);
    _gl.drawArrays(_gl.TRIANGLES, 0, 3);
    _gl.disable(_gl.BLEND);

    [_gridFBO_r, _gridFBO_w] = [_gridFBO_w, _gridFBO_r];
};

const _P2G = () => {
    _gridFBO_w.bind();
    _P2GProgram.use();
    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.ONE, _gl.ONE);
    GLU.setAttributes(_gl, [_pPosVelVBO_r, _pCVBO_r], _P2GProgram.location, _P2GProgram.stride);
    _gl.uniform2f(_P2GProgram.uniform('u_gridRes'), gridX, gridY);
    _gl.uniform1f(_P2GProgram.uniform('mass0'), _mass0);
    _gl.drawArrays(_gl.POINTS, 0, _particleCount);
    _gl.disable(_gl.BLEND);

    [_gridFBO_r, _gridFBO_w] = [_gridFBO_w, _gridFBO_r];
};



const _G2P = () => {
    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    _G2PProgram.use();
    GLU.setAttributes(_gl, [_pPosVelVBO_r, _pCVBO_r], _G2PProgram.location, _G2PProgram.stride);

    GLU.bindTextureUniform(_gl, 0, _G2PProgram.uniform('u_gridTex'), _gridFBO_r.texture('tex'));
    _gl.uniform2f( _G2PProgram.uniform('u_gridRes'), gridX, gridY);
    _gl.uniform1f( _G2PProgram.uniform('u_dt'), _dt);
    _gl.uniform2f( _G2PProgram.uniform('mouse_pos'), _pointerPos.x, _pointerPos.y);
    _gl.bindBufferBase(_gl.TRANSFORM_FEEDBACK_BUFFER, 0, _pPosVelVBO_w);
    _gl.bindBufferBase(_gl.TRANSFORM_FEEDBACK_BUFFER, 1, _pCVBO_w);
    //_gl.bindBufferBase(_gl.TRANSFORM_FEEDBACK_BUFFER, 2, _pJVBO_w);

    _gl.enable(_gl.RASTERIZER_DISCARD);
    _gl.beginTransformFeedback(_gl.POINTS);

    _gl.drawArrays(_gl.POINTS, 0, _particleCount);

    _gl.disable(_gl.RASTERIZER_DISCARD);
    _gl.endTransformFeedback();

    _gl.bindBufferBase(_gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    _gl.bindBufferBase(_gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
    //_gl.bindBufferBase(_gl.TRANSFORM_FEEDBACK_BUFFER, 2, null);

    [_pPosVelVBO_r, _pPosVelVBO_w] = [_pPosVelVBO_w, _pPosVelVBO_r];
    [_pCVBO_r, _pCVBO_w] = [_pCVBO_w, _pCVBO_r];
    //[_pJVBO_r, _pJVBO_w] = [_pJVBO_w, _pJVBO_r];
};
