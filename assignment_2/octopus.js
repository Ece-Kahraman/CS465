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

var USF = 0.7; // Universal Scale Factor

var headHeight = 10 * USF;
var headWidth = 8 * USF;
var headDepth = 8 * USF;

var upperLegHeight = 4 * USF;
var upperLegWidth = 1 * USF;
var upperLegDepth = 1 * USF;

var middleLegHeight = 3 * USF;
var middleLegWidth = 1 * USF;
var middleLegDepth = 1 * USF;

var lowerLegHeight = 2 * USF;
var lowerLegWidth = 1 * USF;
var lowerLegDepth = 1 * USF;

var playFrames = false;
var playIndex;
var playAnim0 = false;
var playAnim1 = false;
var playAnim2 = false;

var numNodes = 25;

var alpha = [0, 0, 0];

var _theta = [
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], 
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]
];
var theta = [
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], 
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]
];

var sliders = [];

var numVertices = 24;

var stack = [];
var figure = [];
var frames = [];
var animation0 = [];
var animation1 = [];
var animation2 = [];
animation0 = [JSON.parse(JSON.stringify(theta))];
animation0[0][0][2] = 1;


for (var t = -180; t < 180; ++t){
    animation0.push(JSON.parse(JSON.stringify(theta)))
    for (var f = 0; f < animation0.length; f++)
        for (var p = 0; p < numNodes; p++)
            for (var d = 0; d < 3; d++)
            animation0[f][p][d] = Math.random() * 360 - 180;
}

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];
var colorsArray = [];

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
    return {
    transform: transform,
    render: render
    };
}

function idToLocation(Id) {
    switch (Math.floor((Id-1)/3)){
        case 0:
            return {x: -3 * USF, z: 3 * USF};        
        case 1:
            return {x: -3 * USF, z: 0 * USF};
        case 2:
            return {x: -3 * USF, z: -3 * USF};
        case 3:
            return {x: 0, z: 3 * USF};
        case 4:
            return {x: 0, z: -3 * USF};
        case 5:
            return {x: 3 * USF, z: 3 * USF};
        case 6:
            return {x: 3 * USF, z: 0 * USF};
        case 7:
            return {x: 3 * USF, z: -3 * USF}
        
    }
}

function initNodes(Id) {

    var m = mat4();

    // Head
    if (Id == 0) {
	    m = mult(rotate(theta[0][0], 1, 0, 0), m);
	    m = mult(rotate(theta[0][1], 0, 1, 0), m);
        m = mult(rotate(theta[0][2], 0, 0, 1), m);
        m = mult(translate(alpha[0], alpha[1], alpha[2]), m);
        figure[Id] = createNode( m, body_part);
        return;
    }

    tmp = idToLocation(Id);
    
    switch(Id % 3) {

        // Upper Arm
        case 1:
            m = translate(tmp.x, 0, tmp.z);
            m = mult(m, rotate(theta[Id][0], 1, 0, 0));
            m = mult(m, rotate(theta[Id][1], 0, 1, 0));
            m = mult(m, rotate(theta[Id][2], 0, 0, 1));
            m = mult(m, translate(0, -upperLegHeight, 0));
            figure[Id] = createNode( m, body_part);
            return;

        // Middle Arm
        case 2:
            m = mult(m, rotate(theta[Id][0], 1, 0, 0));
            m = mult(m, rotate(theta[Id][1], 0, 1, 0));
            m = mult(m, rotate(theta[Id][2], 0, 0, 1));
            m = mult(m, translate(0, -middleLegHeight, 0));
            figure[Id] = createNode( m, body_part);
            return;

        // Lower Arm
        case 0:
            m = mult(m, rotate(theta[Id][0], 1, 0, 0));
            m = mult(m, rotate(theta[Id][1], 0, 1, 0));
            m = mult(m, rotate(theta[Id][2], 0, 0, 1));
            m = mult(m, translate(0, -lowerLegHeight, 0));
            figure[Id] = createNode( m, body_part);
            return;
       
        default:
            //no
            return;
    }

}

