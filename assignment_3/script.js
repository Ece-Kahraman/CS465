var canvas;
var gl;
var program;
var positions = [];
var colors = [];
var projectionMatrixLoc;
var modelViewMatrixLoc;
var vBuffer;

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
    canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl');

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);



    for (var u = -14; u <= 14; u += 0.1) {
        for (var v = -37.4; v < 37.4; v += 0.1) {
            //let x1 = (x(u, v, 0.5)/Math.PI) + 1
            //let y1 = (y(u, v, 0.5)/Math.PI) + 1
            //let z1 = (z(u, v, 0.5)/Math.PI) + 1
            positions.push(vec4(x(u, v, 0.4), y(u, v, 0.4), z(u, v, 0.4), 1.0));
            //console.log(x1, y1, z1)
            //positions.push(y(u, v, 0.5));
            //positions.push(z(u, v, 0.5));
            //positions.push(1);
        }
    }



    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "aVertexPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );


    var buffers = {
        position: vBuffer,
        numVertices: positions.length/3,
    };
    drawScene(gl, buffers);
}

function drawScene(gl, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 45 * Math.PI / 180;
    const aspect = canvas.width / canvas.height;
    const zNear = 0;
    const zFar = 100;
    var projection = mat4();
    projection = perspective(fieldOfView, aspect, zNear, zFar);

    var modelView = mat4();
    modelView = translate( 0.0, 0.0, -600.0);

    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projection) );
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelView) );

    gl.drawArrays(gl.LINE_STRIP, 0, buffers.numVertices);
}