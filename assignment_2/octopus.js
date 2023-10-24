
var gl;
var points;



window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    
    // Four Vertices
    
    var node1 = createNode( 0, [], [vec2(0,  -.5), vec2(0, -.4), vec2(-.5, -.5), vec2(-.5, -.4)], 0, 0);
    console.log( node1 );
    node1.children.push(createNode(node1, [], [vec2( .1,  -.5 ), vec2( .1, -.4 ), vec2( .6, -.5), vec2( .6, -.4)], 0, 0));

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0, 0, 0, 1 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );

    var anan = [];
    anan = traverse(node1, anan);
    console.log(anan);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(anan), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render(anan.length);
};


function render(vertex_count) {
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    console.log(gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE));
    for (let index = 0; index < vertex_count; index+=4) {
      gl.drawArrays( gl.TRIANGLE_STRIP, index, 4 );
    }
    
}


// DONT FORGET TO CONVERT COORDINATES !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function createNode(parent, children, vertices, joints, color) {
  return {
    parent: parent,
    children: children,
    vertices: vertices,
    joints: joints,
    color: color
  };
}

function traverse( root, array ){
  
  array = array.concat(root.vertices);
  
  
  if( root.children.length == 0 ){
    return array;
  }
  root.children.forEach(child => {
    array = traverse(child, array);
  });
  
  return array;
}
