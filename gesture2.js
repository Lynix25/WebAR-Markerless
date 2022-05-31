export function gestureDetector(object, target) {
  // ===== Initial States START =====
  object.internalState = {
    previousState: null
  };

  object.addEventListener("touchstart", emitGestureEvent);
  object.addEventListener("touchend", emitGestureEvent);
  object.addEventListener("touchmove", emitGestureEvent);

  target.isVisible = true;
  target.scaleFactor = 1;
  target.initialScale = target.scale.clone();

  // ===== Initial States END =====

  function emitGestureEvent(event) {
    const currentState = getTouchState(event);

    const previousState = object.internalState.previousState;

    const gestureContinues =
      previousState &&
      currentState &&
      currentState.touchCount == previousState.touchCount;

    const gestureEnded = previousState && !gestureContinues;

    const gestureStarted = currentState && !gestureContinues;

    if (gestureEnded) {
      const eventName = getEventPrefix(previousState.touchCount) + "fingerend";

      object.internalState.previousState = null;
    }

    if (gestureStarted) {
      currentState.startTime = performance.now();

      currentState.startPosition = currentState.position;

      currentState.startSpread = currentState.spread;

      const eventName = getEventPrefix(currentState.touchCount) + "fingerstart";

      object.internalState.previousState = currentState;
    }

    if (gestureContinues) {
      const eventDetail = {
        positionChange: {
          x: currentState.position.x - previousState.position.x,

          y: currentState.position.y - previousState.position.y
        }
      };

      if (currentState.spread) {
        eventDetail.spreadChange = currentState.spread - previousState.spread;
      }

      // Update state with new data

      Object.assign(previousState, currentState);

      // Add state data to event detail

      Object.assign(eventDetail, previousState);

      const eventName = getEventPrefix(currentState.touchCount) + "fingermove";

      gestureHandler(eventName, eventDetail, target);
    }
  }

  function getTouchState(event) {
    if (event.touches.length === 0) {
      return null;
    }

    // Convert event.touches to an array so we can use reduce
    const touchList = [];

    for (let i = 0; i < event.touches.length; i++) {
      touchList.push(event.touches[i]);
    }

    const touchState = {
      touchCount: touchList.length
    };

    // Calculate center of all current touches

    const centerPositionRawX =
      touchList.reduce((sum, touch) => sum + touch.clientX, 0) /
      touchList.length;

    const centerPositionRawY =
      touchList.reduce((sum, touch) => sum + touch.clientY, 0) /
      touchList.length;

    touchState.positionRaw = { x: centerPositionRawX, y: centerPositionRawY };

    // Scale touch position and spread by average of window dimensions

    const screenScale = 2 / (window.innerWidth + window.innerHeight);

    touchState.position = {
      x: centerPositionRawX * screenScale,
      y: centerPositionRawY * screenScale
    };

    // Calculate average spread of touches from the center point

    if (touchList.length >= 2) {
      const spread =
        touchList.reduce((sum, touch) => {
          return (
            sum +
            Math.sqrt(
              Math.pow(centerPositionRawX - touch.clientX, 2) +
              Math.pow(centerPositionRawY - touch.clientY, 2)
            )
          );
        }, 0) / touchList.length;

      touchState.spread = spread * screenScale;
    }

    return touchState;
  }

  function getEventPrefix(touchCount) {
    const numberNames = ["one", "two", "three", "many"];

    return numberNames[Math.min(touchCount, 4) - 1];
  }
};

function gestureHandler(eventName, event, object) {
  let enabled = true,
    rotationFactor = 5,
    minScale = 0.3,
    maxScale = 8;

  if (eventName == "onefingermove") {
    handleRotation();
  }
  else if (eventName == "twofingermove") {
    handleScale();
  }

  function handleRotation() {
    console.log(event)
    if (object.isVisible) {
      let temp_x = event.positionChange.x;
      let temp_y = event.positionChange.y;
      object.rotateY(temp_x * rotationFactor);
      object.rotateX(temp_y * rotationFactor);
    }
  }

  function handleScale() {
    if (object.isVisible) {
      object.scaleFactor *= 1 + event.spreadChange / event.startSpread;
      object.scaleFactor = Math.min(Math.max(object.scaleFactor, minScale), maxScale);
      object.scale.set(object.scaleFactor * object.initialScale.x, object.scaleFactor * object.initialScale.y, object.scaleFactor * object.initialScale.z);
      _.innerHTML = `SCALE ${object.scale.x} ${object.scale.y} ${object.scale.z}`;
    }
  }
}