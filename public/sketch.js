let video;
let poseNet;
let poses = [];
let socket;
let state = 'REST';
let featureDim = 20;
let disguise;
let gallery;

// specchiare canvas + dimensione pallini resize

const spans = document.querySelectorAll('h1 span');
const spans_layer0 = document.querySelectorAll('h1 span.layer_0');
const spans_layer1 = document.querySelectorAll('h1 span.layer_1');
const spans_layer2 = document.querySelectorAll('h1 span.layer_2');
const disguiseElement = document.querySelector('.disguise-wrapper');
const authenticatedElement = document.querySelector('.authenticated-wrapper');

let canvasWidth = 640, canvasHeight = 480;

class Disguise {
  constructor(wrapperId) {
    this.player = undefined;
    this.wrapperId = wrapperId;
  }

  load() {
    this.player = new YT.Player(this.wrapperId, {
      width: 600,
      height: 400,
      videoId: 'fbhz3XcNzGU'
    });
  }

  play() {
    this.player.playVideo();
  }

  stop() {
    this.player.stopVideo();
  }
}



disguise = new Disguise('disguise');
window.onYouTubeIframeAPIReady = () => disguise.load();

function setup() {
  // Create the canvas element
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas');
  // Open the socket communication
  //startWebSocket();
  // Start the video feed
  startVideo();
  // Start Pose estimation on the video feed
  startPosenet();
  // Hide the mouse cursor
  noCursor();
  fill(255, 0, 0);
  noStroke();
  // Init image gallery
  initGallery();
  // Render rest state
  renderRest();
}

function draw() {
  background(255);
  if(state == 'ONE_PERSON' || state == 'TWO_PEOPLE' || state == 'AUTHENTICATE') {
    renderSkeleton();
  }
}

function startPosenet() {
  poseNet = ml5.poseNet(video, 'multiple', gotPoses);
}

function startWebSocket() {
  socket = io.connect(window.location.origin);
  socket.on('ping', data => {});
  socket.on('outputData', onSocketMessage);
}

function startVideo() {
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
}

function gotPoses(results) {
  // Update poses object
  poses = results;

  // Duplicate it
  let _poses = [...poses];
  
  // Limit the number of poses returned to 3
  if(_poses.length > 2) {
    _poses.length = 2;
  }

  /* 
   * Flatten the poses to a single array of x and y positions.
   * Each pose has 17 features with an x and y position according 
   * to https://github.com/tensorflow/tfjs-models/tree/master/posenet#keypoints.
   * So 17 features * 2 positions (x and y) makes 34 items per pose
   * Since we track up to 3 people, this array may be up to 34 * 3 = 102 items long
   */
  let totalFeatures = 
    _poses.reduce((prevPose, nextPose) => {
      const nextKeypoints = nextPose.pose.keypoints;
      
      const nextFeatures =
        nextKeypoints
          .map(d => ([{type: 'float', value: d.position.x}, {type: 'float', value: d.position.y}]))
          .reduce((prev, next) => prev.concat(next), []);

      return prevPose.concat(nextFeatures);
    }, []);
  
  /*
   * If we have less then 102 items, add negative values
   * to the items to send. This is a hack, because Wekinator
   * breaks if the number of inputs changes over time.
   * So we send an array that is always 102 items long, 
   * with negative values to describe the absence of a pose.
   * 
   * If the array has 102 items with value -1, no poses are estimated;
   * If 34 items have values and 68 are -1, 1 pose is estimated;
   * If 68 items have values and 34 are -1, 2 poses are estimated;
   * If 102 items have values, 3 poses are estimated.
   */
  while(totalFeatures.length < 102) {
    totalFeatures.push({type: 'float', value: -1});
  }
  
  // Send data
  //socket.emit('inputData', totalFeatures);
}

// When there is a new message, render the result visually in the browser
function onSocketMessage(data) {
  const prediction = data.args[0].value;
  renderToBrowser(prediction);
}

// Based on the prediction, render a different scendario
function renderToBrowser(prediction) {
  switch(prediction) {
    case 0:
      state = 'REST';
      renderRest();
    break;
    case 1:
      if(state != 'AUTHENTICATE') {
        state = 'ONE_PERSON';
        renderLandingHalf();  
      }
    break;
    case 2:
      if(state != 'AUTHENTICATE') {
        state = 'TWO_PEOPLE';
        renderLandingComplete();  
      }
    break;
    case 3:
      state = 'AUTHENTICATE';
      renderAuthenticate();
    break;
    case 4:
      state = 'DISGUISE';
      renderDisguise();
    break;
  }
}



function renderRest() {
  disguiseElement.classList.remove('visible');
  authenticatedElement.classList.remove('visible');
  addToAll(spans, 'hidden');
  removeFromAll(spans_layer0, 'hidden');
}

function renderLandingHalf() {
  disguiseElement.classList.remove('visible');
  authenticatedElement.classList.remove('visible');
  addToAll(spans, 'hidden');
  removeFromAll(spans_layer1, 'hidden');
}

function renderLandingComplete() {
  disguiseElement.classList.remove('visible');
  authenticatedElement.classList.remove('visible');
  addToAll(spans, 'hidden');
  removeFromAll(spans_layer2, 'hidden');
}

function renderAuthenticate() {
  disguiseElement.classList.remove('visible');
  authenticatedElement.classList.add('visible');
  removeFromAll(spans, 'hidden');
  // sei loggato
}

function renderDisguise() {
  addToAll(spans, 'hidden');
  authenticatedElement.classList.remove('visible');
  disguiseElement.classList.add('visible');
  disguise.play();
}

// Renders skeleton points in the canvas
function renderSkeleton() {
  for(let i = 0; i < poses.length; i++) {
    const pose = poses[i].pose;
    if(i == 0) {
      fill(255, 0, 0);
    } else
    if(i == 1) {
      fill(0, 255, 0);
    } else
    if(i == 2) {
      fill(0, 0, 255);
    }
    pose.keypoints.map(d => ellipse(d.position.x, d.position.y, featureDim, featureDim))
  }    
}

function initGallery() {
  gallery = new Siema({
    selector: '.gallery',
    // duration: 200,
    // easing: 'ease-out',
    // perPage: 1,
    // startIndex: 0,
    // draggable: true,
    // multipleDrag: true,
    // threshold: 20,
    // loop: false,
    // rtl: false,
    // onInit: () => {},
    // onChange: () => {},
  });
}



/*
 * Utilities
 */
function cameraToBrowserCoords(pointPos) {
  return {
    x: pointPos.x * 100 / canvasWidth,
    y: pointPos.y * 100 / canvasHeight
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function addToAll(els, classToAdd) {
  const _els = [...els];
  for(let i = 0; i < _els.length; i++) {
    _els[i].classList.add(classToAdd);
  }
}

function removeFromAll(els, classToRemove) {
  const _els = [...els];
  for(let i = 0; i < _els.length; i++) {
    _els[i].classList.remove(classToRemove);
  }
}