function traverse(Id) {

    if (modelViewMatrix == undefined) modelViewMatrix = mat4();   
 
    if ( Id == null ) return;

    if ( Id == 0 ){
        stack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
        figure[Id].render(Id);
        for ( let i = 1; i < 23; i += 3) traverse(i);
        //return;
    }
    if ( Id % 3 == 1) {
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
        if(Id != 0){
            modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
            figure[Id].render(Id);
        }        
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
    colorsArray.push(vertexColors[a]); 
    pointsArray.push(vertices[b]); 
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[c]); 
    colorsArray.push(vertexColors[a]);    
    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[a]);    
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

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    

    document.getElementById("reset-squidward").onclick = function() {
        alpha = [0,0,0];
        for(i=0; i<numNodes; i++){
            theta[i] = JSON.parse(JSON.stringify(_theta[i])); 
            initNodes(i);
        }

        for (var slide = 0; slide < sliders.length; ++slide)
            sliders[slide].value = "0";
    }

    document.getElementById("anim0").onclick = function() {
        playAnim0 = true;
        playIndex = 0;
    }

    document.getElementById("save-frame").onclick = function() {

        if (frames.length == 0 ) frames.push($.extend(true, [], theta));
        else {
            if ( frames[ frames.length - 1 ] === theta ) window.alert("change the frame pls");
            else {
                var newFrames = $.extend(true, [], interpolation(frames[frames.length - 1], theta, 50));
                while (newFrames.length)
                    frames.push(newFrames.shift());
            }

        }
    };

    document.getElementById("play-frames").onclick = function() {

        playFrames = true;
        playIndex = 0;
        console.table(frames);

    };
    document.getElementById("clear-frames").onclick = function() {
        frames = [];
    };



    var accordionIds = [];

    var parts = ["Head", "Uparm", "Midarm", "Lowarm"];
    var partOffsets = ["0", "1", "2", "3", "4", "5", "6", "7"];
    var types =  ["Rotate", "Move"];
    var axises = ["X", "Y", "Z"];
    
    for (var part in parts) {
        for (var partOffset in (parts[part] == "Head" ? [partOffsets[0]] : partOffsets)) {
            for (var type in (parts[part] == "Head" ? types : [types[0]])) {
                for (var axis in axises) {
                    accordionIds.push(parts[part] + partOffsets[partOffset] + types[type] + axises[axis]);
                }
            }
        }
    }
    
    sliders.push(document.getElementById("Head0RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };    
    sliders.push(document.getElementById("Head0RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[0][1] = event.target.value;
        initNodes(0);
    };    
    sliders.push(document.getElementById("Head0RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[0][2] = event.target.value;
        initNodes(0);
    };

    
    sliders.push(document.getElementById("Head0MoveX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        alpha[0] = event.target.value;
        initNodes(0);
    };

    
    sliders.push(document.getElementById("Head0MoveY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        alpha[1] = event.target.value;
        initNodes(0);
    };

    
    sliders.push(document.getElementById("Head0MoveZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        alpha[2] = event.target.value;
        initNodes(0);
    };

    
    sliders.push(document.getElementById("Uparm0RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[1][0] = event.target.value;
        initNodes(1);
    };    
    sliders.push(document.getElementById("Uparm0RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[1][1] = event.target.value;
        initNodes(1);
    };   
    sliders.push(document.getElementById("Uparm0RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[1][2] = event.target.value;
        initNodes(1);
    };

    
    sliders.push(document.getElementById("Uparm1RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[4][0] = event.target.value;
        initNodes(4);
    };    
    sliders.push(document.getElementById("Uparm1RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[4][1] = event.target.value;
        initNodes(4);
    };    
    sliders.push(document.getElementById("Uparm1RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[4][2] = event.target.value;
        initNodes(4);
    };

    
    sliders.push(document.getElementById("Uparm2RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[7][0] = event.target.value;
        initNodes(7);
    };    
    sliders.push(document.getElementById("Uparm2RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[7][1] = event.target.value;
        initNodes(7);
    };    
    sliders.push(document.getElementById("Uparm2RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[7][2] = event.target.value;
        initNodes(7);
    };

    
    sliders.push(document.getElementById("Uparm3RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[10][0] = event.target.value;
        initNodes(10);
    };    
    sliders.push(document.getElementById("Uparm3RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[10][1] = event.target.value;
        initNodes(10);
    };    
    sliders.push(document.getElementById("Uparm3RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[10][2] = event.target.value;
        initNodes(10);
    };

    
    sliders.push(document.getElementById("Uparm4RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[13][0] = event.target.value;
        initNodes(13);
    };    
    sliders.push(document.getElementById("Uparm4RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[13][1] = event.target.value;
        initNodes(13);
    };    
    sliders.push(document.getElementById("Uparm4RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[13][2] = event.target.value;
        initNodes(13);
    };

    
    sliders.push(document.getElementById("Uparm5RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[16][0] = event.target.value;
        initNodes(16);
    };    
    sliders.push(document.getElementById("Uparm5RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[16][1] = event.target.value;
        initNodes(16);
    };    
    sliders.push(document.getElementById("Uparm5RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[16][2] = event.target.value;
        initNodes(16);
    };

    
    sliders.push(document.getElementById("Uparm6RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[19][0] = event.target.value;
        initNodes(19);
    };    
    sliders.push(document.getElementById("Uparm6RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[19][1] = event.target.value;
        initNodes(19);
    };    
    sliders.push(document.getElementById("Uparm6RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[19][2] = event.target.value;
        initNodes(19);
    };

    
    sliders.push(document.getElementById("Uparm7RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[22][0] = event.target.value;
        initNodes(22);
    };    
    sliders.push(document.getElementById("Uparm7RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[22][1] = event.target.value;
        initNodes(22);
    };    
    sliders.push(document.getElementById("Uparm7RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[22][2] = event.target.value;
        initNodes(22);
    };

    
    sliders.push(document.getElementById("Midarm0RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[2][0] = event.target.value;
        initNodes(2);
    };    
    sliders.push(document.getElementById("Midarm0RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[2][1] = event.target.value;
        initNodes(2);
    };    
    sliders.push(document.getElementById("Midarm0RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[2][2] = event.target.value;
        initNodes(2);
    };

    
    sliders.push(document.getElementById("Midarm1RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[5][0] = event.target.value;
        initNodes(5);
    };    
    sliders.push(document.getElementById("Midarm1RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[5][1] = event.target.value;
        initNodes(5);
    };    
    sliders.push(document.getElementById("Midarm1RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[5][2] = event.target.value;
        initNodes(5);
    };

    
    sliders.push(document.getElementById("Midarm2RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[8][0] = event.target.value;
        initNodes(8);
    };
    sliders.push(document.getElementById("Midarm2RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[8][1] = event.target.value;
        initNodes(8);
    };
    sliders.push(document.getElementById("Midarm2RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[8][2] = event.target.value;
        initNodes(8);
    };

    
    sliders.push(document.getElementById("Midarm3RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[11][0] = event.target.value;
        initNodes(11);
    };
    sliders.push(document.getElementById("Midarm3RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[11][1] = event.target.value;
        initNodes(11);
    };
    sliders.push(document.getElementById("Midarm3RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[11][2] = event.target.value;
        initNodes(11);
    };

    
    sliders.push(document.getElementById("Midarm4RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[14][0] = event.target.value;
        initNodes(14);
    };
    sliders.push(document.getElementById("Midarm4RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[14][1] = event.target.value;
        initNodes(14);
    };
    sliders.push(document.getElementById("Midarm4RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[14][2] = event.target.value;
        initNodes(14);
    };

    
    sliders.push(document.getElementById("Midarm5RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[17][0] = event.target.value;
        initNodes(17);
    };
    sliders.push(document.getElementById("Midarm5RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[17][1] = event.target.value;
        initNodes(17);
    };
    sliders.push(document.getElementById("Midarm5RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[17][2] = event.target.value;
        initNodes(17);
    };

    
    sliders.push(document.getElementById("Midarm6RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[20][0] = event.target.value;
        initNodes(20);
    };
    sliders.push(document.getElementById("Midarm6RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[20][1] = event.target.value;
        initNodes(20);
    };
    sliders.push(document.getElementById("Midarm6RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[20][2] = event.target.value;
        initNodes(20);
    };

    
    sliders.push(document.getElementById("Midarm7RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[23][0] = event.target.value;
        initNodes(23);
    };    
    sliders.push(document.getElementById("Midarm7RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[23][1] = event.target.value;
        initNodes(23);
    };    
    sliders.push(document.getElementById("Midarm7RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[23][2] = event.target.value;
        initNodes(23);
    };

    
    sliders.push(document.getElementById("Lowarm0RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[3][0] = event.target.value;
        initNodes(3);
    };    
    sliders.push(document.getElementById("Lowarm0RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[3][1] = event.target.value;
        initNodes(3);
    };
    sliders.push(document.getElementById("Lowarm0RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[3][2] = event.target.value;
        initNodes(3);
    };

    
    sliders.push(document.getElementById("Lowarm1RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[6][0] = event.target.value;
        initNodes(6);
    };    
    sliders.push(document.getElementById("Lowarm1RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[6][1] = event.target.value;
        initNodes(6);
    };    
    sliders.push(document.getElementById("Lowarm1RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[6][2] = event.target.value;
        initNodes(6);
    };

    
    sliders.push(document.getElementById("Lowarm2RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[9][0] = event.target.value;
        initNodes(9);
    };    
    sliders.push(document.getElementById("Lowarm2RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[9][1] = event.target.value;
        initNodes(9);
    };    
    sliders.push(document.getElementById("Lowarm2RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[9][2] = event.target.value;
        initNodes(9);
    };

    
    sliders.push(document.getElementById("Lowarm3RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[12][0] = event.target.value;
        initNodes(12);
    };
    sliders.push(document.getElementById("Lowarm3RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[12][1] = event.target.value;
        initNodes(12);
    };
    sliders.push(document.getElementById("Lowarm3RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[12][2] = event.target.value;
        initNodes(12);
    };

    
    sliders.push(document.getElementById("Lowarm4RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[15][0] = event.target.value;
        initNodes(15);
    };    
    sliders.push(document.getElementById("Lowarm4RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[15][1] = event.target.value;
        initNodes(15);
    };
    sliders.push(document.getElementById("Lowarm4RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[15][2] = event.target.value;
        initNodes(15);
    };

    
    sliders.push(document.getElementById("Lowarm5RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[18][0] = event.target.value;
        initNodes(18);
    };    
    sliders.push(document.getElementById("Lowarm5RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[18][1] = event.target.value;
        initNodes(18);
    };    
    sliders.push(document.getElementById("Lowarm5RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[18][2] = event.target.value;
        initNodes(18);
    };

    
    sliders.push(document.getElementById("Lowarm6RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[21][0] = event.target.value;
        initNodes(21);
    };    
    sliders.push(document.getElementById("Lowarm6RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[21][1] = event.target.value;
        initNodes(21);
    };    
    sliders.push(document.getElementById("Lowarm6RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[21][2] = event.target.value;
        initNodes(21);
    };

    
    sliders.push(document.getElementById("Lowarm7RotateX"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[24][0] = event.target.value;
        initNodes(24);
    };    
    sliders.push(document.getElementById("Lowarm7RotateY"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[24][1] = event.target.value;
        initNodes(24);
    };    
    sliders.push(document.getElementById("Lowarm7RotateZ"))
    
    sliders[sliders.length - 1].onchange = function(event) {
        theta[24][2] = event.target.value;
        initNodes(24);
    };

    for(i=0; i<numNodes; i++) initNodes(i);
    render();
}

function interpolation(frame1, frame2, subframeCount) {
    var newFrames = [];
    console.table(frame1);
    console.table(frame2);

    while (newFrames.length < subframeCount) {
        if (newFrames.length) newFrames.push(JSON.parse(JSON.stringify(newFrames[newFrames.length - 1])));
        else newFrames.push(JSON.parse(JSON.stringify(frame1)));
        for (var part = 0; part < frame1.length; ++part) {
            for (var dim = 0; dim < frame1[part].length; ++dim) {
                var diff = (frame2[part][dim] - frame1[part][dim]) / subframeCount;
                newFrames[newFrames.length - 1][part][dim] += Number(diff);
            }
        }
        ++i;
    }

    newFrames.shift();

    return newFrames;
}

var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    if(playFrames){
        console.log(playFrames, playIndex);
        if(frames.length <= 0){
            window.alert("You did not save frames!!!");
            playFrames = false;
        }
        else{
            for(i=0; i<numNodes; i++){
                theta[i] = JSON.parse(JSON.stringify(frames[playIndex][i])); 
                initNodes(i);
            }
            playIndex++;
            if(playIndex == frames.length){
                playFrames = false;
                playIndex = 0;
            }
            
        }  
    }
    else if(playAnim0){
        for(i=0; i<numNodes; i++){
            theta[i] = JSON.parse(JSON.stringify(animation0[playIndex][i])); 
            initNodes(i);
        }
        playIndex++;
        if(playIndex == animation0.length){
            playAnim0 = false;
            playIndex = 0;
        }
    }
    else if(playAnim1){
        for(i=0; i<numNodes; i++){
            theta[i] = JSON.parse(JSON.stringify(animation1[playIndex][i])); 
            initNodes(i);
        }
        playIndex++;
        if(playIndex == animation1.length){
            playAnim1 = false;
            playIndex = 0;
        }
    }
    else if(playAnim2){
        for(i=0; i<numNodes; i++){
            theta[i] = JSON.parse(JSON.stringify(animation2[playIndex][i])); 
            initNodes(i);
        }
        playIndex++;
        if(playIndex == animation2.length){
            playAnim2 = false;
            playIndex = 0;
        }
    }

    traverse(0);
    requestAnimFrame(render);
}