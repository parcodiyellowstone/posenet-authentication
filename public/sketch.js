let video;
let poseNet;
let poses = [];
let socket;
let state = 'ONE_PERSON';
let featureDim = 20;

let canvasWidth = 640, canvasHeight = 480;

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
  //video.hide();
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
      state = 'ONE_PERSON';
      renderLandingHalf();
    break;
    case 2:
      state = 'TWO_PEOPLE';
      renderLandingComplete();
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

}

function renderLandingHalf() {
  //const firstPoint = poses[0].pose.keypoints[0].position;
  //console.log(firstPoint);
  //console.log(cameraToBrowserCoords(firstPoint));
}

function renderLandingComplete() {

}

function renderAuthenticate() {

}

function renderDisguise() {
  hideAll();
  disguise.play();
}

function hideAll() {

}

// Renders skeleton points in the canvas
function renderSkeleton() {
  poses.reduce((prevPose, nextPose) => {  
    nextPose.pose.keypoints.map(d => ellipse(d.position.x, d.position.y, featureDim, featureDim))
  }, '');
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

const disguise = new Disguise('disguise');
window.onYouTubeIframeAPIReady = () => disguise.load();
// after
//disguise.play();


