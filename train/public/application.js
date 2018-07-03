let video;
let poseNet;
let poses = [];
let socket;

function setup() {
  createCanvas(640, 480);
  noCursor();
  startWebSocket();
  startVideo();
  startPosenet();
}

function draw() {
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
}

function startPosenet() {
  poseNet = ml5.poseNet(video, 'multiple', gotPoses);
}

function startWebSocket() {
  socket = io.connect(window.location.origin);
  socket.on('ping', data => console.log(data));
}

function startVideo() {
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
}

// The callback that gets called every time there's an update from the model
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
          .map(d => { 
            return [{type: 'float', value: d.position.x}, {type: 'float', value: d.position.y}];
          })
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
    
  socket.emit('inputData', totalFeatures);
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = poses[i].pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        if(i == 0) {
          fill(255, 0, 0);
        } else
        if(i == 1) {
          fill(0, 255, 0);
        } else
        if(i == 2) {
          fill(0, 0, 255);
        }
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    // For every skeleton, loop through all body connections
    for (let j = 0; j < poses[i].skeleton.length; j++) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}