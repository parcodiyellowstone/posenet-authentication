# Password experiment using Posenet
This is an experiment in building a machine learning authentication system for groups of people. The assumption is that passwords can not only be used as a means to conceil something, but as a public act.

# Installation
Simply:
- `npm install`
- `node app.js`
- navigate to http://localhost:3000
- train in Wekinator

Since this setup also requires Wekinator, a desktop app, to run, no demo is immediately available on the web.

# Training wekinator and setting up

# Technical overview
Since an only web based implementation of this is system is not available at the time, we are using ml5.js and Posenet to estimate pose in real time and Wekinator's KNN evaluate the current pose against some poses that we previously trained the machine to recognize.

Pixels are read from the camera, then transformed in a/several pose estimation by Posenet. This data is sent from the browser to the node server using websockets, and then from the server to the Wekinator desktop app via OSC. Wekinator compares the data against several pre-trained poses and sends back the result of the evaluation (the closest neighbor available) via OSC. The server reads OSC, and, sends it back to the client that renders the output in a visual way.

# Tools and resources
This example is built with
- [ml5.js](https://ml5js.org/) and it's [Posenet](https://ml5js.org/docs/PoseNet) implementation
- [p5.js](https://p5js.org/) under the hood
- [a browser/wekinator bridge](https://github.com/fredeerock/wekp5) (OSC + websockets + node.js) built by @fredeerock which is based onto [noisyneuron's integration](https://github.com/noisyneuron/wekOsc)
- [wekinator](http://www.wekinator.org/)