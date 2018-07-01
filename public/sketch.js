let video;
let poseNet;
let poses = [];
let skeletons = [];
let socket;

function setup() {
  // Create the canvas element
  createCanvas(640, 480);
  // Open the socket communication
  startWebSocket();
  // Start the video feed
  startVideo();
  // Start Pose estimation on the video feed
  startPosenet();
  // Hide the mouse cursor
  noCursor();
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
  socket.emit('inputData', totalFeatures);
}