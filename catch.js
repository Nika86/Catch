const empty = 0;

const up = 2;
const right = 3;
const down = 4;
const left = 5;

const ticksPerUnitDrop = 2;
const ticksPerNewDrop = 12;
const initialLength = 12;

const W = 80;
const H = 50;
const T = 100;
const firstPauseTime = 1000;

const thingColours = ['#000000','#cccccc','#99ff99'];
const thingColourOpacities = ['0.0','1.0','1.0'];
// colours: empty, net, ball


var board = new Array(W*H);

var moveCount = 0;
var gameScore = 0;
var drops = new Array();

function createEmptyRect(x, y) {
  board[W*y + x] = empty;
  var unit = document.getElementById('boardWrapper').style['width'];
  unit = parseFloat(unit)/W;

  var newRect = document.createElement('div');
  newRect.setAttribute('id','cell' + (W*y + x));
  newRect.setAttribute('class','boardCell');

  newRect.style['backgroundColor'] = thingColours[0];
  newRect.style['opacity'] = thingColourOpacities[0];
  newRect.style['left'] = unit*x;
  newRect.style['top'] = unit*y;
  newRect.style['width'] = unit;
  newRect.style['height'] = unit;

  document.getElementById('gameBoard').appendChild(newRect);
}

function setRectColour(x, y, colourIndex) {
  document.getElementById('gameBoard').childNodes[W*y + x].style['backgroundColor'] = thingColours[colourIndex];
  document.getElementById('gameBoard').childNodes[W*y + x].style['opacity'] = thingColourOpacities[colourIndex];
}

function updateScore(score) {
  var oldNode = document.getElementById('score').childNodes[0];
  var textNode = document.createTextNode('Score: ' + score);
  document.getElementById('score').replaceChild(textNode,oldNode);
}

function updateSpeedDisplay(newSpeed) {
  var oldNode = document.getElementById('gamespeed').childNodes[0];
  var textNode = document.createTextNode('Game speed: ' + (newSpeed > 0?'+':'') + newSpeed);
  document.getElementById('gamespeed').replaceChild(textNode, oldNode);
}

function xShift(dir) {
  switch (dir) {
    case right:
      return 1;
    case left:
      return -1;
    default:
      return 0;
  }
}

function yShift(dir) {
  switch (dir) {
    case down:
      return 1;
    case up:
      return -1;
    default:
      return 0;
  }
}

function GameState() {
  const maxSpeed = 10;
  const minSpeed = -10;
  this.speed = 0;
  this.speedFactor = 1.0;
  this.paused = true;
  this.resume = function() {
    document.getElementById('menu').style.display = 'none';
    this.paused = false;
    this.scheduleTick();
  }
  this.pause = function() {
    document.getElementById('menu').style.display = 'block';
    this.paused = true;
  }
  this.togglePause = function() {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }
  this.speedUp = function() {
    if (this.speed < maxSpeed) {
      this.speed += 2;
    }
    this.speedFactor = Math.pow(10.0, this.speed/10.0);
    updateSpeedDisplay(this.speed);
  }
  this.slowDown = function() {
    if (this.speed > minSpeed) {
      this.speed -= 2;
    }
    this.speedFactor = Math.pow(10.0, this.speed/10.0);
    updateSpeedDisplay(this.speed);
  }
  this.scheduleTick = function() {
    if (!this.paused) {
      setTimeout('tick();', T/this.speedFactor);
    }
  }
}

var gameState = new GameState();

function thing(x, y, dir, length, colour) {
  this.ex = x;
  this.ey = y;
  this.g = 0; // how much more the thing needs to grow
  this.c = colour; // thing colour
  this.moved = true;
  this.sx = x + (length - 1)*xShift(dir)
  this.sy = y + (length - 1)*yShift(dir)
  for (var i = 0; i < length; i++)
  {
    var x = this.ex + i*xShift(dir);
    var y = this.ey + i*yShift(dir);
    board[W*y + x] = dir;
    setRectColour(x, y, this.c);
  }
}

thing.prototype.tailMove = function() {
  if (this.g > 0) {
    this.g--;
  } else {
    var dir = board[W*this.ey + this.ex];
    board[W*this.ey + this.ex] = empty;
    setRectColour(this.ex, this.ey, 0);
    this.ex = ((this.ex + xShift(dir)) + W) % W;
    this.ey = ((this.ey + yShift(dir)) + H) % H;
  }
}

thing.prototype.frontMove = function() {
  var x = ((this.sx + xShift(board[W*this.sy + this.sx])) + W) % W;
  var y = ((this.sy + yShift(board[W*this.sy + this.sx])) + H) % H;
  var targetType = board[W*y + x];
  switch(targetType) {
    case empty:
      board[W*y + x] = board[W*this.sy + this.sx];
      setRectColour(x, y, this.c);
      this.sx = x;
      this.sy = y;
      this.moved = true;
      return 1;
    default:
      return 0;
  }
}

const keyCodeArray = [37,39,80,77,27,32,173,189,61,187];

function keyHandler(event) {
  if (event.keyCode in keyCodeArray)
    event.preventDefault();
  switch (event.keyCode) {
    case 37: /* left */
    	net.frontMove();
    	net.tailMove();
      break;
    case 39: /* right */
    	net.frontMove();
    	net.tailMove();
      break;
    case 80: /* P */
    case 77: /* M */
    case 27: /* Esc */
    case 32: /* Space */
      gameState.togglePause();
      break;
    case 173: /* - char code (for firefox) */
    case 189: /* - */
      gameState.slowDown();
      break;
    case 61: /* = char code (for firefox) */
    case 187: /* + */
      gameState.speedUp();
      break;
  }
}

function tick() {
	// update drop positions
	if (moveCount % ticksPerUnitDrop == 0) {
		for (var dropNum in drops) {
			drops[dropNum].frontMove();
			drops[dropNum].tailMove();
		}
	}

	// spawn new drops
	if (moveCount % ticksPerNewDrop == 0) {
		drops.push(new thing(1 + Math.floor(Math.random()*(W-2)), 2, down, 2, 2));
		
	}

	updateScore(gameScore);
	moveCount += 1;
	gameState.scheduleTick();
}

function newGame() {
  // clean up the board
  for (var y = 0; y < H; y++)
    for (var x = 0; x < W; x++) {
      board[W*y + x] = empty;
      setRectColour(x, y, 0);
    }

  net = new thing(W/2 - initialLength/2, H - 2, right, initialLength, 1)
  moveCount = 0;

  gameState.moveMethod = tick;
  updateScore(gameScore);
  setTimeout(gameState.resume(), firstPauseTime);
}

function init()
{
  // setup game board
  for (var y = 0; y < H; y++)
    for (var x = 0; x < W; x++)
      createEmptyRect(x, y);

  // setup menu button functions
  document.getElementById('resume_button').onclick = function() {
    gameState.resume();
  }

  document.documentElement.addEventListener('keydown',keyHandler,false);

  newGame();
}