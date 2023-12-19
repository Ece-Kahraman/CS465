var canvas;
var gl;
var program;
var strips = [];
var oneStrip = [];
var normals = [];
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

const lightSourcePos = [0, 0, 1];

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

function normal(p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z) {
    var v1x = p2x - p1x, v1y = p2y -  p1y, v1z = p2z - p1z;
    var v2x = p3x - p1x, v2y = p3y -  p1y, v2z = p3z - p1z;

    var nx = v1y * v2z - v1z * v2y;
    var ny = v1z * v2x - v1x * v2z;
    var nz = v1x * v2y - v1y * v2x;

    var len = nx + ny + nz ? Math.sqrt(nx**2 + ny**2 + nz**2) : 1e8;
    nx /= len;
    ny /= len;
    nz /= len;

    return [nx, ny, nz];
}

function brightness(v1x, v1y, v1z, v2x, v2y, v2z) {
    const dot = v1x * v2x + v1y * v2y + v1z * v2z;

    const v1len = Math.sqrt(v1x**2 + v1y**2 + v1z**2);
    const v2len = Math.sqrt(v2x**2 + v2y**2 + v2z**2);

    const nur = dot / (v1len * v2len);

    return Math.abs(nur);
}

window.onload = function init() {
    canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl');

    gl.viewport( 0, 0, canvas.width, canvas.height );    
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    
    
    const minUV = -10, maxUV = 10;
    const step = (maxUV - minUV)/150;
    let w = Math.sqrt(1 - Math.pow(aa, 2));

    var p1, p2, prev1, prev2, n1, n2, b1, b2;
    
    for (let u = minUV; u < maxUV; u += step) {
        p1 = [x(u, w)/5, y(u, minUV, w)/5, z(u, minUV, w)/5];
        p2 = [x(u+step, w)/5, y(u+step, minUV, w)/5, z(u+step, minUV, w)/5];
        oneStrip.push(...p1, ...p2);
        prev1 = p1;
        prev2 = p2;
        for (let v = minUV+step; v < maxUV; v += step) {    
            p1 = [x(u, w)/5, y(u, v, w)/5, z(u, v, w)/5];
            p2 = [x(u+step, w)/5, y(u+step, v, w)/5, z(u+step, v, w)/5];
            oneStrip.push(...p1, ...p2);

            n1 = normal(...prev1, ...prev2, ...p1);
            n2 = normal(...prev2, ...p1, ...p2);

            b1 = brightness(...n1, ...lightSourcePos);
            b2 = brightness(...n2, ...lightSourcePos);
            
            colors.push([b1, b1, b1, 1]);
            colors.push([b2, b2, b2, 1]);

            prev1 = p1;
            prev2 = p2;
            
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