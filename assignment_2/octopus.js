
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

    var accordionIds = [];

    var parts = ["Head", "Uparm", "Midarm", "Lowarm"];
    var partOffsets = ["0", "1", "2", "3", "4", "5", "6", "7"];
    var types =  ["Rotate", "Move"];
    var axises = ["X", "Y", "Z"];

    //var accordions = document.getElementById("sliderAccordion");
    //var exampleAccordion = accordions.children[0];
    //exampleAccordion.hidden = false;
    
    for (var part in parts) {

        /*var newAccordion = exampleAccordion.cloneNode(true);

        if (parts[part] == "Head") {
            for (var pi = 1; pi < 8; ++pi)
                newAccordion.children[1].children[0].children.removeChild(pi);
        }

        newAccordion.id = parts[part] + "Accordion";

        newAccordion.children[0].id = "heading" + parts[part];

        newAccordion.children[0].children[0].setAttribute("data-bs-target", "#collapse" + parts[part]);
        newAccordion.children[0].children[0].setAttribute("data-bs-target", "#collapse" + parts[part]);
        newAccordion.children[0].children[0].setAttribute("aria-controls", "collapse" + parts[part]);
        newAccordion.children[0].children[0].innerText = parts[part] + " Controls";
        
        newAccordion.children[1].id = "collapse" + parts[part];
        newAccordion.children[1].setAttribute("aria-labelledby", "heading" + parts[part]);

        var i = 0;*/
        for (var partOffset in (parts[part] == "Head" ? [partOffsets[0]] : partOffsets)) {
            for (var type in (parts[part] == "Head" ? types : [types[0]])) {
                for (var axis in axises) {
                    accordionIds.push(parts[part] + partOffsets[partOffset] + types[type] + axises[axis]);
                }
            }/*

            var moveSlider0 = newAccordion.children[1].children[0].children[0].cloneNode(true);
            var moveSlider1 = newAccordion.children[1].children[0].children[2].cloneNode(true);
            var moveSlider2 = newAccordion.children[1].children[0].children[4].cloneNode(true);
            
            newAccordion.children[1].children[0].children[0].id = accordionIds[i];
            newAccordion.children[1].children[0].children[0].children[0].id = accordionIds[i++];
            newAccordion.children[1].children[0].children[2].id = accordionIds[i];
            newAccordion.children[1].children[0].children[2].children[0].id = accordionIds[i++];
            newAccordion.children[1].children[0].children[4].id = accordionIds[i];
            newAccordion.children[1].children[0].children[4].children[0].id = accordionIds[i++];

            if (parts[part] == "Head") {
                var headAccordion = newAccordion.cloneNode(true);
                moveSlider0.id = accordionIds[i];
                moveSlider0.children[0].id = accordionIds[i++];
                headAccordion.children[1].children[0].appendChild(moveSlider0);
                moveSlider1.id = accordionIds[i];
                moveSlider1.children[0].id = accordionIds[i++];
                headAccordion.children[1].children[0].appendChild(moveSlider1);
                moveSlider2.id = accordionIds[i];
                moveSlider2.children[0].id = accordionIds[i++];
                headAccordion.children[1].children[0].appendChild(moveSlider2);
            }*/
        }
        //accordions.appendChild(parts[part] == "Head" ? headAccordion : newAccordion);
    }
    //exampleAccordion.hidden = true;
    //console.log(accordionIds);
    
    
    document.getElementById("Head0RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Head0RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Head0RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    /*document.getElementById("Head0MoveX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Head0MoveY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Head0MoveZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };*/

    
    document.getElementById("Uparm0RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm0RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm0RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm1RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm1RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm1RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm2RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm2RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm2RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm3RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm3RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm3RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm4RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm4RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm4RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm5RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm5RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm5RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm6RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm6RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm6RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm7RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm7RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Uparm7RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm0RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm0RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm0RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm1RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm1RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm1RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm2RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm2RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm2RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm3RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm3RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm3RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm4RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm4RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm4RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm5RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm5RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm5RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm6RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm6RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm6RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm7RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm7RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Midarm7RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm0RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm0RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm0RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm1RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm1RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm1RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm2RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm2RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm2RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm3RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm3RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm3RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm4RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm4RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm4RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm5RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm5RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm5RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm6RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm6RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm6RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm7RotateX").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm7RotateY").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    
    document.getElementById("Lowarm7RotateZ").onchange = function(event) {
        theta[0][0] = event.target.value;
        initNodes(0);
    };

    /*
        document.getElementById("slider9").onchange = function() {
        theta[rightLowerLegId] = event.srcElement.value;
        initNodes(rightLowerLegId);
    };
    document.getElementById("slider10").onchange = function() {
         theta[head2Id] = event.srcElement.value;
         initNodes(head2Id);
    };*/

    for(i=0; i<numNodes; i++) initNodes(i);
    render();
}


var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    traverse(0);
    requestAnimFrame(render);
}