var gl;
var points;
var canvas;
var undoButton;
var redoButton;
var program;
var buffer;
var triangle;
var square;
var square_size = 20;
var color;
var pointX;
var pointY;
let vertex_arrays = {};
var mouseClicked = false;
var eraserClicked = false;
var index;
var maxNumTriangles = 3600;
var maxNumVertices  = 3 * maxNumTriangles;

var undoStack = [], redoStack = [];
var maxStackSize = 32;
var changeBuffer = [];

var transformation_matrix;
var scaling_matrix = mat4(1);
var translation_matrix = mat4(1);
var last_pos_matrix = mat4(1);
var uni_loc;

var drag_start = {
    x: -1,
    y: -1
};

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
    undoButton = document.getElementById("undoButton");
    redoButton = document.getElementById("redoButton");
    draw_mode = document.getElementById("draw-mode");
    erase_mode = document.getElementById("erase-mode");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    color_menu = document.getElementById("color-menu");


    undoButton.addEventListener("click", function () {
        if (!undoStack.length) return;
        var lastStroke = undoStack.pop();
        var t = lastStroke.pop();

        lastStroke.forEach(e => {
            var tri = e % 4;
            var row = Math.floor((e % 120) / 4);
            var column = Math.floor(e / 120);
            console.log(tri, " ", row, " ", column);
            
            index = tri + row * 4 + column * 120;
       
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            for( var i = 0; i < 3; i++) {
                gl.bufferSubData(gl.ARRAY_BUFFER, 48*index+16*i, flatten(vec4(0.0, 0.0, 0.0, 0.0)));
            }

        });

        lastStroke.push(t);
        redoStack.push(lastStroke);

        if (redoStack.length > maxStackSize) {
            redoStack.shift();
        } 
        console.log(undoStack, redoStack);
    });

    redoButton.addEventListener("click", function (e) {
        if (!redoStack.length || e.button != 0) return;
        var nextStroke = redoStack.pop();
        var color = nextStroke.pop();

        nextStroke.forEach(e => {
            var tri = e % 4;
            var row = Math.floor((e % 120) / 4);
            var column = Math.floor(e / 120);

            console.log(tri, " ", row, " ", column);
            
            index = tri + row * 4 + column * 120;
        
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            for( var i = 0; i < 3; i++) {
                gl.bufferSubData(gl.ARRAY_BUFFER, 48*index+16*i, flatten(colors[color]));
            }

        });

        nextStroke.push(color);
        undoStack.push(nextStroke);

        if (undoStack.length > maxStackSize) {
            undoStack.shift();
        } 
        console.log(undoStack, redoStack);
    });

    canvas.addEventListener("mousedown", function (e) {
        
        switch (e.button) {
            case 0: //sol
                break;
            
            case 1: //wheel
                last_pos_matrix[0][3] = translation_matrix[0][3];
                last_pos_matrix[1][3] = translation_matrix[1][3];

                drag_start.x = e.clientX;
                drag_start.y = e.clientY;

                break;

            case 2: //sağ
                break;

            default:
                alert("This mouse button is not usable!");
                return;
        }
        
    });

    canvas.addEventListener("mouseup", function (e) {
        if (e.button != 0) {
            return;   
        }
        if(draw_mode.checked == true){
            mouseClicked = false;
        } else if(erase_mode.checked == true){
            eraserClicked = false;
        }
    });

    canvas.addEventListener("mousemove", function (e) {
        
        if ( e.buttons == 1 ) {
            
            pointX = e.clientX - 8;
            pointY = e.clientY - 8;

           if ( e.buttons == 1 ){

                square = findSquareLocation(pointX, pointY);
                triangle = findTriangleLocation(pointX, pointY, square.column, square.row);

                index = triangle + square.row * 4 + square.column * 120;

        
                gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);

                if(draw_mode.checked) {        
                    color = colors[color_menu.selectedIndex];
                } else if (erase_mode.checked) {
                    color = vec4( 0.0, 0.0, 0.0, 0.0 );         
                }

                for( var i = 0; i < 3; i++) {
                    gl.bufferSubData(gl.ARRAY_BUFFER, 48*index+16*i, flatten(color));
                }

                if (!changeBuffer.includes(index))
                    changeBuffer.push(index);

                

           } else if (e.buttons == 4) {
                translation_matrix[0][3] = last_pos_matrix[0][3] + (2 * (pointX - drag_start.x) / canvas.width);
                translation_matrix[1][3] = last_pos_matrix[1][3] - (2 * (pointY - drag_start.y) / canvas.height);

           }
        }
        else {
            if (changeBuffer.length) {
                undoStack.push([...changeBuffer, color_menu.selectedIndex]);
                redoStack = [];
                changeBuffer = [];
                console.log(undoStack);

                if (undoStack.length > maxStackSize) {
                    undoStack.shift();
                }
            }
        }
    });

    canvas.addEventListener("wheel", function (e) {
        var direction = e.deltaY > 0 ? -1 : 1;

        var dummy = scaling_matrix[0][0] + direction * 0.1;
        if( dummy <= 0.1  || dummy >= 10 ){
            return;
        }

        scaling_matrix[0][0] += direction * 0.15;
        scaling_matrix[1][1] += direction * 0.15;
        scaling_matrix[2][2] += direction * 0.15;

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
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.DYNAMIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    for( var i = 0; i < maxNumTriangles; i++) {

        var tri = i % 4;
        var row = Math.floor((i % 120) / 4);
        var column = Math.floor(i / 120);

        var square_center = {
            "x": (column  * square_size) + (square_size/2),
            "y": (row * square_size) + (square_size/2)
        };

        var coordinates = getTriangleCoordinates(tri, column, row);

        p1 = convertLocation(coordinates.v1.x, coordinates.v1.y);
        p2 = convertLocation(coordinates.v2.x, coordinates.v2.y);
        p3 = convertLocation(square_center.x, square_center.y);

        vertex_arrays = [
            p1.x, p1.y,
            p2.x, p2.y,
            p3.x, p3.y
        ];

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferSubData(gl.ARRAY_BUFFER, 24*i, flatten(vertex_arrays));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        for( var j = 0; j < 3; j++) {
            gl.bufferSubData(gl.ARRAY_BUFFER, 48*i+16*j, flatten(vec4(0.0, 0.0, 0.0, 0.0)));
        }

    }

    uni_loc = { matrix: gl.getUniformLocation(program, "matrix") };

    render();
};


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    
    gl.drawArrays(gl.TRIANGLES, 0, maxNumVertices);
    transformation_matrix = mult(translation_matrix, mult(scaling_matrix, mat4(1)));
    gl.uniformMatrix4fv(uni_loc.matrix, false, flatten(transformation_matrix));

    requestAnimFrame(render);
}

