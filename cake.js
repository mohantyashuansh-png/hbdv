// ============================================================
//  cake.js — Three.js POV Birthday Cake Cutting (Mic + Slice)
// ============================================================
/* global THREE, startMicListener, stopMicListener, playHBDSong */

(function () {
  'use strict';

  let scene, camera, renderer, animId;
  let active = false;
  let clock;

  // scene objects
  let cakeGroup, mainCake, sliceGroup;
  let photoMeshes = [];
  let candleFlames = [];
  let ambientLight, pointLight;

  // phases: 0=blowing, 1=cutting, 2=done
  let phase = 0; 
  
  // cut state
  let cutCount = 0;
  let isDragging = false;
  let cutAccum = 0;
  let sliceAnim = 0; // 0 to 1

  let knifeEl;
  let knifeX = -999, knifeY = -999;
  let prevKX = -999, prevKY = -999;

  const srcs = [
    cakeBase64['cake_img1'], cakeBase64['cake_img2'], cakeBase64['cake_img3'],
    cakeBase64['cake_img4'], cakeBase64['cake_img5'], cakeBase64['cake_img6']
  ];
  const texLoader = new (function(){
    this._loader = null;
    this.load = (src, ok, _, err) => {
      if (!this._loader) this._loader = new THREE.TextureLoader();
      return this._loader.load(src, ok, undefined, err);
    };
  })();

  let wrap, msgEl, instrEl;

  window.initCakePage = function () {
    wrap    = document.getElementById('cake-canvas-wrap');
    msgEl   = document.getElementById('cake-message');
    instrEl = document.getElementById('cake-instruction');
    knifeEl = document.getElementById('cake-knife');

    phase = 0;
    cutCount = 0;
    isDragging = false;
    sliceAnim = 0;
    cutAccum = 0;

    if (msgEl)  { msgEl.classList.add('hidden'); msgEl.classList.remove('show'); }
    if (knifeEl) knifeEl.style.opacity = '0'; // hidden until phase 1
    if (instrEl) instrEl.innerHTML = "Blow into your mic to make a wish! 🌬️🎂<br><small>(or tap here if mic doesn't work)</small>";

    teardown();
    buildScene();
    attachEvents();

    active = true;
    if (animId) cancelAnimationFrame(animId);
    loop();

    // Start mic listener from audio.js
    if (typeof startMicListener === 'function') {
      startMicListener((amt) => {
        if (phase !== 0) return;
        
        // Dim candles based on blowing
        candleFlames.forEach(cf => {
           cf.baseInt = Math.max(0, 0.8 - (amt / 100) * 0.8);
        });

        if (amt >= 100) {
          phase = 1; // move to cutting
          blowOutCandles();
        }
      });
    } else {
      // fallback if audio.js failed to load
      instrEl.onclick = blowOutCandles;
    }
  };

  window.stopCakePage = function () {
    active = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    if (typeof stopMicListener === 'function') stopMicListener();
    detachEvents();
    teardown();
  };

  function blowOutCandles() {
    phase = 1;
    if (typeof stopMicListener === 'function') stopMicListener();
    
    // Extinguish completely
    candleFlames.forEach(cf => {
      cf.baseInt = 0;
      cf.light.intensity = 0;
      if (cf.mesh) cf.mesh.visible = false; // hide flame sphere
    });

    // Play song
    if (typeof playHBDSong === 'function') playHBDSong();

    // Show knife & update text
    if (instrEl) instrEl.innerHTML = "Make 2 cuts to get your slice! 🔪";
    if (knifeEl) knifeEl.style.opacity = '1';
  }

  function teardown() {
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }
    scene = null; camera = null; clock = null;
    cakeGroup = null; mainCake = null; sliceGroup = null;
    photoMeshes = []; candleFlames = [];
    const old = document.getElementById('cake-canvas');
    if (old) old.remove();
  }

  function buildScene() {
    const W = wrap.clientWidth  || window.innerWidth;
    const H = wrap.clientHeight || 500;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.id = 'cake-canvas';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width   = '100%';
    renderer.domElement.style.height  = '100%';
    renderer.domElement.style.cursor  = 'none';
    wrap.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 100);
    camera.position.set(0, 3.8, 6.5);
    camera.lookAt(0, 0, 0);

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a060d);
    scene.fog = new THREE.FogExp2(0x180510, 0.055);

    ambientLight = new THREE.AmbientLight(0xffe0ee, 0.7);
    scene.add(ambientLight);

    pointLight = new THREE.PointLight(0xffaa66, 2.5, 12);
    pointLight.position.set(0, 4, 1);
    pointLight.castShadow = true;
    scene.add(pointLight);

    const fillLight = new THREE.PointLight(0xff6688, 1.2, 14);
    fillLight.position.set(2, 1, 5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x9930aa, 0.8, 10);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    buildTable();
    buildCake();
    buildPhotoCards();
  }

  function buildTable() {
    const geo = new THREE.PlaneGeometry(24, 18);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a0a12, roughness: 0.85, metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1.0;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  function buildCake() {
    cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    const R = 1.75, H = 1.1;

    // Plate
    const plateGeo = new THREE.CylinderGeometry(R + 0.28, R + 0.28, 0.08, 48);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf5ede0, roughness: 0.6 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = -H / 2 - 0.04;
    plate.castShadow = true;
    plate.receiveShadow = true;
    cakeGroup.add(plate);

    // Cake materials
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xe8637a, roughness: 0.7 });
    const topMat  = new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.5 });
    const fillMat = new THREE.MeshStandardMaterial({ color: 0xf4c47a, roughness: 0.9, side: THREE.DoubleSide });

    // The Slice is 1/8 of the cake (45 degrees), centered around +Z
    const sliceAngle = Math.PI / 4; 
    
    // MAIN CAKE (2PI - sliceAngle)
    mainCake = new THREE.Group();
    // Cylinder geometry automatically creates top and bottom caps if openEnded is false!
    const mainGeo = new THREE.CylinderGeometry(R, R, H, 40, 1, false, sliceAngle/2, Math.PI*2 - sliceAngle);
    const mainMesh = new THREE.Mesh(mainGeo, [sideMat, topMat, topMat]); 
    mainMesh.castShadow = true;
    mainCake.add(mainMesh);
    
    // Create a wall geometry and translate it so its origin is at the left edge
    const wallGeo = new THREE.PlaneGeometry(R, H);
    wallGeo.translate(R/2, 0, 0);

    // Main cake exposed walls
    const lw = new THREE.Mesh(wallGeo, fillMat);
    lw.rotation.y = sliceAngle/2;
    mainCake.add(lw);
    
    const rw = new THREE.Mesh(wallGeo, fillMat);
    rw.rotation.y = -sliceAngle/2;
    mainCake.add(rw);

    // SLICE GROUP
    sliceGroup = new THREE.Group();
    const sliceGeo = new THREE.CylinderGeometry(R, R, H, 10, 1, false, -sliceAngle/2, sliceAngle);
    const sliceMesh = new THREE.Mesh(sliceGeo, [sideMat, topMat, topMat]);
    sliceMesh.castShadow = true;
    sliceGroup.add(sliceMesh);

    // Slice inner walls
    const sw1 = new THREE.Mesh(wallGeo, fillMat);
    sw1.rotation.y = sliceAngle/2;
    sliceGroup.add(sw1);
    
    const sw2 = new THREE.Mesh(wallGeo, fillMat);
    sw2.rotation.y = -sliceAngle/2;
    sliceGroup.add(sw2);

    cakeGroup.add(mainCake);
    cakeGroup.add(sliceGroup);

    // Rotate cake so slice is facing camera-right
    cakeGroup.rotation.y = Math.PI / 6;

    buildCandles(R, H);
  }

  function buildCandles(R, H) {
    const positions = [
      { x: -0.4, z:  0.3 },
      { x:  0.4, z:  0.3 },
      { x:  0,   z: -0.4 },
    ];

    positions.forEach(pos => {
      const group = new THREE.Group();
      group.position.set(pos.x, H / 2, pos.z);

      const bodyGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 12);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffe4b5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.225;
      body.castShadow = true;
      group.add(body);

      const flameLight = new THREE.PointLight(0xffaa22, 0.8, 2.5);
      flameLight.position.y = 0.55;
      group.add(flameLight);
      
      const flameGeo = new THREE.SphereGeometry(0.07, 8, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.scale.set(1, 1.8, 1);
      flame.position.y = 0.55;
      group.add(flame);

      candleFlames.push({ light: flameLight, mesh: flame, baseInt: 0.8 });
      cakeGroup.add(group); // attach to main cake group
    });
  }

  function buildPhotoCards() {
    const positions = [
      { x: -4.5, y: 1.0,  z: -1.5, ry:  0.35, fo: 0.0 },
      { x: -4.2, y: -0.2, z:  1.0, ry:  0.28, fo: 1.5 },
      { x:  4.5, y: 1.0,  z: -1.5, ry: -0.35, fo: 0.8 },
      { x:  4.2, y: -0.2, z:  1.0, ry: -0.28, fo: 2.1 },
      { x: -1.5, y: 1.8,  z: -3.5, ry:  0.05, fo: 0.4 },
      { x:  1.5, y: 1.8,  z: -3.5, ry: -0.05, fo: 1.0 },
    ];

    const loader = new THREE.TextureLoader();
    const placeholderColor = new THREE.Color(0xe8637a);

    positions.forEach((pos, i) => {
      const group = new THREE.Group();
      group.position.set(pos.x, pos.y, pos.z);
      group.rotation.y = pos.ry;
      group.userData.fo = pos.fo;
      group.userData.baseY = pos.y;

      const frameGeo = new THREE.BoxGeometry(1.6, 2.0, 0.04);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.castShadow = true;
      group.add(frame);

      const photoGeo = new THREE.PlaneGeometry(1.35, 1.45);
      const src = srcs[i];

      const onLoad = (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        photoMesh.material.map = tex;
        photoMesh.material.color.set(0xffffff);
        photoMesh.material.needsUpdate = true;
      };

      const photoMat = new THREE.MeshStandardMaterial({ color: placeholderColor, roughness: 0.6 });
      loader.load(src, onLoad, undefined, () => {});

      const photoMesh = new THREE.Mesh(photoGeo, photoMat);
      photoMesh.position.set(0, 0.2, 0.025);
      group.add(photoMesh);

      const heartGeo = new THREE.PlaneGeometry(0.25, 0.25);
      const heartMat = new THREE.MeshBasicMaterial({ color: 0xe8637a, transparent: true, opacity: 0.9 });
      const heart = new THREE.Mesh(heartGeo, heartMat);
      heart.position.set(0, -0.75, 0.026);
      group.add(heart);

      photoMeshes.push(group);
      scene.add(group);
    });
  }

  // ============================================================
  //  EVENTS — drag to cut
  // ============================================================
  function getCanvasPos(e) {
    const el  = renderer.domElement;
    const r   = el.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  function toNDC(x, y) {
    const el = renderer.domElement;
    return new THREE.Vector2((x / el.clientWidth) * 2 - 1, -(y / el.clientHeight) * 2 + 1);
  }

  function onDown(e) {
    if (phase !== 1) return; // Only allow drag if in cutting phase
    e.preventDefault();
    isDragging = true;
    const p = getCanvasPos(e);
    knifeX = prevKX = p.x; 
    knifeY = prevKY = p.y;
    positionKnife(p.x, p.y, 0);
  }

  function onMove(e) {
    if (phase !== 1 && phase !== 2) return;
    e.preventDefault();
    const p = getCanvasPos(e);
    
    // Smooth angle for hands/knife based on movement
    const dx = p.x - prevKX;
    const dy = p.y - prevKY;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      prevKX = knifeX; prevKY = knifeY;
    }
    knifeX = p.x; knifeY = p.y;
    
    let angle = 0;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
       angle = Math.atan2(dy, dx) + Math.PI / 2; // hands point in direction of movement
    }
    
    positionKnife(p.x, p.y, angle);

    if (isDragging && phase === 1) {
      checkCutFromScreen(p.x, p.y, dx, dy);
    }
  }

  function onUp() { isDragging = false; }

  function positionKnife(x, y, angle) {
    if (!knifeEl) return;
    // Keep angle slightly constrained so it doesn't spin wildly
    const maxRot = 0.5;
    const clamp = Math.max(-maxRot, Math.min(maxRot, angle));
    knifeEl.style.left = (x - 125) + 'px'; // center the 250x250 div
    knifeEl.style.top  = (y - 125) + 'px';
    knifeEl.style.transform = `rotate(${clamp}rad)`;
  }

  const raycaster = new THREE.Raycaster();
  function checkCutFromScreen(sx, sy, dx, dy) {
    if (!renderer || !camera || !cakeGroup) return;

    // Fast movement constitutes a "cut" stroke
    const speed = Math.sqrt(dx*dx + dy*dy);
    if (speed < 5) return;

    const ndc = toNDC(sx, sy);
    raycaster.setFromCamera(ndc, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit   = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hit);

    if (hit) {
      const dist = Math.sqrt(hit.x * hit.x + hit.z * hit.z);
      if (dist < 1.9) {
        cutAccum += speed;
        // If they drag significantly through the cake, count it as a cut stroke
        if (cutAccum > 150) {
          cutCount++;
          cutAccum = 0; // reset for next stroke
          
          if (cutCount >= 2) {
            triggerCut();
          } else {
            // Give visual feedback for first cut (a slice mark or just flash text)
            if (instrEl) instrEl.innerHTML = "One more cut! 🔪";
          }
        }
      }
    }
  }

  function triggerCut() {
    if (phase === 2) return;
    phase = 2;
    isDragging = false;

    if (knifeEl) {
      knifeEl.style.transition = 'opacity 0.6s';
      knifeEl.style.opacity    = '0';
    }

    setTimeout(() => {
      if (msgEl)   { msgEl.classList.remove('hidden'); msgEl.classList.add('show'); }
      if (instrEl) instrEl.style.opacity = '0';
      if (typeof launchConfetti === 'function') launchConfetti();
    }, 1200);
  }

  function attachEvents() {
    const el = renderer ? renderer.domElement : document.getElementById('cake-canvas');
    if (!el) return;
    el.addEventListener('mousedown',  onDown, { passive: false });
    el.addEventListener('mousemove',  onMove, { passive: false });
    el.addEventListener('mouseup',    onUp,   { passive: false });
    el.addEventListener('mouseleave', onUp,   { passive: false });
    el.addEventListener('touchstart', onDown, { passive: false });
    el.addEventListener('touchmove',  onMove, { passive: false });
    el.addEventListener('touchend',   onUp,   { passive: false });
  }

  function detachEvents() {
    const el = renderer ? renderer.domElement : document.getElementById('cake-canvas');
    if (!el) return;
    el.removeEventListener('mousedown',  onDown);
    el.removeEventListener('mousemove',  onMove);
    el.removeEventListener('mouseup',    onUp);
    el.removeEventListener('mouseleave', onUp);
    el.removeEventListener('touchstart', onDown);
    el.removeEventListener('touchmove',  onMove);
    el.removeEventListener('touchend',   onUp);
  }

  window.addEventListener('resize', () => {
    if (!renderer || !camera || !wrap) return;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  function loop() {
    if (!active) return;
    animId = requestAnimationFrame(loop);

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    candleFlames.forEach((cf, i) => {
      if (cf.baseInt > 0) {
        cf.light.intensity = cf.baseInt + Math.sin(elapsed * 8 + i * 2) * 0.3;
      }
    });

    photoMeshes.forEach((group, i) => {
      group.position.y = group.userData.baseY + Math.sin(elapsed * 0.9 + group.userData.fo) * 0.18;
      group.rotation.y = group.rotation.y + Math.sin(elapsed * 0.4 + i) * 0.0008;
    });

    // Gentle cake rotation (stops on cut)
    if (phase < 2 && cakeGroup) {
      cakeGroup.rotation.y += delta * 0.18;
    }

    // Slice popping out animation
    if (phase === 2 && sliceAnim < 1) {
      sliceAnim = Math.min(1, sliceAnim + delta * 0.8);
      // Move slice outward along its center axis (Z-axis in its local space)
      if (sliceGroup) {
        const outDist = sliceAnim * 1.5;
        sliceGroup.position.z = outDist; 
        sliceGroup.position.y = sliceAnim * 0.2; // slight lift
      }
    }

    if (pointLight && phase < 2) {
      pointLight.intensity = 2.2 + Math.sin(elapsed * 1.5) * 0.3;
    } else if (pointLight) {
      pointLight.intensity = Math.max(0, pointLight.intensity - delta * 2); // dim out light when candles go out
    }

    renderer.render(scene, camera);
  }

})();
