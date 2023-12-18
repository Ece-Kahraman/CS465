var canvas;
var gl;
var program;
var strips = [];
var oneStrip = [];
var colors = [];
var vertexColors = [
    [ 0.0, 0.0, 0.0, 1.0 ],  // black
    [ 1.0, 0.0, 0.0, 1.0 ],  // red
    [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
    [ 0.0, 1.0, 0.0, 1.0 ],  // green
    [ 0.0, 0.0, 1.0, 1.0 ],  // blue
    [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
    [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
    [ 1.0, 1.0, 1.0, 1.0 ]   // white
];
var vBuffer;

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;
var radius = 1.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var numUPoints = 50, numVPoints = 50;

const aa = 0.8;

function x(u, w) {
    var denom = aa * (Math.pow(w*Math.cosh(aa*u), 2) + Math.pow(aa*Math.sin(w*u), 2));
    return -1*u + (2*(1 - Math.pow(aa, 2))*Math.cosh(aa*u)*Math.sin(aa*u)) / denom;
    
}

function y(u, v, w) {
    var denom = aa * (Math.pow(w*Math.cosh(aa*u), 2) + Math.pow(aa*Math.sin(w*u), 2));
    return (2*w*Math.cosh(aa*u)*(-1*w*Math.cos(v)*Math.cos(w*v)-Math.sin(v)*Math.sin(w*v)))/denom;
}

function z(u, v, w) {
    var denom = aa * (Math.pow(w*Math.cosh(aa*u), 2) + Math.pow(aa*Math.sin(w*u), 2));
    return (2*w*Math.cosh(aa*u)*(-1*w*Math.sin(v)*Math.cos(w*v)+Math.cos(v)*Math.sin(w*v)))/denom;
}

window.onload = function init() {
    canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl');

    gl.viewport( 0, 0, canvas.width, canvas.height );    
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    
    
    const minUV = -10, maxUV = 10;
    const step = (maxUV - minUV)/250;
    let w = Math.sqrt(1 - Math.pow(aa, 2));
    
    for (let u = minUV; u < maxUV; u += step) {
        for (let v = minUV; v < maxUV; v += step) {            
            oneStrip.push(...[x(u, w)/8, y(u, v, w)/8, z(u, v, w)/8,
            x(u+step, w)/8, y(u+step, v, w)/8, z(u+step, v, w)/8]);
            colors.push(vertexColors[Math.floor(Math.random()*8)]);
            colors.push(vertexColors[Math.floor(Math.random()*8)]);
            
        }
        strips.push(...oneStrip);
        oneStrip = [];
    }

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(strips), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "position" );
    gl.enableVertexAttribArray( vPosition );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    


    render();
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
    //eye = vec3(radius*Math.sin(theta)*Math.cos(phi), radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    //modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = mat4(); //ortho(left, right, bottom, ytop, near, far);
            
    //gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

// render columns of data then rows
        
    for(let i=0; i<strips.length; i++) gl.drawArrays( gl.TRIANGLE_STRIP, i*606, 606 );            
    //for(var i=0; i<numVPoints; i++) gl.drawArrays( gl.LINE_STRIP, i*numUPoints+positions.length/2, numUPoints );
    //gl.drawArrays(gl.TRIANGLES_STRIP, 0, positions.length / 3);
    //requestAnimFrame(render);
}