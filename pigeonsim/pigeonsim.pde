
/* beware: technical debt ahead! */

import SimpleOpenNI.*;

import muthesius.net.*;
import org.webbitserver.*;

int     wsPort              = 8888;
float   scaleFactor         = 1.0;
int     fps                 = 30;
float   leanStraightDeg     = 0; // deg -- may be overridden by calibration
float   leanThresholdDeg    = 1.5; // deg
long    flightGracePeriod   = 333; // ms
long    flapHighlightPeriod = 500; // ms
boolean showText            = false;

WebSocketP5   ws;
SimpleOpenNI  ni;
IntVector     users;
PImage        pigeonImg;

PFont         font;
PFont         tinyFont;
color         bgCol, readyCol, flyCol, diveCol, flapCol, resetCol, calibCol;
PVector       head, neck, rShoul, lShoul, rElbow, lElbow, rHand, lHand, rHip, lHip;
PVector       convertedHead;
float         confHead, confNeck;

int  flyingUserId = -1;
int  flapStage = -1;
long lastFlightTime, lastFlapTime;
float textX, textY; 

void setup() {
  rShoul = new PVector(); lShoul = new PVector();
  rElbow = new PVector(); lElbow = new PVector();
  rHand  = new PVector(); lHand  = new PVector();
  rHip   = new PVector(); lHip   = new PVector();
  head   = new PVector(); neck   = new PVector();
  convertedHead = new PVector();
  
  readyCol = color(255);             // white
  flyCol   = color(255, 255,   0);   // yellow
  diveCol  = color(255, 128,   0);   // orange
  flapCol  = color(  0, 255,   0);   // green
  resetCol = color(64,  128, 255);   // blue
  calibCol = color(255,   0, 255);   // magenta
  
  ni    = new SimpleOpenNI(this);
  users = new IntVector();
  
  ni.setMirror(true);
  if (! ni.enableDepth()) {
     println("Can't open the depth map: is the camera connected?");
     exit();
     return;
  }
  ni.enableUser(SimpleOpenNI.SKEL_PROFILE_ALL);
  
  ws = new WebSocketP5(this, wsPort);

  frameRate(fps);
  size(round(ni.depthWidth() * scaleFactor), round(ni.depthHeight() * scaleFactor));
  
  font = loadFont("HelveticaNeue-Bold-60.vlw");
  tinyFont = loadFont("HelveticaNeue-9.vlw");
  textX = width  * 0.5;
  textY = height * 0.975;
  
  smooth();
  pigeonImg = loadImage("pigeon.png");
}

void draw() {
  scale(scaleFactor);
  textFont(font);
  textAlign(CENTER);
  
  ni.update();
  imageMode(CORNER);
  image(ni.depthImage(), 0, 0);  
  ni.getUsers(users);
  long len = users.size();
  
  // identify current OR front-and-centremost user
  int activeUserId = -1;
  
  if (flyingUserId > 0 && ni.isTrackingSkeleton(flyingUserId)) {  // flyingUserId is set in identifyGestures
    activeUserId = flyingUserId;
  } else {
    float frontUserXZ = 1.0 / 0.0;  // Infinity
    for (int i = 0; i < len; i ++) {
      int userId = users.get(i);
      if (ni.isTrackingSkeleton(userId)) {
        ni.getJointPositionSkeleton(userId, SimpleOpenNI.SKEL_NECK, neck);
        float xz = abs(neck.x * 5.0) + neck.z;  // lower z is nearer the Kinect; x nearer 0 is nearer the centre of the scene
        if (xz < frontUserXZ) {
          activeUserId = userId;
          frontUserXZ = xz;
        }
      }
    }
  }
  
  // draw users and identify gestures
  for (int i = 0; i < len; i ++) {
    int userId = users.get(i);
    if (ni.isTrackingSkeleton(userId)) {
      stroke(127);
      strokeWeight(12);
      drawSkeleton(userId, false);
      if (userId == activeUserId) identifyGestures(userId);
    }
  }

  textFont(tinyFont);
  fill(0);
  text("Pigeon image by Photos8.org", width - 75.0, height - 8.0);
  fill(255);
  text("Pigeon image by Photos8.org", width - 74.0, height - 7.0);
}
