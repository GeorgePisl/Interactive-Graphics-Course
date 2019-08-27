window.addEventListener('load', init, false);
//colors
var Colors = {
  blue: 0x1560bd,
  white: 0xd8d0d1,
  black: 0x000000,
  brown: 0xCD853F,
  yellow: 0xffff00,
  grey: 0x696969,
  brownDark: 0x23190f,
  green: 0x00FF00,
  orange: 0xffa500,
  light_violet: 0xA981B0
};

//scene parameters
var scene;
var sceneWidth, sceneHeight;
var camera;
var light;
var renderer;
var dom;
var element;

//texture parameters
var textureWood;
var textureIron;
var textureBar;
var gameBackground;
var textureBorder;
var groundColor;
var colSkin;
var colHair;
var colShirt;
var colShorts;
var colShoes;

//character parameters
var character;
var deg2Rad = Math.PI / 180;

//game parameters
var gameOver = false;
var paused = true;
var ground;
var obstacles = [];
var ObstacleSize = 0.5;
var difficulty = 0;
var speed = 30;
var levelLength = 30;
var level = 0;
var score;
var controls = "up/w: jump <br> down/s: slide<br> left/a: move left<br> right/d: move right<br> p: pause";

//sound parameters
var backgroundSound;
var jumpSound;
var slideSound;
var gameoverSound;

function init() {

  var booleanMode = window.localStorage.getItem("booleanMode");

  //classic mode
  if (booleanMode == "true") {
    textureWood = "../textures/wood.png";
    textureIron = "../textures/iron.jpg";
    textureBar = "../textures/redStripes.jpg";
    textureBorder = "../textures/lines4.png";
    groundColor = Colors.grey;
    gameBackground = new THREE.TextureLoader().load("../images/clouds.jpg");

    //classic sound effects
    backgroundSound = new sound("../sounds/classic-song.wav");
    backgroundSound.sound.volume = 0.02;
    backgroundSound.sound.loop = true;
    jumpSound = new sound("../sounds/classic-jump.mp3");
    slideSound = new sound("../sounds/classic-slide.mp3");
    gameoverSound = new sound("../sounds/classic-gameover.mp3");

    //charcter colors
    colSkin = Colors.yellow;
    colHair = Colors.black;
    colShirt = Colors.orange;
    colShorts = Colors.blue;
    colShoes = Colors.blue;

  } else { //arcade mode
    textureWood = "../textures/arcade.jpg";
    textureIron = "../textures/geometric2.jpg";
    textureBar = "../textures/lights.jpg";
    textureBorder = "../textures/lines3.jpg";
    groundColor = Colors.light_violet;
    gameBackground = new THREE.TextureLoader().load("../images/sfondo5.png");

    //arcade sound effects
    backgroundSound = new sound("../sounds/arcade-song.ogg");
    backgroundSound.sound.volume = 0.02;
    backgroundSound.sound.loop = true;
    jumpSound = new sound("../sounds/arcade-jump.mp3");
    slideSound = new sound("../sounds/arcade-slide.mp3");
    gameoverSound = new sound("../sounds/arcade-gameover.mp3");

    //charcter colors
    colSkin = Colors.brown;
    colHair = Colors.brownDark;
    colShirt = Colors.green;
    colShorts = Colors.yellow;
    colShoes = Colors.blue;
  }

  createScene();
  //input from players
  var left = 37;
  var a = 65;
  var up = 38;
  var down = 40;
  var s = 83;
  var w = 87;
  var right = 39;
  var d = 68;
  var p = 80;
  var r = 82;
  keysAllowed = {};
  document.addEventListener(
    'keydown',
    function(e) {
      var key = e.keyCode;
      if (!gameOver) {
        if (keysAllowed[key] === false) return;
        keysAllowed[key] = false;
        if (paused && key > 0) {
          backgroundSound.play();
          paused = false;
          document.getElementById("controls").innerHTML = "Controls";
          document.getElementById("list").innerHTML = controls;
          character.onUnpause();
        } else {
          if (key == p) {
            paused = true;
            document.getElementById("controls").innerHTML = "Game Paused";
            document.getElementById("list").innerHTML = "Press P to continue";
            character.onPause();
          }
          if (key == up || key == w && !paused) {
            character.onUpKeyPressed();
          }
          if (key == left || key == a && !paused) {
            character.onLeftKeyPressed();
          }
          if (key == right || key == d && !paused) {
            character.onRightKeyPressed();
          }
          if (key == down || key == s && !paused) {
            character.onDownKeyPressed();
          }
        }
      } else if (gameOver && key == r) {
        location.reload();
      }
    }
  );
  document.addEventListener(
    'keyup',
    function(e) {
      keysAllowed[e.keyCode] = true;
    }
  );
  document.addEventListener(
    'focus',
    function(e) {
      keysAllowed = {};
    }
  );
  score = 0;
  document.getElementById("score").innerHTML = score;
  update();
}

