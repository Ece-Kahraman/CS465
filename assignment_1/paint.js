var gl;
var points;
var canvas;
var undoButton;
var redoButton;
var selectFlag = false;
var selectStart = [], selectEnd = [];
var program;
var buffer;
var triangle;

var triangles_list = [];
for (let layer = 0; layer < 4; layer++) {
    triangles_list.push([]);
    for (let column = 0; column < 30; column++) {
        triangles_list[layer].push([]);
        for (let row = 0; row < 30; row++) {
            triangles_list[layer][column].push([]);
            for (let triangle = 0; triangle < 4; triangle++) {
                if (layer == 3) {
                    triangles_list[layer][column][row].push(0);
                } else {
                    triangles_list[layer][column][row].push(-1);
                }
}}}}

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
var maxNumVertices = 3 * maxNumTriangles;

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
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0)   // white
];

var draw_mode;
var erase_mode;
var layer = 0;
var layers;
var swap_buttons;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    undoButton = document.getElementById("undoButton");
    redoButton = document.getElementById("redoButton");
    draw_mode = document.getElementById("draw-mode");
    erase_mode = document.getElementById("erase-mode");
    color_menu = document.getElementById("color-menu");
    selection = document.getElementById("select");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    layers = [
        document.getElementById("0"),
        document.getElementById("1"),
        document.getElementById("2"),
    ];

    for (let i = 0; i < layers.length; layers[i++].checked = !Boolean(i-1));

    swap_buttons= [
        document.getElementById("swap12"),
        document.getElementById("swap13"),
        document.getElementById("swap23")
    ]
    
    for (let i = 0; i < layers.length; i++) {
        layers[i].addEventListener("click", function() {
            layer = i;
        });
    }

    for (let _i = 0; _i < swap_buttons.length; _i++) {
        swap_buttons[_i].addEventListener("click", function() {
            [triangles_list[_i], triangles_list[(_i+1)%swap_buttons.length]] 
            = [triangles_list[(_i+1)%swap_buttons.length], triangles_list[_i]]
    
            for( var i = 0; i < maxNumTriangles; i++ ){
                drawTriangle(determineTopLayerColor(i), i, vBuffer, cBuffer, 0);
            }
        });
    }

    undoButton.addEventListener("click", function () {
        if (!undoStack.length) return;
        var lastStroke = undoStack.pop();
        var t = lastStroke.pop();

        lastStroke.forEach(e => {
            var tri = e % 4;
            var row = Math.floor((e % 120) / 4);
            var column = Math.floor(e / 120);

            index = tri + row * 4 + column * 120;

            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            for (var i = 0; i < 3; i++) {
                gl.bufferSubData(gl.ARRAY_BUFFER, 48 * index + 16 * i, flatten(vec4(0.0, 0.0, 0.0, 0.0)));
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

            index = tri + row * 4 + column * 120;

            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            for (var i = 0; i < 3; i++) {
                gl.bufferSubData(gl.ARRAY_BUFFER, 48 * index + 16 * i, flatten(colors[color]));
            }

        });

        nextStroke.push(color);
        undoStack.push(nextStroke);

        if (undoStack.length > maxStackSize) {
            undoStack.shift();
        }
        console.log(undoStack, redoStack);
    });

    selection.addEventListener("click", function() {
        selectFlag = !selectFlag;
    });

    canvas.addEventListener("wheel", function (e) {
        var direction = e.deltaY > 0 ? -1 : 1;

        var dummy = scaling_matrix[0][0] + direction * 0.1;
        if (dummy <= 0.1 || dummy >= 10) {
            return;
        }

        scaling_matrix[0][0] += direction * 0.15;
        scaling_matrix[1][1] += direction * 0.15;
        scaling_matrix[2][2] += direction * 0.15;

    });

    canvas.addEventListener("mousedown", function (e) {

        if (selectFlag) {
            selectStart = [square.column, square.row, triangle];
            console.log(selectStart);
        } else {
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
        }

    });

    canvas.addEventListener("mouseup", function (e) {
        if (selectFlag) { 
            selectEnd = [square.column, square.row, triangle];
            console.log(selectEnd);

            for (let col = selectStart[0]; col < selectEnd[0]; col++) {
                for (let row = selectStart[1]; row < selectEnd[1]; row++) {
                    for (let tri = 0; tri < 4; tri++) {
                        triangles_list[3][col][row][tri] = 1
                        var i = tri + row * 4 + col * 120;
                        drawTriangle(determineTopLayerColor(i), i, vBuffer, cBuffer, 
                            triangles_list[3][col][row][tri] );
                    }
                }
            }
        } else {
            if (e.button != 0) {
                return;
            }
            if (draw_mode.checked == true) {
                mouseClicked = false;
            } else if (erase_mode.checked == true) {
                eraserClicked = false;
            }
        }
    });

    canvas.addEventListener("mousemove", function (e) {


        var dum = 1 - scaling_matrix[0][0];
        pointX = (((e.clientX - 8) - ((dum * canvas.width) / 2)) / (canvas.width - dum * canvas.width)) * canvas.width;
        pointY = (((e.clientY - 8) - ((dum * canvas.height) / 2)) / (canvas.height - dum * canvas.height)) * canvas.height;

        if ( pointX < ((dum * canvas.width) / 2) ) {
            pointX = ((dum * canvas.width) / 2);
        } else if ( (canvas.width - (dum * canvas.width) / 2) < pointX ) {
            pointX = (canvas.width - (dum * canvas.width) / 2);
        }
        if ( pointY < ((dum * canvas.height) / 2) ) {
            pointY = ((dum * canvas.height) / 2);
        } else if ( (canvas.height - (dum * canvas.height) / 2) < pointY ) {
            pointY = (canvas.height - (dum * canvas.height) / 2);
        }

        square = findSquareLocation(pointX, pointY);
        triangle = findTriangleLocation(pointX, pointY, square.column, square.row);

        if (e.buttons == 1) {

            if (selectFlag) return;

            index = triangle + square.row * 4 + square.column * 120;

            triangles_list[layer][square.column][square.row][triangle] = color_menu.selectedIndex;

            var top_color = determineTopLayerColor(index);
            drawTriangle(top_color, index, vBuffer, cBuffer,
                triangles_list[3][square.column][square.row][triangle]);

            if (!changeBuffer.includes(index))
                changeBuffer.push(index);



        } else if (e.buttons == 4) {
            translation_matrix[0][3] = last_pos_matrix[0][3] + (2 * (pointX - drag_start.x) / canvas.width);
            translation_matrix[1][3] = last_pos_matrix[1][3] - (2 * (pointY - drag_start.y) / canvas.height);

        }
        else {
            if (changeBuffer.length) {
                undoStack.push([...changeBuffer, color_menu.selectedIndex]);
                redoStack = [];
                changeBuffer = [];

                if (undoStack.length > maxStackSize) {
                    undoStack.shift();
                }
            }
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
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.DYNAMIC_DRAW);


    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Associate out shader variables with our data buffer

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.DYNAMIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    uni_loc = { matrix: gl.getUniformLocation(program, "matrix") };

    var uBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.DYNAMIC_DRAW);

    render();
};


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    transformation_matrix = mult(translation_matrix, mult(scaling_matrix, mat4(1)));
    gl.uniformMatrix4fv(uni_loc.matrix, false, flatten(transformation_matrix));
    gl.drawArrays(gl.TRIANGLES, 0, maxNumVertices);

    requestAnimFrame(render);
}