function findSquareLocation(x, y) {

    var sq_column = Math.floor(x / square_size) + 1;
    var sq_row = Math.floor(y / square_size) + 1;

    if (x == canvas.width) { sq_column--; }
    if (y == canvas.height) { sq_row--; }

    return { "row": sq_row-1, "column": sq_column-1 };
}

function findTriangleLocation(x, y, sq_col, sq_row) {

    // "relative" means that treat each square 
    // like it is the main 20*20 HTML square

    var relativeX = x - (sq_col  * square_size);
    var relativeY = y - (sq_row  * square_size);

    if (relativeX < relativeY && (relativeX + relativeY) < square_size) { return 0; }
    else if (relativeX < relativeY && (relativeX + relativeY) >= square_size) { return 1; }
    else if (relativeX >= relativeY && (relativeX + relativeY) < square_size) { return 2; }
    else if (relativeX >= relativeY && (relativeX + relativeY) >= square_size) { return 3; }

    return 0; // just in case
}

function getTriangleCoordinates(triangle_direction, sq_col, sq_row){

    switch (triangle_direction) {                
        // #1: top-left corner
        // #2: top-right corner
        // #3: bottom-left corner
        // #4: bottom-right corner

        case 0:                    
            vertex1 = { "x": sq_col * square_size, "y": sq_row * square_size }; // #1                    
            vertex2 = { "x": sq_col * square_size, "y": (sq_row + 1) * square_size }; // #3
            break;

        case 1:                    
            vertex1 = { "x": sq_col * square_size, "y": (sq_row + 1) * square_size }; // #3
            vertex2 = { "x": (sq_col + 1) * square_size, "y": (sq_row + 1) * square_size }; // #4
            break;

        case 2:
            vertex1 = { "x": sq_col * square_size, "y": sq_row * square_size }; // #1
            vertex2 = { "x": (sq_col + 1) * square_size, "y": sq_row * square_size }; // #2
            break;

        case 3:                    
            vertex1 = { "x": (sq_col + 1) * square_size, "y": sq_row * square_size }; // #2
            vertex2 = { "x": (sq_col + 1) * square_size, "y": (sq_row + 1) * square_size }; // #4
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