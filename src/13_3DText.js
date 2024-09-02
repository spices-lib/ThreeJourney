import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader} from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import typefaceFont from 'three/examples/fonts/helvetiker_regular.typeface.json?url'

// Scene
const scene = new THREE.Scene()

// Font
const loadingManager = new THREE.LoadingManager()
const textureLoader = new THREE.TextureLoader(loadingManager)
const fontLoader = new FontLoader(loadingManager)
fontLoader.load(typefaceFont, (font) => {
    const textGeometry = new TextGeometry('Hello Spices', {
        font: font,
        size: 0.5,
        depth: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    })
    textGeometry.computeBoundingBox()
    textGeometry.translate(
        -textGeometry.boundingBox.max.x * 0.5,
        -textGeometry.boundingBox.max.y * 0.5,
        -textGeometry.boundingBox.max.z * 0.5,
    )
    const textMaterial = new THREE.MeshMatcapMaterial()
    const text = new THREE.Mesh(textGeometry, textMaterial)
    scene.add(text)

    const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45)
    const donutMaterial = new THREE.MeshMatcapMaterial()

    for(let i = 0; i < 100; i++)
    {
        const donut = new THREE.Mesh(donutGeometry, donutMaterial)

        donut.position.x = Math.random() * 10 - 5
        donut.position.y = Math.random() * 10 - 5
        donut.position.z = Math.random() * 10 - 5

        donut.rotation.x = Math.random() * Math.PI
        donut.rotation.y = Math.random() * Math.PI
        donut.rotation.z = Math.random() * Math.PI

        const scale = Math.random()
        donut.scale.set(scale, scale, scale)

        scene.add(donut)
    }
})

// Axes helper
const axesHelper = new THREE.AxesHelper()
scene.add(axesHelper)

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
    canvas : canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Cursor
const cursor = {
    x: 0,
    y: 0
}

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
})

// Animation
const tick = () => {

    // Update controls
    // When use damp, controls must update
    controls.update()

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()