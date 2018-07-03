# Authentication experiment using Posenet
This is an experiment in building a machine learning authentication system for groups of people. The assumption is that passwords can not only be used as a means to conceil something, but as a public act between friends, people who have interests or business together, or groups. A longer and more precise description can be found at the end of this document.

# Demo
Since this setup also requires Wekinator to run, no demo is immediately available on the web. Please see [this video]() for reference.

# Technical overview
Since an only web based implementation of this is system is not available at the time, we are using ml5.js and Posenet to estimate pose in real time and Wekinator's KNN implementation to evaluate the current pose against some poses that we previously trained the machine to recognize.

Pixels are read from the camera, then transformed in a/several pose estimation by Posenet. This data is sent from the browser to the node server using websockets, and then from the server to the Wekinator desktop app via OSC. Wekinator compares the data against several pre-trained poses and sends back the result of the evaluation (the closest neighbor available) via OSC. The server reads OSC, and, sends it back to the client that renders the output in a visual way.

In this project, you can find two sketches: train and run. Train contains the sketch used to train Wekinator. If gives feedback on the current position of the skeletons. Run is the sketch the performs the actual demo.

# Steps to set it up yourself

## Installation
- `cd` in the project directory
- `npm install`

## Setup
After downloading and opening [Wekinator](http://www.wekinator.org/), you configure it as it follows:
- port: 3333
- 102 inputs
- 1 output
- type of output: all classifiers
- 4 classes

![Wekinator setup](https://parcodiyellowstone.it/docs/1807_workshop_machine_learning_muda/wekinator_setup.png)

Then you click "Next >", go back to the scripts folder and type `npm run train` into the console.
At this point, if you open the browser at [http://localhost:3000](http://localhost:3000), your Wekinator OSC in should turn green, which means that the OSC bridge is up and running.

![Wekinator setup](https://parcodiyellowstone.it/docs/1807_workshop_machine_learning_muda/wekinator_osc_light.png)


## Training Wekinator
The four classifiers represent different situations. In our scenario:
- class 1 is empty (rest state)
- class 2 contains 1 skeleton (starting authentication part 1)
- class 3 contains 2 skeletons (starting authentication part 2)
- class 4 contains 2 skeletons holding a particular position (authentication successful)

To train a single class, click on the number next to "output-1", then "Start Recording". When you are done recording, click "Stop Recording". Train all 4 classifiers, and then click "Train" to train Wekinator to recognise this four scenarios. If you want to use the Wekinator project we've already trained, please download it from [here](https://parcodiyellowstone.it/docs/1807_workshop_machine_learning_muda/wekinator_training.zip).

## Running the sketch
- Stop the `npm run train` sketch
- Run the `npm run run` sketch
- Check on Wekinator that the OSC in light is green
- Try all four situations and see how things change on the screen

## TL;DR
See [this video screencast]() to set it up yourself.

# What is this about?
Passwords are commonly seen as a private and individual thing, designed in order to keep our private secret, but what if could have a password that belongs to a community or to a group of people and actually needs that group of people to work?
In “Divided we fall” authentication is articulated through 4 different steps or states:

![State 0](https://parcodiyellowstone.it/docs/1807_workshop_machine_learning_muda/project_state0.png)

State #1: While nobody is in front of the machine the application is resting and displaying a hidden non-sense message
State #2:   If a single person is sitting in front of the machine more letters appear in the message still not making sense
State #3: If two persons are around the message starts to make sense but still nothing is happening

![State 3](https://parcodiyellowstone.it/docs/1807_workshop_machine_learning_muda/project_state3.png)

State #4: Only once that people execute a special move they can unlock the application and authenticate to their private contents

![State 4](https://parcodiyellowstone.it/docs/1807_workshop_machine_learning_muda/project_state4.png)

(We also tried to add a fifth state in order to disguise the content if a third person appears. Due to technical issues with Posenet we sadly gave up on this.)

# Lessons learnt
Posenet gets easily confused if one person moves too fast, or is not fully in front of the screens. Often a single person is seen by Posenet as two skeletons. We don't know if this depends on the implementations. We were able to reproduce the problem with different light condition and distances.

It's hard to make Wekinator understand the difference between two people coming into the screen, or two people in front of the screen doing a particular gesture. One must be very accurate to setup a contained environment so that the algorythm doesn't get too confused. Probably with more time and tries, it all becomes clearer and easier to do.

# Tools and resources
This example is built with
- [ml5.js](https://ml5js.org/) and it's [Posenet](https://ml5js.org/docs/PoseNet) implementation to estimate the skeletons pose
- [p5.js](https://p5js.org/) under the hood to capture the video stream and render the pixels
- [a browser/wekinator bridge](https://github.com/fredeerock/wekp5) (OSC + websockets + node.js) built by @fredeerock which is based onto [noisyneuron's integration](https://github.com/noisyneuron/wekOsc)
- [wekinator](http://www.wekinator.org/)

# Context
This little demo was built by Emanuele Bonetti and Ruggero Castagnola during the Machine learning for creatives workshop at [MuDA](https://muda.co/zurich/), organized by [SUPSI](http://www.supsi.ch/home.html) and run by [Matteo Loglio](https://matlo.me/).
