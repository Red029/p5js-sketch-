let video;
let handpose; // Store Handpose model objects for hand keypoint detection.
let predictions = []; // Save the results of the hand keypoint detection.
let baseZ = null; // Record the initial Z value, which is used to calculate the relative depth.
let smoothedZ = 0;
let smoothingFactor = 0.8;
let vertNum = 3;
const maxVerts = 100; // The maximum number of vertices for the shape.
const minVerts = 3;
let layers = 300;
let isHandDetected = false; // Check if the gesture exists
let fadeOutAlpha = 255; 
let breathingOffset = 0;
let layerEffects = [];
let detectionInterval = 50; //Time interval between two hand detections
let lastDetectionTime = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handpose = ml5.handpose(video, modelReady); // Load the Handpose model and bind the video inputs.
  handpose.on("predict", (results) => {
    predictions = results; // Update the test results.
  });

  frameRate(30);
  colorMode(HSB, 360, 100, 100, 100);

  for (let i = 0; i < layers; i++) {
    layerEffects.push({
      rotationSpeed: random(0.005, 0.03),
      alpha: map(i, 0, layers - 1, 100, 10), // Opacity of each layer, decreasing with the number of layers.
    });
  }
}

function modelReady() {
  console.log("Handpose Modle Ready！");
}
function draw() {
  background(0, 3);

  let currentTime = millis();

  if (!isHandDetected) {
    fill(0, fadeOutAlpha); 
    noStroke(); 
    rect(0, 0, width, height); 

    fill(255, fadeOutAlpha);
    textAlign(CENTER, CENTER);
    text("Raise your hand", width / 2, height / 2);

    if (Array.isArray(predictions) && predictions.length > 0) {
      // Gesture presence, reduced transparency
      fadeOutAlpha -= 5; 
      fadeOutAlpha = max(fadeOutAlpha, 0); // Ensure that it does not fall below 0

      
      if (fadeOutAlpha === 0) {
        isHandDetected = true;
      }
    } else {
      // Gesture not present, transparency gradually restored
      fadeOutAlpha += 5; 
      fadeOutAlpha = min(fadeOutAlpha, 255); // Ensure that it is not higher than 255
    }

  return; 
  }

  if (!(Array.isArray(predictions) && predictions.length > 0)) {
    isHandDetected = false; 
  }

  if (
    predictions.length > 0 &&
    currentTime - lastDetectionTime >= detectionInterval
  ) {
    lastDetectionTime = currentTime; // Update the detection time.

    const keypoints = predictions[0].landmarks; // Get the hand keypoints.
    let zValue = keypoints[9][2]; // Get the Z value of the Middle Finger MCP.

    if (baseZ === null) {
      baseZ = zValue; // Initialise the Z value.
    }

    smoothedZ = smoothedZ * smoothingFactor + zValue * (1 - smoothingFactor);
    let relativeZ = smoothedZ - baseZ;

    vertNum = int(map(relativeZ, 0, -200, minVerts, maxVerts)); // Map Z values to vertex counts.
    vertNum = constrain(vertNum, minVerts, maxVerts);
  }

  breathingOffset = sin(frameCount * 0.05) * 20; // Dynamic offset

  drawBackground(map(vertNum, minVerts, maxVerts, 0, 1));
  drawLayeredShapes();
}

function drawBackground(progress) {
  let radius = map(progress, 0, 1, 0, width * 2);
  let alpha = map(progress, 0, 1, 0, 15);

  noStroke();
  for (let r = radius; r > 0; r -= 5) {
    fill(220, 100, 100, alpha * (r / radius));
    ellipse(width / 2, height / 2, r * 2); // Drawing Concentric Circles
  }
}

function drawLayeredShapes() {
  for (let layer = 0; layer < layers; layer++) {
    let baseRadius = 50 + layer * 4 + breathingOffset; // Dynamically adjust the radius of each layer
    let alpha = layerEffects[layer].alpha;
    let hue = map(layer, 0, layers - 1, 180, 300); // Mapping colours according to the number of layers
    let rotationSpeed = layerEffects[layer].rotationSpeed; // Rotation speed per layer

    drawDynamicShape(
      width / 2,
      height / 2,
      vertNum,
      alpha,
      baseRadius,
      hue,
      rotationSpeed
    );
  }
}

function drawDynamicShape(cx, cy, vertNum, alpha, radius, hue, rotationSpeed) {
  push();
  translate(cx, cy);
  rotate(frameCount * rotationSpeed);

  noFill();
  stroke(hue, 80, 100, alpha);
  strokeWeight(0.5);

  beginShape();
  for (let i = 0; i < vertNum; i++) {
    let angle = map(i, 0, vertNum, 0, TWO_PI); //Drawing polygons
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    vertex(x, y);
  }
  endShape(CLOSE);
  pop();
}
