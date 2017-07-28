(function () {
  'use strict';

  const bufferSize = 1024;
  let Audio = require('./audio');
  let a = new Audio(bufferSize);
  let socketio = require('socket.io-client');
  var io = socketio('192.168.0.113:3000');

  var aspectRatio = 16 / 10;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, aspectRatio, 0.1, 1000);

  var initializeFFTs = function (number, pointCount) {
    var ffts = [];
    for (var i = 0; i < number; i++) {
      ffts.push(Array.apply(null, Array(pointCount)).map(
        Number.prototype.valueOf, 0
      ));
    }

    return ffts;
  };

  var material = new THREE.LineBasicMaterial({
    color: 0x00ff00
  });

  var yellowMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff
  });

  var ffts = initializeFFTs(20, bufferSize);
  var buffer = null;

  var renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas") });

  function resize() {
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = 'auto';

    var resolution = renderer.domElement.clientWidth / 16 * 10;
    renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

    renderer.setSize(resolution * aspectRatio, resolution);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = 'auto';

    camera.aspect = (resolution * aspectRatio) / resolution;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener('resize', resize);

  camera.position.z = 5;

  // Unchanging variables
  const length = 1;
  const hex = 0xffff00;
  const dir = new THREE.Vector3(0, 1, 0);
  const rightDir = new THREE.Vector3(1, 0, 0);
  const origin = new THREE.Vector3(1, -6, -15);

  // Variables we update
  let loudnessLines = new THREE.Group();
  scene.add(loudnessLines);
  var r = 0,g = 0,b = 0,w = 0;

  let features = null;

  function render() {
    features = a.get([
      'loudness',
    ]);
    if (features) {
        // Render loudness
        if (features.loudness && features.loudness.specific) {
        r = (features.loudness.specific[2]/2.5 - 0.25).clamp(0,1);
        g = (features.loudness.specific[8]/1.5 - 0.25).clamp(0,1);
        b = (features.loudness.specific[16]/3 - 0.25).clamp(0,1);
        w = (features.loudness.specific[20]/2 - 0.25).clamp(0,1);

        var message = r +  g + b + w;
        document.getElementById("loud").innerHTML = message;
        if(message != 0)
        {
            var intensity = ((r * 2 + b + g + w)/8).clamp(0,1);;
            io.emit('rainbow', {intensity: intensity});
        }
  
        for (var i = 0; i < features.loudness.specific.length; i++) {
          let geometry = new THREE.Geometry();
          geometry.vertices.push(new THREE.Vector3(
            -11 + 22 * i / features.loudness.specific.length,
            -6 + features.loudness.specific[i] * 3,
            -15
          ));
          geometry.vertices.push(new THREE.Vector3(
            -11 + 22 * i / features.loudness.specific.length + 22 / features.loudness.specific.length,
            -6 + features.loudness.specific[i] * 3,
            -15
          ));
          loudnessLines.add(new THREE.Line(geometry, yellowMaterial));
          geometry.dispose();
        }
      }

      for (let c = 0; c < loudnessLines.children.length; c++) {
        loudnessLines.remove(loudnessLines.children[c]); //forEach is slow
      }
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }
  io.on('connect', function (data) {
      var message = r + "," + g + "," + b + "," + w;
      document.getElementById("loud").innerHTML = message;
      //io.emit('rgbw', {r: r, g: g, b: b, w: w});

    });

  render();

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};
  

})();