function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);

  this.play = function() {
    this.sound.play();
  }
  this.stop = function() {
    this.sound.pause();
  }
}

function createScene() {
  sceneWidth = window.innerWidth;
  sceneHeight = window.innerHeight;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, sceneWidth / sceneHeight, 1, 10000);
  renderer = new THREE.WebGLRenderer({
    alpha: true
  });
  scene.background = gameBackground;
  renderer.setClearColor(0xfffafa, 1);
  fogDistance = 6000;
  scene.fog = new THREE.Fog(0xbadbe4, 1, fogDistance);
  renderer.setSize(sceneWidth, sceneHeight);
  dom = document.getElementById('container');
  dom.appendChild(renderer.domElement);
  camera.position.z = 150;
  camera.position.y = 1000;
  camera.lookAt(new THREE.Vector3(0, 730, -190));
  addWorld();
  addLight();
  for (var i = 1; i < 30; i++) {
    createRowOfObstacles(i * -2500, ObstacleSize);
  }

  //build and add the character to the scene
  character = new Character();
  scene.add(character.element);
  character.element.scale.set(0.7, 0.7, 0.7);
  window.addEventListener('resize', onWindowResize, false);
}

function addWorld() {
  var ground = createBox(2000, 20, 20000, groundColor, 0, -400, -600);
  var groundLeftBorder = createBox_texture(50, 500, 20000, -1000, -300, -600, textureBorder);
  var groundRightBorder = createBox_texture(50, 500, 20000, 1000, -300, -600, textureBorder);
  scene.add(ground);
  scene.add(groundLeftBorder);
  scene.add(groundRightBorder);
}

function addLight() {
  light = new THREE.HemisphereLight(0xfffafa, 0x000000, .9)
  scene.add(light);
}

function update() {
  if (!paused) {
    if ((obstacles[obstacles.length - 1].mesh.position.z) > -11000) {
      difficulty += 1;
      level = difficulty / levelLength;
      switch (level) {
        case 0.2:
          speed = 35;
          break;
        case 0.4:
          speed = 40;
          break;
        case 0.6:
          speed = 45;
          break;
        case 0.8:
          speed = 50;
          break;
        case 1:
          speed = 55;
          break;
      }
      createRowOfObstacles(-14000, ObstacleSize);
    }

    // move the obstacles closer to the character.
    obstacles.forEach(function(object) {
      object.mesh.position.z += speed;
    });

    // remove obstacles already skipped
    obstacles = obstacles.filter(function(object) {
      return object.mesh.position.z < 160;
    });
    character.update();
    if (collisionsDetected()) {
      backgroundSound.stop();
      gameoverSound.play();
      gameOver = true;
      paused = true;
      document.getElementById("controls").innerHTML = "Game Over";
      document.getElementById("list").innerHTML = "Press R to retry";
    }
    score += 1;
    document.getElementById("score").innerHTML = score;
  }
  render();
  requestAnimationFrame(update);
}

