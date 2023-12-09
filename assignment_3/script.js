var canvas;
var gl;
var program;
var positions = [];

function x(u, v, aa) {
    
    let w = Math.sqrt(1 - Math.pow(aa, 2));
    let denom = aa * (Math.pow(w*Math.cosh(aa*u), 2) + Math.pow(aa*Math.sin(w*u), 2));
    return (-u + (2*(1 - Math.pow(aa, 2))*Math.cosh(aa*u)*Math.sin(aa*u)) / denom);
}

function y(u, v, aa) {
    let w = Math.sqrt(1 - Math.pow(aa, 2));
    let denom = aa * (Math.pow(w*Math.cosh(aa*u), 2) + Math.pow(aa*Math.sin(w*u), 2));
    return (2*w*Math.cosh(aa*u)*(-w*Math.cos(v)*Math.cos(w*v)-Math.sin(v)*Math.sin(w*v)))/denom;
}

function z(u, v, aa) {
    let w = Math.sqrt(1 - Math.pow(aa, 2));
    let denom = aa * (Math.pow(w*Math.cosh(aa*u), 2) + Math.pow(aa*Math.sin(w*u), 2));
    return (2*w*Math.cosh(aa*u)*(-w*Math.sin(v)*Math.cos(w*v)+Math.cos(v)*Math.sin(w*v)))/denom;
}

window.onload = function init() {
    var canvas = document.getElementById('canvas');
    var gl = canvas.getContext('webgl');

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    for (var u = 0; u < 2 * Math.PI; u += 0.1) {
        for (var v = 0; v < 2 * Math.PI; v += 0.1) {
            positions.push(x(u, v));
            positions.push(y(u, v));
            positions.push(z(u, v));
        }
    }

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var buffers = {
        position: positionBuffer,
        numVertices: positions.length / 3,
    };

    drawScene(gl, programInfo, buffers);
}

function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    const modelViewMatrix = mat4.create();

    mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [-0.0, 0.0, -6.0]);  // amount to translate

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    {
        const offset = 0;
        const vertexCount = buffers.numVertices;
        gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }
}