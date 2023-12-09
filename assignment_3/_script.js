var canvas;
var gl;
var program;
var vertices = [];

function breatherSurfaceCoord(u, v, aa){

    let w = Math.sqrt(1 - Math.pow(aa, 2));
    let denom = aa * (Math.pow(w*Math.cosh(aa*u), 2) + Math.pow(aa*Math.sin(w*u), 2));
    let x = -u + (2*(1 - Math.pow(aa, 2))*Math.cosh(aa*u)*Math.sin(aa*u)) / denom;
    let y = (2*w*Math.cosh(aa*u)*(-w*Math.cos(v)*Math.cos(w*v)-Math.sin(v)*Math.sin(w*v)))/denom; 

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

    

    render();
}

function render() {}