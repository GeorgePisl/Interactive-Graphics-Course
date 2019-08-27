"use strict";

//scling and translating matrices
var scale = [1, 1, 1];
var translat = [0, 0, 0];

var canvas;
var gl;

var numVertices = 36;

var numChecks = 64;

var texSize = 64;

var program;

var c;

var flag = true;


//texture: create a checkerboard pattern using floats
var image1 = new Array()
for (var i = 0; i < texSize; i++) image1[i] = new Array();
for (var i = 0; i < texSize; i++) {
  for (var j = 0; j < texSize; j++) {
    image1[i][j] = new Float32Array(4);
  }
}
for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
    image1[i][j] = [c, c, c, 1];
  }

// Convert floats to ubytes for texture
var image2 = new Uint8Array(4 * texSize * texSize);
// Create a checkerboard pattern
for ( var i = 0; i < texSize; i++ ) {
    for ( var j = 0; j <texSize; j++ ) {
        image2[4*i*texSize+4*j] = 127+127*Math.sin(0.1*i*j);
        image2[4*i*texSize+4*j+1] = 127+127*Math.sin(0.1*i*j);
        image2[4*i*texSize+4*j+2] = 127+127*Math.sin(0.1*i*j);
        image2[4*i*texSize+4*j+3] = 255;
       }
}
var pointsArray = [];
var normalsArray = [];
var texCoordsArray = [];
//var colorsArray = []; not used because point 5

var texCoord = [
  vec2(0, 0),
  vec2(0, 1),
  vec2(1, 1),
  vec2(1, 0)
];

var vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0)
];

//not used because point 5
/*var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];*/


//camera vars
var near = 0.3;
var far = 3;
var radius = 1.5;
var theta = 0.0;
var phi = 0.0;

var left = -0.75;
var right = 0.75;
var ytop = 1.5;
var bottom = -1.5;

var fovy = 111.0;
var aspect = 0.5; // width/height of canvas

//projections vars
var mvMatrix, pMatrix1, pMatrix2;
var modelView, projection;
var eye;

//scaling vars
var scaleMatrixLocation;
var scaleMatrix;

//translations vars
var translateMatrixLocation;
var translateMatrix;

//light vars
var lightPosition = vec4(2.0, 2.0, 0.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

//material vars
var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var viewerPos;

//Shading var
var changeShading = true;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var thetaLoc;

//funciont to configure the texture of the object
function configureTexture(image) {
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
    gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}


// quad uses first index to set color for face
//colorsArray.push(vertexColors[a]) function was replaced because point 5
function quad(a, b, c, d) {

  var t1 = subtract(vertices[b], vertices[a]);
  var t2 = subtract(vertices[c], vertices[b]);
  var normal = cross(t1, t2);
  var normal = vec3(normal);

  pointsArray.push(vertices[a]);
  normalsArray.push(normal);
  texCoordsArray.push(texCoord[0]);

  pointsArray.push(vertices[b]);
  normalsArray.push(normal);
  texCoordsArray.push(texCoord[1]);

  pointsArray.push(vertices[c]);
  normalsArray.push(normal);
  texCoordsArray.push(texCoord[2]);

  pointsArray.push(vertices[a]);
  normalsArray.push(normal);
  texCoordsArray.push(texCoord[0]);

  pointsArray.push(vertices[c]);
  normalsArray.push(normal);
  texCoordsArray.push(texCoord[2]);

  pointsArray.push(vertices[d]);
  normalsArray.push(normal);
  texCoordsArray.push(texCoord[3]);
}

// Each face determines two triangles
function colorCube() {
  quad(1, 0, 3, 2);
  quad(2, 3, 7, 6);
  quad(3, 0, 4, 7);
  quad(6, 5, 1, 2);
  quad(4, 5, 6, 7);
  quad(5, 4, 0, 1);
}


window.onload = function init() {

  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  colorCube();

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  //texture
  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  configureTexture(image2);

  viewerPos = vec3(0.0, 0.0, -20.0);

  modelView = gl.getUniformLocation(program, "modelView");
  projection = gl.getUniformLocation(program, "projection");

  scaleMatrixLocation = gl.getUniformLocation(program, "scaleMatrix");
  translateMatrixLocation = gl.getUniformLocation(program, "translateMatrix");

  //light
  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition));

  gl.uniform1f(gl.getUniformLocation(program,
    "shininess"), materialShininess);


  // sliders for viewing parameters
  document.getElementById("fovySlider").onchange = function(event) {
    fovy = event.target.value;
  };

  document.getElementById("aspectSlider").onchange = function(event) {
    aspect = event.target.value;
  };

  document.getElementById("nearSlider").onchange = function(event) {
    near = event.target.value;
  };
  document.getElementById("farSlider").onchange = function(event) {
    far = event.target.value;
  };

  document.getElementById("radiusSlider").onchange = function(event) {
    radius = event.target.value;
  };
  document.getElementById("thetaSlider").onchange = function(event) {
    theta = event.target.value * Math.PI / 180.0;
  };
  document.getElementById("phiSlider").onchange = function(event) {
    phi = event.target.value * Math.PI / 180.0;
  };
  document.getElementById("heightSlider").onchange = function(event) {
    ytop = event.target.value / 2;
    bottom = -event.target.value / 2;
  };
  document.getElementById("widthSlider").onchange = function(event) {
    right = event.target.value / 2;
    left = -event.target.value / 2;
  };
  document.getElementById("scaleSlider").onchange = function(event) {
    scale[0] = event.target.value;
    scale[1] = event.target.value;
    scale[2] = event.target.value;
  };
  document.getElementById("ButtonReset").onclick = function() {
    document.getElementById("myForm").reset();
  };

  document.getElementById("translateX").onchange = function(event) {
    translat[0] = event.target.value;
  };
  document.getElementById("translateY").onchange = function(event) {
    translat[1] = event.target.value;
  };
  document.getElementById("translateZ").onchange = function(event) {
    translat[2] = event.target.value;
  };

  document.getElementById("ShadingButton").onclick = function() {
    changeShading = !changeShading;
  };

  render();
}

var render = function() {

  function renderScene(drawX, drawY, drawWidth, drawHeight, pMatrix, mvMatrix) {
    gl.viewport(drawX, drawY, drawWidth, drawHeight);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(projection, false, flatten(pMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

  mvMatrix = lookAt(eye, at, up);
  pMatrix1 = ortho(left, right, bottom, ytop, near, far);
  pMatrix2 = perspective(fovy, aspect, near, far);
  scaleMatrix = scalem(scale[0], scale[1], scale[2]);
  translateMatrix = translate(translat[0], translat[1], translat[2]);

  gl.uniformMatrix4fv(scaleMatrixLocation, false, flatten(scaleMatrix));
  gl.uniformMatrix4fv(translateMatrixLocation, false, flatten(translateMatrix));
  gl.uniform1f(gl.getUniformLocation(program, "changeShading"), changeShading);

  renderScene(0, 0, canvas.width / 2, canvas.height, pMatrix1, mvMatrix);
  renderScene(canvas.width / 2, 0, canvas.width / 2, canvas.height, pMatrix2, mvMatrix);
  requestAnimFrame(render);
}
