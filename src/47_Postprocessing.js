import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as dat from 'dat.gui'
import {RenderPass, RGBELoader} from "three/addons";
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js'
import { EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {DotScreenPass} from "three/addons";
import {GlitchPass} from "three/addons";
import {RGBShiftShader} from "three/addons";
import {ShaderPass} from "three/addons";
import {WebGLRenderer} from "three";
import Stats from "three/addons/libs/stats.module.js";
import {gsap} from 'gsap'

// Stats
const stats = new Stats();
stats.showPanel( 0 );
document.body.appendChild( stats.dom );

// Debug
const gui = new dat.GUI()

// Scene
const scene = new THREE.Scene()

// Overlay
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
        uAlpha: {value: 1.0}
    },
    vertexShader: `
        void main()
        {
            vec3 p = position;
            vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
            gl_Position = modelPosition;
        }
    `,
    fragmentShader: `
        uniform float uAlpha;
    
        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
ambientLight.castShadow = true
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.5)
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 15
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = 0.05
scene.add(directionalLight)

/*************************************************************************************************/

const loadingBar = document.querySelector('.loading-bar')

const loadingManager = new THREE.LoadingManager(
    ()=>{

        // same to window timeout
        gsap.delayedCall(0.5, ()=>{

        })
        window.setTimeout(() => {
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0})
            loadingBar.classList.add('ended')
            loadingBar.style.transform = ''
        }, 500)
    },
    (itemUrl, itemsLoaded, itemsTotal) => {
        const progressRatio = itemsLoaded / itemsTotal
        loadingBar.style.transform = `scaleX(${progressRatio})`
    }
)

// textures0
const textureLoader = new THREE.CubeTextureLoader(loadingManager)
const texture = textureLoader.load([
    '/textures/Standard-Cube-Map/px.png',
    '/textures/Standard-Cube-Map/nx.png',
    '/textures/Standard-Cube-Map/py.png',
    '/textures/Standard-Cube-Map/ny.png',
    '/textures/Standard-Cube-Map/pz.png',
    '/textures/Standard-Cube-Map/nz.png',
])
scene.environment = texture
scene.background = texture
scene.backgroundBlurriness = 0.1
scene.backgroundIntensity = 5

/*************************************************************************************************/

/*************************************************************************************************/

// textures1
const rgbetextureLoader = new RGBELoader()
rgbetextureLoader.load('/textures/kloofendal_48d_partly_cloudy_puresky_4k.hdr', (map) => {
    map.mapping = THREE.EquirectangularReflectionMapping
    map.colorSpace = THREE.SRGBColorSpace

    scene.environment = map
    scene.background = map
    scene.backgroundIntensity = 2

    const skybox = new GroundedSkybox(map)
    skybox.scale.setScalar(50)
    scene.add(skybox)
})

/*************************************************************************************************/

/*************************************************************************************************/

// Cube render target
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    type: THREE.HalfFloatType
})
scene.environment = cubeRenderTarget.texture

// Cube camera
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget)
cubeCamera.layers.set(1)

/*************************************************************************************************/


const updateAllMaterial = () => {
    scene.traverse((child) => {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            child.material.envMapIntensity = global.envMapIntensity
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
            gui.add(child.material, 'envMapIntensity').min(0).max(10).step(0.01)
        }
    })
}

const global = {}
global.envMapIntensity = 1
gui.add(global, 'envMapIntensity').min(0).max(10).step(0.01).onChange(updateAllMaterial)

// Models
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
gltfLoader.load(
    '/models/rubbertoy.gltf',
    (gltf) => {

        mixer = new THREE.AnimationMixer(gltf.scene)
        const action = mixer.clipAction(gltf.animations[0])
        action.play()

        scene.add(gltf.scene)
        updateAllMaterial()
    })

// Sizes
const sizes = {
    width : window.innerWidth,
    height : window.innerHeight
}

// Camera
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.PerspectiveCamera(75, aspectRatio)
camera.position.z = 3
scene.add(camera)

// Renderer
const canvas = document.querySelector(".ThreeJourney")
const renderer = new THREE.WebGLRenderer({
    canvas : canvas,
    antialias: true    // 抗锯齿
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.physicallyCorrectLights = true             // Physical Light range
renderer.outputColorSpace = THREE.SRGBColorSpace    // Color Space
renderer.toneMapping = THREE.ACESFilmicToneMapping  // Explore
renderer.toneMappingExposure = 3
renderer.shadowMap.type = THREE.PCFSoftShadowMap    // soft shadow

// Render target
const renderTarget = new THREE.WebGLRenderTarget(
    800,
    600,
    {
        samples: renderer.getPixelRatio() === 1 ? 2 : 0
    }
)


// Post Processing
const effectComposer = new EffectComposer(renderer, renderTarget)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

const dotScreenPass = new DotScreenPass()
//effectComposer.addPass(dotScreenPass)

const rgbShiftPass = new ShaderPass(RGBShiftShader)
effectComposer.addPass(rgbShiftPass)

gui.add(renderer, 'toneMapping', {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping
})
gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.01)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Cursor
const cursor = {
    x: 0,
    y: 0
}

window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = 0.5 - event.clientY / sizes.height
})

window.addEventListener('resize', () => {

    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update effect composer
    effectComposer.setSize(sizes.width, sizes.height)
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const clock = new THREE.Clock()
let previousTime = 0

// Animation
const tick = () => {

    stats.begin();

    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update mix
    if(mixer !== null) {
        mixer.update(deltaTime)
    }

    // Update controls
    // When use damp, controls must update
    controls.update()

    cubeCamera.update(renderer, scene)

    // Render
    //renderer.render(scene, camera)
    effectComposer.render()

    stats.end();

    window.requestAnimationFrame(tick)
}

tick()