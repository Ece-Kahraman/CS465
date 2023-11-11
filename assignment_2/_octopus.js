
var gl;
var points;
var vertex_count;



window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    
    // Four Vertices
    
    var node1 = createNode( 0, [], [vec3(0,  -.5, 0), vec3(0, -.4, 0), vec3(-.5, -.5, 0), vec3(-.5, -.4, 0)], 0, 0);
    console.log( node1 );
    node1.children.push(createNode(node1, [], [vec3( .1,  -.5, 0 ), vec3( .1, -.4, 0 ), vec3( .6, -.5, 0), vec3( .6, -.4, 0)], 0, 0));
    node1.children.push(createNode(node1, [], [vec3(0,  .5, 0), vec3(0, .4, 0), vec3(-.5, .5, 0), vec3(-.5, .4, 0)], 0, 0));

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
    console.log(flatten(anan));

    var flat = [];

    for (let index = 0; index < flatten(anan).length; index++) {
      if((index+1) % 3 ) {
        flat.push(flatten(anan)[index]);
      }      
    }

    console.log(flat);

    gl.bufferData(gl.ARRAY_BUFFER, flatten(flat), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    vertex_count = anan.length;
    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    for (let index = 0; index < vertex_count; index+=4) {
      gl.drawArrays( gl.TRIANGLE_STRIP, index, 4 );
    }
    
    //requestAnimFrame(render); TBC
    
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

function transformNode( root, transform_mat ){

  root.vertices.forEach(vertex => {
    let v4 = mult(transform_mat, vec4(vertex, 0));
    console.log(v4);

  });

  root.children.forEach(child => {
    transformNode(child, transform_mat);
  });

}

function calculateTransformMatrix( type = "anancı", trans_vec = vec3(), angle = 0, axis = vec3(0, 0, 1), to_origin = vec3()){

  console.log(...arguments);
  var result;

  switch (type) {
    case "translate":

      result = translate(trans_vec);      
      break;

    case "rotate":
      var origin_matrix = translate(-to_origin[0], -to_origin[1], -to_origin[2]);
      var anti_origin_matrix = translate(to_origin[0], to_origin[1], to_origin[2]);

      console.log(origin_matrix, anti_origin_matrix);

      
      result = mult( anti_origin_matrix, mult( rotate(angle, axis), origin_matrix));
      console.log(result);
      break;
  
    default:
      result = "anan";
      break;
  }

  return result;

}
