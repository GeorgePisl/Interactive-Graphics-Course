"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var projectionMatrixLoc;
var eye;

var instanceMatrix;
var modelViewMatrixLoc;


const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);


//camera vars
var near = 0.30;
var far = 30;
var radius = 27;
var thetaCam = 0.0;
var phiCam = 6.0;

var left = -0.75;
var right = 0.75;
var ytop = 1.5;
var bottom = -1.5;

var fovy = 300.0;
var aspect = 1.7; // width/height of canvas


//TEXTURE
var numVertices = 36;
var texSize = 256;
var numChecks = 8;
var c;

var texture1, texture2;
var t1, t2;

var flag = true;

var flagHorseTexture = true;
var flagObstacleTexture = true;
var flagObstacleColore = true;

var image1 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++) {
  for (var j = 0; j < texSize; j++) {
    var patchx = Math.floor(i / (texSize / numChecks));
    var patchy = Math.floor(j / (texSize / numChecks));
    if (patchx % 2 ^ patchy % 2) c = 255;
    else c = 0;
    //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
    image1[4 * i * texSize + 4 * j] = c;
    image1[4 * i * texSize + 4 * j + 1] = c;
    image1[4 * i * texSize + 4 * j + 2] = c;
    image1[4 * i * texSize + 4 * j + 3] = 255;
  }
}

var image2 = new Uint8Array(4 * texSize * texSize);

// Create a checkerboard pattern
for (var i = 0; i < texSize; i++) {
  for (var j = 0; j < texSize; j++) {
    image2[4 * i * texSize + 4 * j] = 127 + 127 + i;
    image2[4 * i * texSize + 4 * j + 1] = 127 + 127 + j;
    image2[4 * i * texSize + 4 * j + 2] = 127 + 127 + j;
    image2[4 * i * texSize + 4 * j + 3] = 255;

  }
}


var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var texCoord = [
  vec2(0, 0),
  vec2(0, 1),
  vec2(1, 1),
  vec2(1, 0)
];

function configureTexture() {
  texture1 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  texture2 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture2);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

var vertexColors = [
  vec4(0.0, 0.0, 0.0, 1.0), // black
  vec4(1.0, 0.0, 0.0, 1.0), // red
  vec4(1.0, 1.0, 0.0, 1.0), // yellow
  vec4(0.0, 1.0, 0.0, 1.0), // green
  vec4(0.0, 0.0, 1.0, 1.0), // blue
  vec4(1.0, 0.0, 1.0, 1.0), // magenta
  vec4(0.0, 1.0, 1.0, 1.0), // white
  vec4(0.0, 1.0, 1.0, 1.0) // cyan
];


var speed = 200;

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


//TORSO
var TORSO_ID = 0;

//HEAD GROUP
var NECK_ID = 1;
var HEAD_ID = 2;
var MOUTH_1_ID = 19;
var MOUTH_2_ID = 20;
var EAR_1_ID = 21;
var EAR_2_ID = 22;

//FRONT_RIGHT_LEG
var FRONT_RIGHT_UPPER_LEG = 5;
var FRONT_RIGHT_LOWER_LEG = 6;
var FRONT_RIGHT_FOOT = 12;

//FRONT_LEFT_LEG
var FRONT_LEFT_UPPER_LEG = 3;
var FRONT_LEFT_LOWER_LEG = 4;
var FRONT_LEFT_FOOT = 13;

//BACK_RIGHT_LEG
var BACK_RIGHT_UPPER_LEG = 9;
var BACK_RIGHT_LOWER_LEG = 10;
var BACK_RIGHT_FOOT = 14;

//BACK_LEFT_LEG
var BACK_LEFT_UPPER_LEG = 7;
var BACK_LEFT_LOWER_LEG = 8;
var BACK_LEFT_FOOT = 15;

//TAILS
var TAIL_1_ID = 16;
var TAIL_2_ID = 17;
var TAIL_3_ID = 18;

//OBSTACLE
var OBSTACLE_ID = 23;
var BAR_ID = 24;
var COLUMN1_ID = 25;
var COLUMN2_ID = 26;
var BASE1_ID = 27;
var BASE2_ID = 28;