function render() {
  renderer.render(scene, camera);
}

//function to compute how the character's parts move sinusoidally
function sinusoid(frequency, minimum, maximum, phase, time) {
  var amplitude = 0.5 * (maximum - minimum);
  var angularFrequency = 2 * Math.PI * frequency;
  var phaseRadians = phase * Math.PI / 180;
  var offset = amplitude * Math.sin(
    angularFrequency * time + phaseRadians);
  var average = (minimum + maximum) / 2;
  return average + offset;
}

function Character() {
  var self = this;

  //colors and jumping parameters
  this.skinColor = colSkin;
  this.hairColor = colHair;
  this.shirtColor = colShirt;
  this.shortsColor = colShorts;
  this.shoesColor = colShoes;
  this.jumpDuration = 0.6;
  this.slideDuration = 0.5;
  this.jumpHeight = 600;

  init();

  function init() {
    //build the character.
    self.face = createBox(100, 100, 60, self.skinColor, 0, 0, 0);
    self.hair = createBox(105, 20, 65, self.hairColor, 0, 50, 0);
    self.head = createGroup(0, 260, -25);
    self.head.add(self.face);
    self.head.add(self.hair);

    self.torso = createBox(150, 190, 40, self.shirtColor, 0, 100, 0);

    self.leftHand = createLimb(20, 40, 40, self.skinColor, 0, -85, 0);
    self.leftLowerArm = createLimb(20, 85, 30, self.skinColor, 0, -140, 0);
    self.leftArm = createLimb(30, 120, 40, self.skinColor, -100, 190, -10);
    self.leftLowerArm.add(self.leftHand);
    self.leftArm.add(self.leftLowerArm);

    self.rightHand = createLimb(20, 40, 40, self.skinColor, 0, -85, 0);
    self.rightLowerArm = createLimb(20, 85, 30, self.skinColor, 0, -140, 0);
    self.rightArm = createLimb(30, 120, 40, self.skinColor, 100, 190, -10);
    self.rightLowerArm.add(self.rightHand);
    self.rightArm.add(self.rightLowerArm);

    self.leftFoot = createLimb(40, 30, 100, self.shoesColor, 0, -190, -18);
    self.leftLowerLeg = createLimb(40, 200, 40, self.skinColor, 0, -200, 0);
    self.leftLeg = createLimb(50, 170, 50, self.shortsColor, -50, -10, 30);
    self.leftLowerLeg.add(self.leftFoot);
    self.leftLeg.add(self.leftLowerLeg);

    self.rightFoot = createLimb(40, 30, 100, self.shoesColor, 0, -190, -18);
    self.rightLowerLeg = createLimb(40, 200, 40, self.skinColor, 0, -200, 0);
    self.rightLeg = createLimb(50, 170, 50, self.shortsColor, 50, -10, 30);
    self.rightLowerLeg.add(self.rightFoot);
    self.rightLeg.add(self.rightLowerLeg);

    self.element = createGroup(0, 0, -550);
    self.element.add(self.head);
    self.element.add(self.torso);
    self.element.add(self.leftArm);
    self.element.add(self.rightArm);
    self.element.add(self.leftLeg);
    self.element.add(self.rightLeg);

    //initialization of the character parameters
    self.isJumping = false;
    self.isSliding = false;
    self.isSwitchingLeft = false;
    self.isSwitchingRight = false;
    self.currentLane = 0;
    self.runningStartTime = new Date() / 1000;
    self.pauseStartTime = new Date() / 1000;
    self.stepFreq = 2;
    self.queuedActions = [];
  }
  //create limb
  function createLimb(dx, dy, dz, color, x, y, z) {
    var limb = createGroup(x, y, z);
    var offset = -1 * (Math.max(dx, dz) / 2 + dy / 2);
    var limbBox = createBox(dx, dy, dz, color, 0, offset, 0);
    limb.add(limbBox);
    return limb;
  }

  //update function of the character
  this.update = function() {

    var currentTime = new Date() / 1000;

    //the actions of the character
    if (!self.isJumping &&
      !self.isSwitchingLeft &&
      !self.isSwitchingRight &&
      self.queuedActions.length > 0) {
      switch (self.queuedActions.shift()) {
        case "up":
          self.isJumping = true;
          self.jumpStartTime = new Date() / 1000;
          break;
        case "left":
          if (self.currentLane != -1) {
            self.isSwitchingLeft = true;
          }
          break;
        case "right":
          if (self.currentLane != 1) {
            self.isSwitchingRight = true;
          }
          break;
        case "down":
          self.isSliding = true;
          self.slideStartTime = new Date() / 1000;
          break;
      }
    }

    //jumping action
    if (self.isJumping && !self.isSliding) {
      jumpSound.play();
      var jumpClock = currentTime - self.jumpStartTime;
      self.element.position.y = self.jumpHeight * Math.sin(
          (1 / self.jumpDuration) * Math.PI * jumpClock) +
        sinusoid(2 * self.stepFreq, 0, 20, 0,
          self.jumpStartTime - self.runningStartTime);
      if (jumpClock > self.jumpDuration) {
        self.isJumping = false;
        self.runningStartTime += self.jumpDuration;
      }
      //sliding action
    } else if (self.isSliding) {
      slideSound.play();
      var slideClock = currentTime - self.slideStartTime;

      self.element.rotation.x = 1.2;
      self.element.position.y = -250;
      //legs positions
      self.leftLeg.rotation.x = 0.3;
      self.leftLowerLeg.rotation.x = 0;
      self.rightLeg.rotation.x = -5;
      self.rightLowerLeg.rotation.x = -2;

      //arms positions
      self.leftArm.rotation.x = -1;
      self.leftLowerArm.rotation.x = 1;
      self.rightArm.rotation.x = -1;
      self.rightLowerArm.rotation.x = 1;

      if (slideClock > self.slideDuration) {
        self.isSliding = false;
        self.element.rotation.x += 80;
        self.runningStartTime += self.slideDuration;
      }
      //running default action
    } else {
      var runningClock = currentTime - self.runningStartTime;
      self.element.position.y = sinusoid(
        2 * self.stepFreq, 0, 20, 0, runningClock);
      self.head.rotation.x = sinusoid(
        2 * self.stepFreq, -10, -5, 0, runningClock) * deg2Rad;
      self.torso.rotation.x = sinusoid(
        2 * self.stepFreq, -10, -5, 180, runningClock) * deg2Rad;
      self.leftArm.rotation.x = sinusoid(
        self.stepFreq, -70, 50, 180, runningClock) * deg2Rad;
      self.rightArm.rotation.x = sinusoid(
        self.stepFreq, -70, 50, 0, runningClock) * deg2Rad;
      self.leftLowerArm.rotation.x = sinusoid(
        self.stepFreq, 70, 140, 180, runningClock) * deg2Rad;
      self.rightLowerArm.rotation.x = sinusoid(
        self.stepFreq, 70, 140, 0, runningClock) * deg2Rad;
      self.leftLeg.rotation.x = sinusoid(
        self.stepFreq, -20, 80, 0, runningClock) * deg2Rad;
      self.rightLeg.rotation.x = sinusoid(
        self.stepFreq, -20, 80, 180, runningClock) * deg2Rad;
      self.leftLowerLeg.rotation.x = sinusoid(
        self.stepFreq, -130, 5, 240, runningClock) * deg2Rad;
      self.rightLowerLeg.rotation.x = sinusoid(
        self.stepFreq, -130, 5, 60, runningClock) * deg2Rad;

      //switching actions
      if (self.isSwitchingLeft) {
        self.element.position.x -= 200;
        var offset = self.currentLane * 800 - self.element.position.x;
        if (offset > 800) {
          self.currentLane -= 1;
          self.element.position.x = self.currentLane * 500;
          self.isSwitchingLeft = false;
        }
      }
      if (self.isSwitchingRight) {
        self.element.position.x += 200;
        var offset = self.element.position.x - self.currentLane * 800;
        if (offset > 800) {
          self.currentLane += 1;
          self.element.position.x = self.currentLane * 500;
          self.isSwitchingRight = false;
        }
      }
    }
  }

  //push actions when the key are pressed
  this.onLeftKeyPressed = function() {
    self.queuedActions.push("left");
  }

  this.onUpKeyPressed = function() {
    self.queuedActions.push("up");
  }

  this.onDownKeyPressed = function() {
    self.queuedActions.push("down");
  }

  this.onRightKeyPressed = function() {
    self.queuedActions.push("right");
  }
  //pause action
  this.onPause = function() {
    self.pauseStartTime = new Date() / 1000;
  }

  //resume action
  this.onUnpause = function() {
    var currentTime = new Date() / 1000;
    var pauseDuration = currentTime - self.pauseStartTime;
    self.runningStartTime += pauseDuration;
    if (self.isJumping) {
      self.jumpStartTime += pauseDuration;
    }
  }
}

