var canvas;
var gl;
var program;
var triangles = [];
var normals = [];
var colors = [];
var vertexColors = [
    [ 1.0, 1.0, 1.0, 1.0 ],  // black
    [ 1.0, 0.0, 0.0, 1.0 ],  // red
    [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
    [ 0.0, 1.0, 0.0, 1.0 ],  // green
    [ 0.0, 0.0, 1.0, 1.0 ],  // blue
    [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
    [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
    [ 1.0, 1.0, 1.0, 1.0 ]   // white
];

var color = 0;
var vBuffer, vPosition, cBuffer, vColor;

const lightSourcePos = [1, 1, 1];

var rotationMatrix;
var rotationMatrixLoc;

var scaleMatrix;
var scaleMatrixLoc;

var mag = 0.12;

var angle = 0.0;
var axis = [0, 0, 1];

var trackingMouse = false;
var trackballMove = false;
var wheelMove = false;

var lastPos = [0, 0, 0];
var curx, cury;
var startX, startY;

var renderFlag = true;

var aa = 0.8;
var mag = 1/8;
var maxU = 10;
var maxV = 10;

function trackballView( x,  y ) {
    var d, a;
    var v = [];

    v[0] = x;
    v[1] = y;

    d = v[0]*v[0] + v[1]*v[1];
    if (d < 1.0)
      v[2] = Math.sqrt(1.0 - d);
    else {
      v[2] = 0.0;
      a = 1.0 /  Math.sqrt(d);
      v[0] *= a;
      v[1] *= a;
    }
    return v;
}

function mouseMotion( x,  y)
{
    var dx, dy, dz;

    var curPos = trackballView(x, y);
    if(trackingMouse) {
      dx = curPos[0] - lastPos[0];
      dy = curPos[1] - lastPos[1];
      dz = curPos[2] - lastPos[2];

      if (dx || dy || dz) {
            angle = -0.1 * Math.sqrt(dx*dx + dy*dy + dz*dz);


            axis[0] = lastPos[1]*curPos[2] - lastPos[2]*curPos[1];
            axis[1] = lastPos[2]*curPos[0] - lastPos[0]*curPos[2];
            axis[2] = lastPos[0]*curPos[1] - lastPos[1]*curPos[0];

        lastPos[0] = curPos[0];
	    lastPos[1] = curPos[1];
	    lastPos[2] = curPos[2];
      }
    }
    render();
}

function startMotion( x,  y)
{
    trackingMouse = true;
    startX = x;
    startY = y;
    curx = x;
    cury = y;

    lastPos = trackballView(x, y);
	  trackballMove=true;
}

function stopMotion( x,  y)
{
    trackingMouse = false;
    if (startX != x || startY != y) {
    }
    else {
	     angle = 0.0;
	     trackballMove = false;
    }
}

function x(u, w, aa) {
    var denom = aa * (Math.pow(w*Math.cosh(aa*u), 2) + Math.pow(aa*Math.sin(w*u), 2));
    return -1*u + (2*(1 - Math.pow(aa, 2))*Math.cosh(aa*u)*Math.sin(aa*u)) / denom;
    
}

function y(u, v, w, aa) {
    var denom = aa * (Math.pow(w*Math.cosh(aa*u), 2) + Math.pow(aa*Math.sin(w*u), 2));
    return (2*w*Math.cosh(aa*u)*(-1*w*Math.cos(v)*Math.cos(w*v)-Math.sin(v)*Math.sin(w*v)))/denom;
}

function z(u, v, w, aa) {
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

function generateBreather( maxU, maxV, aa, mag){
    const minU = -maxU;
    const minV = -maxV;
    triangles = [];
    normals = [];
    colors = [];
    const step = (maxU - minU)/150;
    let w = Math.sqrt(1 - Math.pow(aa, 2));

    var p00, p01, p10, p11, n1, n2, b1, b2, c1, c2, c3;
    for (let u = minU; u < maxU; u += step) {
        for (let v = minV; v < maxV; v += step) {
            p00 = [x(u, w, aa)*mag, y(u, v, w, aa)*mag, z(u, v, w, aa)*mag];
            p01 = [x(u, w, aa)*mag, y(u, v+step, w, aa)*mag, z(u, v+step, w, aa)*mag];
            p10 = [x(u+step, w, aa)*mag, y(u+step, v, w, aa)*mag, z(u+step, v, w, aa)*mag];
            p11 = [x(u+step, w, aa)*mag, y(u+step, v+step, w, aa)*mag, z(u+step, v+step, w, aa)*mag];
            triangles.push( ...p00, ...p10, ...p01, ...p10, ...p01, ...p11 );

            n1 = normal(...p00, ...p10, ...p01);
            n2 = normal(...p10, ...p01, ...p11);

            b1 = brightness(...n1, ...lightSourcePos);
            b2 = brightness(...n2, ...lightSourcePos);

            [c1, c2, c3] = vertexColors[color];

            c1 = [b1 * c1, b1 * c2, b1 * c3, 1]
            c2 = [b2 * c1, b2 * c2, b2 * c3, 1];

            colors.push(...c1, ...c1, ...c1);
            colors.push(...c2, ...c2, ...c2);
            
        }
    }
}

window.onload = function init() {
    canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl');


    document.getElementById("aa-slider").onchange = (event) => {
        aa = event.target.value;       
        renderFlag = true;   
    }

    document.getElementById("u-slider").onchange = (event) => {
        maxU = event.target.value;       
        renderFlag = true;   
    }

    document.getElementById("v-slider").onchange = (event) => {
        maxV = event.target.value;       
        renderFlag = true;   
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );    
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(triangles), gl.DYNAMIC_DRAW);
    
    vPosition = gl.getAttribLocation( program, "position" );
    gl.enableVertexAttribArray( vPosition );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    rotationMatrix = mat4();
    rotationMatrixLoc = gl.getUniformLocation(program, "rotationMatrix");
    gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(rotationMatrix));

    scaleMatrix = mat4();
    scaleMatrixLoc = gl.getUniformLocation(program, "scaleMatrix")
    gl.uniformMatrix4fv(scaleMatrixLoc, false, flatten(scaleMatrix));
    
    canvas.addEventListener("mousedown", function(event){
        var x = 2*event.clientX/canvas.width-1;
        var y = 2*(canvas.height-event.clientY)/canvas.height-1;
        startMotion(x, y);
    });
  
    canvas.addEventListener("mouseup", function(event){
        var x = 2*event.clientX/canvas.width-1;
        var y = 2*(canvas.height-event.clientY)/canvas.height-1;
        stopMotion(x, y);
    });
  
    canvas.addEventListener("mousemove", function(event){  
        var x = 2*event.clientX/canvas.width-1;
        var y = 2*(canvas.height-event.clientY)/canvas.height-1;
        mouseMotion(x, y);
    } );

    canvas.addEventListener("wheel", function(event){
        let d = -event.deltaY / 1000;
        mag = Math.min(4, Math.max(.1, mag + d));
        wheelMove = true;
    } );

    render();
}

var render = function(){
    console.log(wheelMove, trackballMove, renderFlag);
    if (renderFlag || trackballMove || wheelMove) {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (renderFlag){
            generateBreather(maxU, maxV, aa, mag);
            renderFlag = false;
            
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(triangles), gl.DYNAMIC_DRAW);
            gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW );
        }
        
        if(trackballMove) {
            axis = normalize(axis);
            rotationMatrix = mult(rotate(angle, axis), rotationMatrix);
            gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(rotationMatrix));
        }

        if ( wheelMove ) {
            scaleMatrix = scale(mag, mag, mag);
            gl.uniformMatrix4fv(scaleMatrixLoc, false, flatten(scaleMatrix));
            wheelMove = false;
        } 

            
        gl.drawArrays( gl.TRIANGLES, 0, triangles.length/3 );
    }        
    requestAnimFrame(render);
}