var GLOBAL_ANGLE_ID = 29;


//DIMENSIONS

//TORSO
var torsoHeight = 15.0;
var torsoWidth = 6.3;

//HEAD
var headHeight = 3.5;
var headWidth = 3.5;

//MOUTHS
var mouth1Height = 6.5;
var mouth2Height = 4.5;
var mouth1Width = 2;
var mouth2Width = 1.0;

//EARS
var ear1Height = 2;
var ear1Width = 0.7;
var ear2Height = 2;
var ear2Width = 0.7;

//NECK
var neckHeight = 8.0;
var neckWidth = 4.5;

//FRONT UPPER LEG
var frontUpperLegHeight = 4.7;
var frontUpperLegWidth = 2.3;

//FRONT LOWER LEG
var frontLowerLegHeight = 3.2;
var frontLowerLegWidth = 1.8;

//BACK UPPER LEG
var backUpperLegHeight = 5.5;
var backLowerLegHeight = 3.2;

//BACK LOWER LEG
var backUpperLegWidth = 3.2;
var backLowerLegWidth = 2.5;

//LEG FOOT
var footHeight = 2.1;
var footWidth = 3.1;

//TAIL
var tailHeight = 8;
var tailWidth = 1;

//OBSTACLE
var obstacleHeight = 30;
var obstacleWidth = 2;

//OBSTACLE COLUMNS
var columnHeight = 7;
var columnWidth = 2;

//COLUMNS BASES
var base1Height = 3;
var base1Width = 4;

//OBTACLE GREEN BAR
var barHeight = 30;
var barWidth = 0.8;

var numNodes = 29;

var theta = [90, 110, 90, 110, 0, 90, 0, 70, -30, 90, -30, 1, -90, 1, 1, 5, 140, 130, 130, 0, 12, 90, 120,       90, 90, 90, 90, 90, 90,       0];

var stack = [];

var figure = [];


for (var i = 0; i < numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

var walkSeq1;
var walkSeq2;

//translation matrix for horse
var translat = [-33.0, 0.0, 0.0];

//eye matrix
var sliders = [0.0, 0.0, 0.0];

//-------------------------------------------

function scale4(a, b, c) {
  var result = mat4();
  result[0][0] = a;
  result[1][1] = b;
  result[2][2] = c;
  return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child) {
  var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
  }
  return node;
}

