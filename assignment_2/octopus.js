
var canvas;
var gl;
var program;

var projectionMatrix; 
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

var USF = 0.3; // Universal Scale Factor

var headHeight = 5 * USF;
var headWidth = 3 * USF;
var headDepth = 3 * USF;

var upperLegHeight = 4 * USF;
var upperLegWidth = 1 * USF;
var upperLegDepth = 1 * USF;

var middleLegHeight = 3 * USF;
var middleLegWidth = 1 * USF;
var middleLegDepth = 1 * USF;

var lowerLegHeight = 2 * USF;
var lowerLegWidth = 1 * USF;
var lowerLegDepth = 1 * USF;


var numNodes = 25;

var theta = [
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], 
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]
];

var numVertices = 24;

var stack = [];

var figure = [];

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------

function createNode(transform, render){
    var node = {
    transform: transform,
    render: render
    }
    return node;
}

function idToLocation(Id) {
    switch (Math.floor((Id-1)/3)){
        case 0:
            return {x: -1.5 * USF * USF, z: 1.5 * USF};        
        case 1:
            return {x: -1.5 * USF, z: 0 * USF};
        case 2:
            return {x: -1.5 * USF, z: -1.5 * USF};
        case 3:
            return {x: 0, z: 1.5 * USF};
        case 4:
            return {x: 0, z: -1.5 * USF};
        case 5:
            return {x: 1.5 * USF, z: 1.5 * USF};
        case 6:
            return {x: 1.5 * USF, z: 0 * USF};
        case 7:
            return {x: 1.5 * USF, z: -1.5 * USF}
        
    }
}

function initNodes(Id) {

    var m = mat4();

    // Head
    if (Id == 0) {
        m = translate(0.0, -0.5*headHeight, 0.0);
	    m = mult(rotate(theta[0][0], 1, 0, 0), m);
	    m = mult(rotate(theta[0][1], 0, 1, 0), m);
        m = mult(rotate(theta[0][2], 0, 0, 1), m);
        m = mult(translate(0.0, 0.5*headHeight, 0.0), m);
        figure[Id] = createNode( m, body_part);
        return;
    }

    tmp = idToLocation(Id);
    
    switch(Id % 3) {

        // Upper Arm
        case 1:    
            m = translate(-tmp.x, 0.5*(headHeight+upperLegHeight), -tmp.z);
            m = mult(m, rotate(theta[1][0], 1, 0, 0));
            m = mult(m, rotate(theta[1][1], 0, 1, 0));
            m = mult(m, rotate(theta[1][2], 0, 0, 1));
            m = mult(translate(tmp.x, -0.5*(headHeight+upperLegHeight), tmp.z), m);
            figure[Id] = createNode( m, body_part);
            break;

        // Middle Arm
        case 2:    
            m = translate(-tmp.x, -0.5*(headHeight+upperLegHeight+middleLegHeight), tmp.z);
            m = mult(m, rotate(1, 1, 0, 0));
            figure[Id] = createNode( m, body_part);
            break;

        // Lower Arm
        case 0:    
            m = translate(-tmp.x, -0.3*(headHeight+upperLegHeight+middleLegHeight+lowerLegHeight), tmp.z);
            m = mult(m, rotate(1, 1, 0, 0));
            figure[Id] = createNode( m, body_part);
            break;
       
        default:
            //no
            break;
    }

}


function traverse(Id) {

    if (modelViewMatrix == undefined) modelViewMatrix = mat4();

    //console.log(" === ID%s", Id);
    //console.table(modelViewMatrix);
    //console.table(stack);
    //console.table(figure[Id].transform);    
 
    
    if ( Id == null ) return;
    if ( Id == 0 ){
        stack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
        figure[Id].render(Id);
        for ( let i = 1; i < 23; i += 3) traverse(i);
    }
    if ( Id % 3 == 1){
        stack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
        figure[Id].render(Id);
        traverse((Id+1));

    } else if( Id % 3 == 2) {
        stack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
        figure[Id].render(Id);
        traverse((Id+1));

    } else {
        //stack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
        figure[Id].render(Id);
        stack.pop();
        modelViewMatrix = stack.pop();
    }
}

function body_part(Id) {
    let height;
    let width;

    if ( Id == 0 ){
        height = headHeight;
        width = headWidth;
    } else {
        switch(Id % 3) {
    
            case 1: // upper
                height = upperLegHeight;
                width = upperLegWidth;
                break;
    
            case 2: // middle
                height = middleLegHeight;
                width = middleLegWidth;            
                break;
        
            case 0: // lower
                height = lowerLegHeight;
                width = lowerLegWidth;
                break;
            
        }

    }
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( width, height, width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
    pointsArray.push(vertices[a]); 
    pointsArray.push(vertices[b]); 
    pointsArray.push(vertices[c]);     
    pointsArray.push(vertices[d]);    
}

function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");
    
    gl.useProgram( program);

    instanceMatrix = mat4();
    
    projectionMatrix = ortho(-10.0,10.0,-10.0, 10.0,-10.0,10.0);
    modelViewMatrix = mat4();

        
    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );
    
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")
    
    cube();
        
    vBuffer = gl.createBuffer();
        
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    
    document.getElementById("slider00").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    document.getElementById("slider01").onchange = function(event) {
        theta[0][1] = event.target.value;
        initNodes(0);
    };

    document.getElementById("slider02").onchange = function(event) {
        theta[0][2] = event.target.value;
        initNodes(0);
    };
    
    document.getElementById("slider10").onchange = function(event) {
         theta[1][0] =  event.target.value;
         initNodes(1);
    };
     
    document.getElementById("slider11").onchange = function(event) {
        theta[1][1] = event.target.value;
        initNodes(1);
    };
    document.getElementById("slider12").onchange = function(event) {
         theta[1][2] =  event.target.value;
         initNodes(1);
    };
    /*
    document.getElementById("slider6").onchange = function() {
        theta[leftUpperLegId] = event.srcElement.value;
        initNodes(leftUpperLegId);
    };
    document.getElementById("slider7").onchange = function() {
         theta[leftLowerLegId] = event.srcElement.value;
         initNodes(leftLowerLegId);
    };
    document.getElementById("slider8").onchange = function() {
         theta[rightUpperLegId] =  event.srcElement.value;
         initNodes(rightUpperLegId);
    };
        document.getElementById("slider9").onchange = function() {
        theta[rightLowerLegId] = event.srcElement.value;
        initNodes(rightLowerLegId);
    };
    document.getElementById("slider10").onchange = function() {
         theta[head2Id] = event.srcElement.value;
         initNodes(head2Id);
    };*/

    for(i=0; i<numNodes; i++) initNodes(i);
    console.log(figure);
    render();
}


var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    traverse(0);
    requestAnimFrame(render);
}