//build iron obstacle
function Obstacle_Iron(x, y, z, s) {
  this.mesh = new THREE.Object3D();
  var box = new createBox_texture(800, 800, 400, 0, 380, 0, textureIron);
  this.mesh.add(box);
  this.mesh.position.set(x, y, z);
  this.mesh.scale.set(s, s, s);
  this.scaling = s;
  this.collides = function(charMinX, charMaxX, charMinY, charMaxY, charMinZ, charMaxZ) {
    var obstacleMinX = this.mesh.position.x - this.scaling * 400;
    var obstacleMaxX = this.mesh.position.x + this.scaling * 400;
    var obstacleMinY = this.mesh.position.y;
    var obstacleMaxY = this.mesh.position.y + this.scaling * 450;
    var obstacleMinZ = this.mesh.position.z - this.scaling * 250;
    var obstacleMaxZ = this.mesh.position.z + this.scaling * 250;
    return obstacleMinX <= charMaxX && obstacleMaxX >= charMinX &&
      obstacleMinY <= charMaxY && obstacleMaxY >= charMinY &&
      obstacleMinZ <= charMaxZ && obstacleMaxZ >= charMinZ;
  }
}
//build wood obstacle
function Obstacle_Wood(x, y, z, s) {
  this.mesh = new THREE.Object3D();
  var box = new createBox_texture(800, 800, 400, 0, 380, 0, textureWood);
  this.mesh.add(box);
  this.mesh.position.set(x, y, z);
  this.mesh.scale.set(s, s, s);
  this.scaling = s;
  this.collides = function(charMinX, charMaxX, charMinY, charMaxY, charMinZ, charMaxZ) {
    var obstacleMinX = this.mesh.position.x - this.scaling * 400;
    var obstacleMaxX = this.mesh.position.x + this.scaling * 400;
    var obstacleMinY = this.mesh.position.y;
    var obstacleMaxY = this.mesh.position.y + this.scaling * 450;
    var obstacleMinZ = this.mesh.position.z - this.scaling * 250;
    var obstacleMaxZ = this.mesh.position.z + this.scaling * 250;
    return obstacleMinX <= charMaxX && obstacleMaxX >= charMinX &&
      obstacleMinY <= charMaxY && obstacleMaxY >= charMinY &&
      obstacleMinZ <= charMaxZ && obstacleMaxZ >= charMinZ;
  }
}
//build bar obstacle
function Obstacle_Bar(x, y, z, s) {
  this.mesh = new THREE.Object3D();
  var horizontalPole = new createBox_texture(800, 500, 10, 0, 1200, 0, textureBar);
  this.mesh.add(horizontalPole);
  var leftPole = new createBox(100, 2000, 10, Colors.white, -350, 0, -5);
  this.mesh.add(leftPole);
  var rightPole = new createBox(100, 2000, 10, Colors.white, 350, 0, -5);
  this.mesh.add(rightPole);
  this.mesh.position.set(x, y, z);
  this.mesh.scale.set(s, s, s);
  this.scaling = s;
  this.collides = function(charMinX, charMaxX, charMinY, charMaxY, charMinZ, charMaxZ) {
    var obstacleMinX = this.mesh.position.x - this.scaling * 400;
    var obstacleMaxX = this.mesh.position.x + this.scaling * 400;
    var obstacleMinY = this.mesh.position.y + this.scaling * 800;
    var obstacleMaxY = this.mesh.position.y + this.scaling * 2000;
    var obstacleMinZ = this.mesh.position.z - this.scaling * 100;
    var obstacleMaxZ = this.mesh.position.z + this.scaling * 100;
    return obstacleMinX <= charMaxX && obstacleMaxX >= charMinX &&
      obstacleMinY <= charMaxY && obstacleMaxY >= charMinY &&
      obstacleMinZ <= charMaxZ && obstacleMaxZ >= charMinZ;
  }
}
//check if the character collides with the obstacle
function collisionsDetected() {
  var charMinX = character.element.position.x - 115;
  var charMaxX = character.element.position.x + 115;
  var charMinY = character.element.position.y - 200;
  var charMaxY = character.element.position.y + 200;
  var charMinZ = character.element.position.z - 20;
  var charMaxZ = character.element.position.z + 20;
  for (var i = 0; i < obstacles.length; i++) {
    if (obstacles[i].collides(charMinX, charMaxX, charMinY,
        charMaxY, charMinZ, charMaxZ)) {
      return true;
    }
  }
  return false;
}

