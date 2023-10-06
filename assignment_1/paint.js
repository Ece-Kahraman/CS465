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
let vertices = [];
let vertex_arrays = {};
var mouseClicked = false;
var point_counter = 0;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    console.log("Canvas: (%s, %s)", canvas.width, canvas.height);

    canvas.addEventListener("mousedown", function () {
        console.log("mouse down");
        mouseClicked = true;
        point_counter++;
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

            var vertex1;
            var vertex2;

            switch (triangle) {                
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

            p1 = convertLocation(vertex1.x, vertex1.y);
            p2 = convertLocation(vertex2.x, vertex2.y);
            p3 = convertLocation(square_center.x, square_center.y);

            vertex_arrays = [
                p1.x, p1.y,
                p2.x, p2.y,
                p3.x, p3.y
            ];

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);

            //  Load shaders and initialize attribute buffers

            program = initShaders(gl, "vertex-shader", "fragment-shader");
            gl.useProgram(program);


            // Load the data into the GPU

            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(vertex_arrays), gl.DYNAMIC_DRAW);


            // Associate out shader variables with our data buffer
            render();
        }
    });

    canvas.addEventListener("mouseup", function () {
        console.log("mouse up");
        mouseClicked = false;
        point_counter = 0;
    });

/*
    canvas.addEventListener("click", function (event) {
        pointX = event.clientX - 8;
        pointY = event.clientY - 8;

        square = findSquareLocation(pointX, pointY);
        triangle = findTriangleLocation(pointX, pointY, square.column, square.row);

        var square_center = {
            "x": ((square.column - 1) * square_size) + (square_size/2),
            "y": ((square.row - 1) * square_size) + (square_size/2)
        };

        var vertex1;
        var vertex2;

        switch (triangle) {

            case "L":
                // #1
                vertex1 = { "x": (square.column - 1) * square_size, "y": (square.row - 1) * square_size };

                // #3
                vertex2 = { "x": (square.column - 1) * square_size, "y": square.row * square_size };

                break;

            case "U":
                // #1
                vertex1 = { "x": (square.column - 1) * square_size, "y": (square.row - 1) * square_size };

                // #2
                vertex2 = { "x": square.column * square_size, "y": (square.row - 1) * square_size };
                break;

            case "R":
                // #2
                vertex1 = { "x": square.column * square_size, "y": (square.row - 1) * square_size };

                // #4
                vertex2 = { "x": square.column * square_size, "y": square.row * square_size };
                break;

            case "D":
                // #3
                vertex1 = { "x": (square.column - 1) * square_size, "y": square.row * square_size };

                // #4
                vertex2 = { "x": square.column * square_size, "y": square.row * square_size };
                break;

            default:
                console.log("no triangle ??");
        }

        p1 = convertLocation(vertex1.x, vertex1.y);
        p2 = convertLocation(vertex2.x, vertex2.y);
        p3 = convertLocation(square_center.x, square_center.y);

        vertexes = [
            vec2(p1.x, p1.y),
            vec2(p2.x, p2.y),
            vec2(p3.x, p3.y)
        ];

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        //  Load shaders and initialize attribute buffers

        var program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);


        // Load the data into the GPU

        var bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexes), gl.STATIC_DRAW);


        // Associate out shader variables with our data buffer

        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);


        render();

    });
*/

    // Three Vertices
    /*
    var vertices = [
        vec2(0.25, -0.75),
        vec2(0.5, -0.25),
        vec2(0.75, -0.75)
    ];
    */

    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //  Load shaders and initialize attribute buffers

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);


    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    render();
};


function render() {

    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.drawArrays(gl.TRIANGLES, 0, 3);    

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

function convertLocation(x, y) {

    return {
        "x": (x - (canvas.width / 2)) / (canvas.width / 2),
        "y": ((y - (canvas.width / 2)) * -1) / (canvas.width / 2)
    };

}
