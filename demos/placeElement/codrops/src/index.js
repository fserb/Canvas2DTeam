const canvasSketch = require("canvas-sketch");

// Import ThreeJS and assign it to global scope
// This way examples/ folder can use it too
const THREE = require("three");
global.THREE = THREE;

// Import extra THREE plugins
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/geometries/RoundedBoxGeometry.js");
require("three/examples/js/loaders/GLTFLoader.js");
require("three/examples/js/loaders/RGBELoader.js");
require("three/examples/js/postprocessing/EffectComposer.js");
require("three/examples/js/postprocessing/RenderPass.js");
require("three/examples/js/postprocessing/ShaderPass.js");
require("three/examples/js/postprocessing/UnrealBloomPass.js");
require("three/examples/js/shaders/LuminosityHighPassShader.js");
require("three/examples/js/shaders/CopyShader.js");

const settings = {
  animate: true,
  context: "webgl",
  resizeCanvas: false,
};

const sketch = ({ context, canvas, width, height }) => {

  const options = {
    enableSwoopingCamera: false,
    enableRotation: true,
    color: 0xffffff,
    metalness: 0,
    roughness: 0.2,
    transmission: 1,
    ior: 1.0,
    reflectivity: 0.5,
    thickness: 2.5,
    envMapIntensity: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    normalScale: 0.3,
    clearcoatNormalScale: 0.2,
    normalRepeat: 3,
    bloomThreshold: 0.85,
    bloomStrength: 0.0,
    bloomRadius: 0.33,
  };

  // Setup
  // -----

  const renderer = new THREE.WebGLRenderer({
    context,
    antialias: false,
  });
  renderer.setClearColor(0x1f1e1c, 1);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, 5);

  // const controls = new THREE.OrbitControls(camera, canvas);
  // controls.enabled = !options.enableSwoopingCamera;

  const scene = new THREE.Scene();

  const renderPass = new THREE.RenderPass(scene, camera);
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(width, height),
    options.bloomStrength,
    options.bloomRadius,
    options.bloomThreshold
  );

  const composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  // Content
  // -------

  const f = document.getElementById("f");

  canvas.addEventListener("wheel", ev => ev.preventDefault(), { passive:false });
  f.addEventListener("wheel", ev =>  ev.currentTarget.scrollBy(ev.deltaX, ev.deltaY));
document.getElementById("button").addEventListener("click", ev => ev.currentTarget.innerText = "clicked");


  const S = 2;
  const other = document.getElementById("other");
  console.log(other);
  other.width *= S;
  other.height *= S;
  const ctx = other.getContext("2d");

// document.getElementById("button").addEventListener("click", ev => ev.currentTarget.innerText = "clicked");
// canvas.addEventListener("wheel", ev => ev.preventDefault(), { passive:false });
// f.addEventListener("wheel", ev =>  ev.currentTarget.scrollBy(ev.deltaX ?? 0, ev.deltaY ?? 0));

  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, other.width, other.height);
  ctx.scale(S, S);
  // ctx.fillStyle = "#400";
  // ctx.fillRect(100, 100, 600, 400);
  ctx.placeElement(f, 50, 50);



  const textureLoader = new THREE.TextureLoader();

  // const bgTexture = textureLoader.load("src/texture.jpg");
  const bgTexture = new THREE.CanvasTexture(other);
  const bgGeometry = new THREE.PlaneGeometry(5, 5);
  const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  bgMesh.position.set(0, 0, -1);
  scene.add(bgMesh);

  const hdrEquirect = new THREE.RGBELoader().load(
    "src/empty_warehouse_01_2k.hdr",
    () => {
      hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    }
  );

  const normalMapTexture = textureLoader.load("src/normal.jpg");
  normalMapTexture.wrapS = THREE.RepeatWrapping;
  normalMapTexture.wrapT = THREE.RepeatWrapping;
  normalMapTexture.repeat.set(options.normalRepeat, options.normalRepeat);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: options.metalness,
    roughness: options.roughness,
    transmission: options.transmission,
    ior: options.ior,
    reflectivity: options.reflectivity,
    thickness: options.thickness,
    envMap: hdrEquirect,
    envMapIntensity: options.envMapIntensity,
    clearcoat: options.clearcoat,
    clearcoatRoughness: options.clearcoatRoughness,
    normalScale: new THREE.Vector2(options.normalScale),
    normalMap: normalMapTexture,
    clearcoatNormalMap: normalMapTexture,
    clearcoatNormalScale: new THREE.Vector2(options.clearcoatNormalScale),
    // attenuationTint: options.attenuationTint,
    // attenuationDistance: options.attenuationDistance,
  });

  let mesh = null;

  // Load dragon GLTF model
  new THREE.GLTFLoader().load("src/dragon.glb", (gltf) => {
    const dragon = gltf.scene.children.find((mesh) => mesh.name === "Dragon");

    // Just copy the geometry from the loaded model
    const geometry = dragon.geometry.clone();

    // Adjust geometry to suit our scene
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, -4, 0);

    // Create a new mesh and place it in the scene
    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(0.25, 0.25, 0.25);
    scene.add(mesh);

    // Discard the loaded model
    gltf.scene.children.forEach((child) => {
      child.geometry.dispose();
      child.material.dispose();
    });
  });

  // Update
  // ------

  const update = (time, deltaTime) => {
    const ROTATE_TIME = 10; // Time in seconds for a full rotation
    const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const rotateX = (deltaTime / ROTATE_TIME) * Math.PI * 2;
    const rotateY = (deltaTime / ROTATE_TIME) * Math.PI * 2;

    if (options.enableRotation && mesh) {
      mesh.rotateOnWorldAxis(xAxis, rotateX);
      mesh.rotateOnWorldAxis(yAxis, rotateY);
    }

    if (options.enableSwoopingCamera) {
      camera.position.x = Math.sin((time / 10) * Math.PI * 2) * 2;
      camera.position.y = Math.cos((time / 10) * Math.PI * 2) * 2;
      camera.position.z = 4;
      camera.lookAt(scene.position);
    }
  };

  // Lifecycle
  // ---------

  return {
    resize({ canvas, pixelRatio, viewportWidth, viewportHeight }) {
      const dpr = Math.min(pixelRatio, 2); // Cap DPR scaling to 2x

      viewportWidth = viewportHeight = 600;

      canvas.width = viewportWidth * dpr;
      canvas.height = viewportHeight * dpr;
      // canvas.style.width = viewportWidth + "px";
      // canvas.style.height = viewportHeight + "px";

      bloomPass.resolution.set(viewportWidth, viewportHeight);

      renderer.setPixelRatio(dpr);
      renderer.setSize(viewportWidth, viewportHeight);

      composer.setPixelRatio(dpr);
      composer.setSize(viewportWidth, viewportHeight);

      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render({ time, deltaTime }) {
      // controls.update();
      update(time, deltaTime);
      bgTexture.needsUpdate = true;
      // renderer.render(scene, camera);
      composer.render();
    },
    load() {
      console.log("load");
    },
    unload() {
      mesh.geometry.dispose();
      material.dispose();
      hdrEquirect.dispose();
      // controls.dispose();
      renderer.dispose();
      bloomPass.dispose();
      document.body.removeChild(stats.dom);
    },
  };
};

canvasSketch(sketch, settings);