//create new row of obstacles
function createRowOfObstacles(position, ObstacleSize) {
  for (var lane = -1; lane < 2; lane++) {
    var randomNumber = Math.random();
    if (randomNumber > 0.85) {
      var obstacle = new Obstacle_Iron(lane * 600, -400, position, ObstacleSize);
      obstacles.push(obstacle);
      scene.add(obstacle.mesh);
    } else if (0.55 < randomNumber < 0.7) {
      var obstacle = new Obstacle_Wood(lane * 600, -400, position, ObstacleSize);
      obstacles.push(obstacle);
      scene.add(obstacle.mesh);
    } else if (0.7 < randomNumber < 0.85) {
      var obstacle = new Obstacle_Bar(lane * 600, -400, position, ObstacleSize);
      obstacles.push(obstacle);
      scene.add(obstacle.mesh);
    }
  }
}

//create empty group of objects at (x, y, z)
function createGroup(x, y, z) {
  var group = new THREE.Group();
  group.position.set(x, y, z);
  return group;
}

//create box without texture
function createBox(dx, dy, dz, color, x, y, z, notFlatShading) {
  var geom = new THREE.BoxGeometry(dx, dy, dz);
  var mat = new THREE.MeshPhongMaterial({
    color: color,
    flatShading: notFlatShading != true
  });
  var box = new THREE.Mesh(geom, mat);
  box.position.set(x, y, z);
  return box;
}
//create box with texture
function createBox_texture(dx, dy, dz, x, y, z, texturelink) {
  var geom = new THREE.BoxGeometry(dx, dy, dz);
  var texture = new THREE.TextureLoader().load(texturelink);
  var material = new THREE.MeshBasicMaterial({
    map: texture
  });
  var box = new THREE.Mesh(geom, material);
  box.position.set(x, y, z);
  return box;
}


function onWindowResize() {
  //resize & align
  sceneHeight = window.innerHeight;
  sceneWidth = window.innerWidth;
  renderer.setSize(sceneWidth, sceneHeight);
  camera.aspect = sceneWidth / sceneHeight;
  camera.updateProjectionMatrix();
}