function findSquareLocation(x, y) {

    var sq_column = Math.floor(x / square_size) + 1;
    var sq_row = Math.floor(y / square_size) + 1;

    if (x == canvas.width) { sq_column--; }
    if (y == canvas.height) { sq_row--; }

    return { "row": sq_row - 1, "column": sq_column - 1 };
}

function findTriangleLocation(x, y, sq_col, sq_row) {

    // "relative" means that treat each square 
    // like it is the main 20*20 HTML square

    var relativeX = x - (sq_col * square_size);
    var relativeY = y - (sq_row * square_size);

    if (relativeX < relativeY && (relativeX + relativeY) < square_size) { return 0; }
    else if (relativeX < relativeY && (relativeX + relativeY) >= square_size) { return 1; }
    else if (relativeX >= relativeY && (relativeX + relativeY) < square_size) { return 2; }
    else if (relativeX >= relativeY && (relativeX + relativeY) >= square_size) { return 3; }

    return 0; // just in case
}

function getTriangleCoordinates(triangle_direction, sq_col, sq_row) {

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

    return { "v1": vertex1, "v2": vertex2 };
}

function convertLocation(x, y) {

    return {
        "x": (x - (canvas.width / 2)) / (canvas.width / 2),
        "y": ((y - (canvas.width / 2)) * -1) / (canvas.width / 2)
    };
}

function drawTriangle(color_index, index, vBuffer, cBuffer, selected){

    var tri = index % 4;
    var row = Math.floor((index % 120) / 4);
    var column = Math.floor(index / 120);

    var square_center = {
        "x": (column * square_size) + (square_size / 2),
        "y": (row * square_size) + (square_size / 2)
    };

    var coordinates = getTriangleCoordinates(tri, column, row);

    var p1 = convertLocation(coordinates.v1.x, coordinates.v1.y);
    var p2 = convertLocation(coordinates.v2.x, coordinates.v2.y);
    var p3 = convertLocation(square_center.x, square_center.y);

    var vertex_arrays = [
        p1.x, p1.y,
        p2.x, p2.y,
        p3.x, p3.y
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 24 * index, flatten(vertex_arrays));

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);

    if (draw_mode.checked) {
        color = colors[color_index];
    } else if (erase_mode.checked) {
        color = vec4(0.0, 0.0, 0.0, 0.0);
    }

    selected_color = [...color];
    selected_color[3] = 0.3;

    for (var i = 0; i < 3; i++) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 48 * index + 16 * i, flatten(selected && i ? selected_color : color));
    }
}

function determineTopLayerColor(index){

    var tri = index % 4;
    var row = Math.floor((index % 120) / 4);
    var column = Math.floor(index / 120);

    for ( var layer = 0; layer < layers.length; layer++ ){
        if (triangles_list[layer][column][row][tri] == -1){
            continue;
        }

        return triangles_list[layer][column][row][tri];
    }

    return colors.length-1;

}