function initNodes(Id) {

  var m = mat4();
  var o = mat4();

  switch (Id) {

//HORSE
    case TORSO_ID:
      m = translate(translat[0], translat[1], translat[2]); //traslazione per tutto l'oggetto come insieme
      m = mult(m, rotate(theta[TORSO_ID], 1, 0, 0));
      m = mult(m, rotate(theta[TORSO_ID], 0, 0, -1));
      m = mult(m, rotate(theta[GLOBAL_ANGLE_ID], -1, 0, 0));
      figure[TORSO_ID] = createNode(m, torso, null, NECK_ID);
      break;

    case NECK_ID:
      m = translate(0.0, torsoHeight - neckHeight + 4.5, 0.0);
      m = mult(m, rotate(theta[NECK_ID], 1, 0, 0))
      m = mult(m, translate(0.0, -1 * neckHeight, 0.0));
      figure[NECK_ID] = createNode(m, neck, FRONT_LEFT_UPPER_LEG, HEAD_ID);
      break;

    case HEAD_ID:
      m = translate(0.0, 0.2 * headHeight, 1.0);
      m = mult(m, rotate(theta[HEAD_ID], 1, 0, 0))
      m = mult(m, translate(0.0, -0.8 * headHeight, 0.0));
      figure[HEAD_ID] = createNode(m, head, null, MOUTH_1_ID);
      break;

    case MOUTH_1_ID:
      m = translate(0, -3, 1);
      figure[MOUTH_1_ID] = createNode(m, mouth1, MOUTH_2_ID, null);
      break;

    case MOUTH_2_ID:
      m = translate(0, -2.3, -1);
      m = mult(m, rotate(theta[MOUTH_2_ID], 1, 0, 0));
      figure[MOUTH_2_ID] = createNode(m, mouth2, EAR_1_ID, null);
      break;

    case EAR_1_ID:
      m = translate(0.6, 3.1, 1);
      m = mult(m, rotate(theta[EAR_1_ID], 1, 0, 0));
      figure[EAR_1_ID] = createNode(m, ear1, EAR_2_ID, null);
      break;

    case EAR_2_ID:
      m = translate(-0.6, 3.1, 1);
      m = mult(m, rotate(theta[EAR_2_ID], 1, 0, 0));
      figure[EAR_2_ID] = createNode(m, ear2, null, null);
      break;

    case FRONT_LEFT_UPPER_LEG:
      m = translate(-(torsoWidth / 3), 0.9 * torsoHeight, 0.0);
      m = mult(m, rotate(theta[FRONT_LEFT_UPPER_LEG], 1, 0, 0));
      figure[FRONT_LEFT_UPPER_LEG] = createNode(m, frontLeftUpperLeg, FRONT_RIGHT_UPPER_LEG, FRONT_LEFT_LOWER_LEG);
      break;

    case FRONT_RIGHT_UPPER_LEG:
      m = translate(torsoWidth / 3, 0.9 * torsoHeight, 0.0);
      m = mult(m, rotate(theta[FRONT_RIGHT_UPPER_LEG], 1, 0, 0));
      figure[FRONT_RIGHT_UPPER_LEG] = createNode(m, frontRightUpperLeg, BACK_LEFT_UPPER_LEG, FRONT_RIGHT_LOWER_LEG);
      break;

    case BACK_LEFT_UPPER_LEG:
      m = translate(-(torsoWidth / 3), 0.1 * backUpperLegHeight, 0.0);
      m = mult(m, rotate(theta[BACK_LEFT_UPPER_LEG], 1, 0, 0));
      figure[BACK_LEFT_UPPER_LEG] = createNode(m, backLeftUpperLeg, BACK_RIGHT_UPPER_LEG, BACK_LEFT_LOWER_LEG);
      break;

    case BACK_RIGHT_UPPER_LEG:
      m = translate(torsoWidth / 3, 0.1 * backUpperLegHeight, 0.0);
      m = mult(m, rotate(theta[BACK_RIGHT_UPPER_LEG], 1, 0, 0));
      figure[BACK_RIGHT_UPPER_LEG] = createNode(m, backRightUpperLeg, TAIL_1_ID, BACK_RIGHT_LOWER_LEG);
      break;

    case TAIL_1_ID:
      m = translate(0, 0, -1.5);
      m = mult(m, rotate(theta[TAIL_1_ID], 1, 0, 0));
      figure[TAIL_1_ID] = createNode(m, tail1, TAIL_2_ID, null);
      break;

    case TAIL_2_ID:
      m = translate(0, 0, -1.5);
      m = mult(m, rotate(theta[TAIL_2_ID], 1, 0.1, 0));
      figure[TAIL_2_ID] = createNode(m, tail2, TAIL_3_ID, null);
      break;

    case TAIL_3_ID:
      m = translate(0, 0, -1.5);
      m = mult(m, rotate(theta[TAIL_3_ID], 1, -0.1, 0));
      figure[TAIL_3_ID] = createNode(m, tail3, null, null);
      break;

    case FRONT_RIGHT_LOWER_LEG:
      m = translate(0.0, frontUpperLegHeight, 0.0);
      m = mult(m, rotate(theta[FRONT_RIGHT_LOWER_LEG], 1, 0, 0));
      figure[FRONT_RIGHT_LOWER_LEG] = createNode(m, frontRightLowerLeg, null, FRONT_RIGHT_FOOT);
      break;

    case FRONT_LEFT_LOWER_LEG:
      m = translate(0.0, frontUpperLegHeight, 0.0);
      m = mult(m, rotate(theta[FRONT_LEFT_LOWER_LEG], 1, 0, 0));
      figure[FRONT_LEFT_LOWER_LEG] = createNode(m, frontLeftLowerLeg, null, FRONT_LEFT_FOOT);
      break;

    case FRONT_RIGHT_FOOT:
      m = translate(0.0, footHeight + 1, 0.0);
      figure[FRONT_RIGHT_FOOT] = createNode(m, frontRightFoot, null, null);
      break;

    case FRONT_LEFT_FOOT:
      m = translate(0.0, footHeight + 1, 0.0);
      figure[FRONT_LEFT_FOOT] = createNode(m, frontLeftFoot, null, null);
      break;

    case BACK_LEFT_LOWER_LEG:
      m = translate(0.0, backUpperLegHeight, 0.0);
      m = mult(m, rotate(theta[BACK_LEFT_LOWER_LEG], 1, 0, 0));
      figure[BACK_LEFT_LOWER_LEG] = createNode(m, backLeftLowerLeg, null, BACK_LEFT_FOOT);
      break;

    case BACK_RIGHT_LOWER_LEG:
      m = translate(0.0, backUpperLegHeight, 0.0);
      m = mult(m, rotate(theta[BACK_RIGHT_LOWER_LEG], 1, 0, 0));
      figure[BACK_RIGHT_LOWER_LEG] = createNode(m, backRightLowerLeg, null, BACK_RIGHT_FOOT);
      break;

    case BACK_RIGHT_FOOT:
      m = translate(0.0, footHeight + 1, 0.0);
      figure[BACK_RIGHT_FOOT] = createNode(m, backRightFoot, null, null);
      break;

    case BACK_LEFT_FOOT:
      m = translate(0.0, footHeight + 1, 0.0);
      figure[BACK_LEFT_FOOT] = createNode(m, backLeftFoot, null, null);
      break;

//OBSTACLE
    case OBSTACLE_ID:
      o = translate(10, -6, -10);
      o = mult(o, rotate(theta[OBSTACLE_ID], 1, 0, 0));
      figure[OBSTACLE_ID] = createNode(o, ostacolo, null, BAR_ID);
      break;

      case BAR_ID:
        o = translate(0, 0, -3.5);
        figure[BAR_ID] = createNode(o, barra, COLUMN1_ID, null);
        break;

    case COLUMN1_ID:
      o = translate(0, 31, -5);
      o = mult(o, rotate(theta[COLUMN1_ID], 1, 0, 0));
      figure[COLUMN1_ID] = createNode(o, colonna1, COLUMN2_ID, BASE1_ID);
      break;

      case BASE1_ID:
        o = translate(0, 7, 0);
        figure[BASE1_ID] = createNode(o, base1, null, null);
        break;

    case COLUMN2_ID:
      o = translate(0, -1, -5);
      o = mult(o, rotate(theta[COLUMN2_ID], 1, 0, 0));
      figure[COLUMN2_ID] = createNode(o, colonna2, null, BASE2_ID);
      break;

    case BASE2_ID:
      o = translate(0, 7, 0);
      figure[BASE2_ID] = createNode(o, base2, null, null);
      break;
  }

}

