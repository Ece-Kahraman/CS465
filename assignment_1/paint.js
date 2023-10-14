

var gl;
var points;
var canvas;
var program;
var buffer;
var triangle;
var square;
var square_size = 20;
var pointX;
var pointY;
let vertex_arrays = {};
var mouseClicked = false;
var index = 0;
var color_index = 0;
var maxNumTriangles = 3600;
var maxNumVertices  = 3 * maxNumTriangles;

var colors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    console.log("Canvas: (%s, %s)", canvas.width, canvas.height);

    color_menu = document.getElementById("color-menu");

    canvas.addEventListener("mousedown", function () {
        console.log("mouse down");
        mouseClicked = true;
    });

    canvas.addEventListener("mouseup", function () {
        console.log("mouse up");
        mouseClicked = false;
    });

    canvas.addEventListener("mousemove", function (event) {
        console.log("Mouse: (%s, %s)", event.clientX, event.clientY);

        if (mouseClicked) {

            pointX = event.clientX - 8;
            pointY = event.clientY - 8;

            square = findSquareLocation(pointX, pointY);
            triangle = findTriangleLocation(pointX, pointY, square.column, square.row);

            var square_center = {
                "x": ((square.column - 1) * square_size) + (square_size/2),
                "y": ((square.row - 1) * square_size) + (square_size/2)
            };

            var coordinates = getTriangleCoordinates(triangle);

            p1 = convertLocation(coordinates.v1.x, coordinates.v1.y);
            p2 = convertLocation(coordinates.v2.x, coordinates.v2.y);
            p3 = convertLocation(square_center.x, square_center.y);

            vertex_arrays = [
                p1.x, p1.y,
                p2.x, p2.y,
                p3.x, p3.y
            ];

            console.log(vertex_arrays);
            gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer ); 
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(vertex_arrays));

            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            var color = vec4(colors[color_menu.selectedIndex]);
            for( var i = 0; i < 3; i++){
                gl.bufferSubData(gl.ARRAY_BUFFER, 16*color_index, flatten(color));
                color_index++;
            }            

            index += 3;
            console.log(index);
        }
    });

    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    //  Load shaders and initialize attribute buffers

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    // Load the data into the GPU

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumVertices, gl.DYNAMIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Associate out shader variables with our data buffer

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );


    render();
};


function render() {
    console.log("render");
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, index);
    //gl.drawElements(gl.TRIANGLES, index, gl.UNSIGNED_SHORT, 0);
    requestAnimFrame(render);
}

function findSquareLocation(x, y) {

    var sq_column = Math.floor(x / square_size) + 1;
    var sq_row = Math.floor(y / square_size) + 1;

    if (x == canvas.width) { sq_column--; }
    if (y == canvas.height) { sq_row--; }

    return { "row": sq_row, "column": sq_column };

}

function findTriangleLocation(x, y, sq_col, sq_row) {

    var result = "";

    // "relative" means that treat each square 
    // like it is the main 20*20 HTML square

    var relativeX = x - ((sq_col - 1) * square_size);
    var relativeY = y - ((sq_row - 1) * square_size);

    if (relativeX < relativeY && (relativeX + relativeY) < square_size) { result = "L"; }
    else if (relativeX < relativeY && (relativeX + relativeY) >= square_size) { result = "D"; }
    else if (relativeX >= relativeY && (relativeX + relativeY) < square_size) { result = "U"; }
    else if (relativeX >= relativeY && (relativeX + relativeY) >= square_size) { result = "R"; }

    return result;

}

function getTriangleCoordinates(triangle_direction){

    switch (triangle_direction) {                
        // #1: top-left corner
        // #2: top-right corner
        // #3: bottom-left corner
        // #4: bottom-right corner

        case "L":                    
            vertex1 = { "x": (square.column - 1) * square_size, "y": (square.row - 1) * square_size }; // #1                    
            vertex2 = { "x": (square.column - 1) * square_size, "y": square.row * square_size }; // #3
            break;

        case "U":
            vertex1 = { "x": (square.column - 1) * square_size, "y": (square.row - 1) * square_size }; // #1
            vertex2 = { "x": square.column * square_size, "y": (square.row - 1) * square_size }; // #2
            break;

        case "R":                    
            vertex1 = { "x": square.column * square_size, "y": (square.row - 1) * square_size }; // #2
            vertex2 = { "x": square.column * square_size, "y": square.row * square_size }; // #4
            break;

        case "D":                    
            vertex1 = { "x": (square.column - 1) * square_size, "y": square.row * square_size }; // #3
            vertex2 = { "x": square.column * square_size, "y": square.row * square_size }; // #4
            break;

        default:
            console.log("no triangle ??");
    }

    return {"v1": vertex1, "v2": vertex2};

}

function convertLocation(x, y) {

    return {
        "x": (x - (canvas.width / 2)) / (canvas.width / 2),
        "y": ((y - (canvas.width / 2)) * -1) / (canvas.width / 2)
    };

}