function traverse(Id) {

  if (Id == null) return;
  stack.push(modelViewMatrix);
  modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
  figure[Id].render();
  if (figure[Id].child != null) traverse(figure[Id].child);
  modelViewMatrix = stack.pop();
  if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {
  flagHorseTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);
  flagObstacleTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleTexture"), flagObstacleTexture);
  flagObstacleColore = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleColore"), flagObstacleColore);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(torsoWidth, torsoHeight, torsoWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function head() {
  flagHorseTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function neck() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * neckHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(neckWidth, neckHeight, neckWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function mouth1() {
  flagHorseTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * mouth1Height, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(mouth1Width, mouth1Height, mouth1Width));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function mouth2() {
  flagHorseTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * mouth2Height, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(mouth2Width, mouth2Height, mouth2Width));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function ear1() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * ear1Height, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(ear1Width, ear1Height, ear1Width));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function ear2() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * ear2Height, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(ear2Width, ear2Height, ear2Width));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}


function frontLeftUpperLeg() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * frontUpperLegHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(frontUpperLegWidth, frontUpperLegHeight, frontUpperLegWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function frontLeftLowerLeg() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * frontLowerLegHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(frontLowerLegWidth, frontLowerLegHeight, frontLowerLegWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function frontLeftFoot() {
  flagHorseTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * footHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(footWidth, footHeight, footWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function frontRightUpperLeg() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * frontUpperLegHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(frontUpperLegWidth, frontUpperLegHeight, frontUpperLegWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function frontRightLowerLeg() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * frontLowerLegHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(frontLowerLegWidth, frontLowerLegHeight, frontLowerLegWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function frontRightFoot() {
  flagHorseTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * footHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(footWidth, footHeight, footWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function backLeftUpperLeg() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * backUpperLegHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(backUpperLegWidth, backUpperLegHeight, backUpperLegWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function backLeftLowerLeg() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * backLowerLegHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(backLowerLegWidth, backLowerLegHeight, backLowerLegWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function backLeftFoot() {
  flagHorseTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * footHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(footWidth, footHeight, footWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function backRightUpperLeg() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * backUpperLegHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(backUpperLegWidth, backUpperLegHeight, backUpperLegWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function backRightLowerLeg() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * backLowerLegHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(backLowerLegWidth, backLowerLegHeight, backLowerLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function backRightFoot() {
  flagHorseTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * footHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(footWidth, footHeight, footWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function tail1() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function tail2() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function tail3() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function ostacolo() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);
  flagObstacleTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleTexture"), flagObstacleTexture);
  flagObstacleColore = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleColore"), flagObstacleColore);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacleHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(obstacleWidth, obstacleHeight, obstacleWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function barra() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);
  flagObstacleTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleTexture"), flagObstacleTexture);
  flagObstacleColore = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleColore"), flagObstacleColore);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * barHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(barWidth, barHeight, barWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function colonna1() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);
  flagObstacleTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleTexture"), flagObstacleTexture);
  flagObstacleColore = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleColore"), flagObstacleColore);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * columnHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(columnWidth, columnHeight, columnWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function colonna2() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);
  flagObstacleTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleTexture"), flagObstacleTexture);
  flagObstacleColore = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleColore"), flagObstacleColore);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * columnHeight, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(columnWidth, columnHeight, columnWidth));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function base1() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);
  flagObstacleTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleTexture"), flagObstacleTexture);
  flagObstacleColore = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleColore"), flagObstacleColore);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * base1Height, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(base1Width, base1Height, base1Width));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function base2() {
  flagHorseTexture = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagHorseTexture"), flagHorseTexture);
  flagObstacleTexture = true;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleTexture"), flagObstacleTexture);
  flagObstacleColore = false;
  gl.uniform1f(gl.getUniformLocation(program, "flagObstacleColore"), flagObstacleColore);

  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * base1Height, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(base1Width, base1Height, base1Width));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}


var thetaLoc;

function quad(a, b, c, d) {

  pointsArray.push(vertices[a]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[0]);

  pointsArray.push(vertices[b]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[1]);

  pointsArray.push(vertices[c]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[2]);

  pointsArray.push(vertices[d]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[3]);
}

function cube() {
  quad(1, 0, 3, 2);
  quad(2, 3, 7, 6);
  quad(3, 0, 4, 7);
  quad(6, 5, 1, 2);
  quad(6, 7, 4, 5);
  quad(5, 4, 0, 1);
}


window.onload = function init() {

  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.enable(gl.DEPTH_TEST);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  instanceMatrix = mat4();
  //projectionMatrix = perspective(fovy, aspect, near, far);
  projectionMatrix = ortho(-40.0, 40.0, -23.0, 23.0, -40.0, 40.0);
  modelViewMatrix = mat4();

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  cube();

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  configureTexture();

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.uniform1i(gl.getUniformLocation(program, "Tex0"), 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture2);
  gl.uniform1i(gl.getUniformLocation(program, "Tex1"), 1);


  thetaLoc = gl.getUniformLocation(program, "theta");


  document.getElementById("runButton").onclick = function() {
    this.disabled = true;
    clear();
    speed = 50;
    walk();
  }


  document.getElementById("lateralVision").onclick = function() {
    sliders = [0, 0, 0];
  }

  document.getElementById("upsideVision").onclick = function() {
    sliders = [0, 1, 0.01];
  }
  document.getElementById("frontVision").onclick = function() {
    sliders = [1, 0, 0];
  }

  document.getElementById("vision1").onclick = function() {
    sliders = [1.3, 0.1, 1.3];
  }
  document.getElementById("vision2").onclick = function() {
    sliders = [-1.2, 0.1, 1.2];
  }

  for (i = 0; i < numNodes; i++) initNodes(i);

  render();
}

function clear() {
  walkSeq1 = 2;
}

var bassa1 = 0;
var bassa2 = 0;
var inte;

function walk() {
  walkSeq1 = 0;
  walkSeq2 = 0;

  //torso
  translat[0] = -63.0; //initial position of walk
  initNodes(TORSO_ID);

  //legs
  theta[FRONT_LEFT_UPPER_LEG] = 110;
  initNodes(FRONT_LEFT_UPPER_LEG);
  theta[FRONT_LEFT_LOWER_LEG] = 0;
  initNodes(FRONT_LEFT_LOWER_LEG);

  theta[FRONT_RIGHT_UPPER_LEG] = 90;
  initNodes(FRONT_RIGHT_UPPER_LEG);
  theta[FRONT_RIGHT_LOWER_LEG] = 0;
  initNodes(FRONT_RIGHT_LOWER_LEG);

  theta[BACK_LEFT_UPPER_LEG] = 70;
  initNodes(BACK_LEFT_UPPER_LEG);
  theta[BACK_LEFT_LOWER_LEG] = -30;
  initNodes(BACK_LEFT_LOWER_LEG);

  theta[BACK_RIGHT_UPPER_LEG] = 90;
  initNodes(BACK_RIGHT_UPPER_LEG);
  theta[BACK_RIGHT_LOWER_LEG] = -30;
  initNodes(BACK_RIGHT_LOWER_LEG);

  //neck
  theta[NECK_ID] = 110;
  initNodes(NECK_ID);

  inte = setInterval(function() {
    runAndJump();
  }, speed);

}

function runAndJump() {

  //RUN
  if (translat[0] < -15 || (translat[0] > 2 && translat[1] == 0)) {

    //FRONT AND BACK LEFT LEGS 1
    if (walkSeq1 == 0) {
      translat[0] += 1.0; //body trasnlate on x axis
      initNodes(TORSO_ID);

      theta[FRONT_LEFT_UPPER_LEG] -= 5;
      initNodes(FRONT_LEFT_UPPER_LEG);

      theta[NECK_ID] += 3;
      initNodes(NECK_ID);

      theta[BACK_LEFT_UPPER_LEG] += 5;
      initNodes(BACK_LEFT_UPPER_LEG);

      if (bassa1 == 0) {
        theta[FRONT_LEFT_LOWER_LEG] += 10;
        initNodes(FRONT_LEFT_LOWER_LEG);

        if (theta[FRONT_LEFT_LOWER_LEG] == 50) {
          bassa1 = 1;
        }
      }
      if (bassa1 == 1) {
        theta[FRONT_LEFT_LOWER_LEG] -= 10;
        initNodes(FRONT_LEFT_LOWER_LEG);
        if (theta[FRONT_LEFT_LOWER_LEG] == 0) {
          bassa1 = 0;
        }
      }

      if (theta[FRONT_LEFT_UPPER_LEG] == 50) {
        walkSeq1 = 1;
        bassa1 = 0;
      }
    }

    //FRONT AND BACK RIGHT LEGS 1
    if (walkSeq2 == 0) {
      translat[0] += 1.0; //body trasnlate on x axis
      initNodes(TORSO_ID);

      theta[FRONT_RIGHT_UPPER_LEG] -= 5;
      initNodes(FRONT_RIGHT_UPPER_LEG);

      theta[BACK_RIGHT_UPPER_LEG] += 5;
      initNodes(BACK_RIGHT_UPPER_LEG);

      if (bassa2 == 0) {
        theta[FRONT_RIGHT_LOWER_LEG] += 10;
        initNodes(FRONT_RIGHT_LOWER_LEG);

        if (theta[FRONT_RIGHT_LOWER_LEG] == 50) {
          bassa2 = 1;
        }
      }
      if (bassa2 == 1) {
        theta[FRONT_RIGHT_LOWER_LEG] -= 10;
        initNodes(FRONT_RIGHT_LOWER_LEG);
        if (theta[FRONT_RIGHT_LOWER_LEG] == 0) {
          bassa2 = 0;
        }
      }
      if (theta[FRONT_RIGHT_UPPER_LEG] == 50) {
        walkSeq2 = 1;
        bassa2 = 0;
      }
    }

    //FRONT AND BACK LEFT LEGS 2
    if (walkSeq1 == 1) {
      translat[0] += 1.0; //body trasnlate on x axis
      initNodes(TORSO_ID);

      theta[NECK_ID] -= 3;
      initNodes(NECK_ID);

      theta[FRONT_LEFT_UPPER_LEG] += 5;
      initNodes(FRONT_LEFT_UPPER_LEG);

      theta[BACK_LEFT_UPPER_LEG] -= 5;
      initNodes(BACK_LEFT_UPPER_LEG);

      if (theta[FRONT_LEFT_UPPER_LEG] == 110) {
        bassa1 = 0;
        walkSeq1 = 0;
      }
    }

    //FRONT AND BACK RIGHT LEGS 2
    if (walkSeq2 == 1) {
      translat[0] += 1.0; //body trasnlate on x axis
      initNodes(TORSO_ID);

      theta[FRONT_RIGHT_UPPER_LEG] += 5;
      initNodes(FRONT_RIGHT_UPPER_LEG);

      theta[BACK_RIGHT_UPPER_LEG] -= 5;
      initNodes(BACK_RIGHT_UPPER_LEG);

      if (theta[FRONT_RIGHT_UPPER_LEG] == 110) {
        bassa2 = 0;
        walkSeq2 = 0;
      }
    }

  }

  //JUMP
  if (translat[0] >= -15 && translat[0] < 2 && translat[1] <= 10) {
    translat[0] += 1.6;
    translat[1] += 1;
    initNodes(TORSO_ID);

    //INCLINAZIONE BUSTO DURANTE SALTO
    if (translat[1] < 5) {
      theta[GLOBAL_ANGLE_ID] += 5;
      initNodes(TORSO_ID);

      theta[BACK_RIGHT_UPPER_LEG] += 10;
      initNodes(BACK_RIGHT_UPPER_LEG);

      theta[BACK_LEFT_UPPER_LEG] += 10;
      initNodes(BACK_LEFT_UPPER_LEG);

    } else {
      theta[GLOBAL_ANGLE_ID] -= 5;
      initNodes(TORSO_ID);

      theta[BACK_RIGHT_UPPER_LEG] -= 5;
      initNodes(BACK_RIGHT_UPPER_LEG);

      theta[BACK_LEFT_UPPER_LEG] -= 5;
      initNodes(BACK_LEFT_UPPER_LEG);

    }

  }

  //LAND
  if (translat[0] >= 2 && translat[1] > 0) {
    translat[0] += 2;
    translat[1] -= 1;

    theta[FRONT_RIGHT_UPPER_LEG] -= 3;
    initNodes(FRONT_RIGHT_UPPER_LEG);
    theta[FRONT_RIGHT_LOWER_LEG] -= 4;
    initNodes(FRONT_RIGHT_LOWER_LEG);

    theta[FRONT_LEFT_UPPER_LEG] -= 3;
    initNodes(FRONT_LEFT_UPPER_LEG);
    theta[FRONT_LEFT_LOWER_LEG] -= 4;
    initNodes(FRONT_LEFT_LOWER_LEG);

    //INCLINAZIONE BUSTO DURANTE SALTO
    if (theta[GLOBAL_ANGLE_ID] < 0) {
      theta[GLOBAL_ANGLE_ID] += 1.5;
    }
    initNodes(TORSO_ID);
  }

}

var render = function() {

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform3fv(thetaLoc, theta);

  eye = vec3(sliders);

  //eye = vec3(radius * Math.sin(thetaCam) * Math.cos(phiCam),radius * Math.sin(thetaCam) * Math.sin(phiCam), radius * Math.cos(thetaCam));

  modelViewMatrix = lookAt(eye, at, up);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

  traverse(OBSTACLE_ID);
  traverse(TORSO_ID);

  requestAnimFrame(render);
}
