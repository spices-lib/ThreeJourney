import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

// Debug
const gui = new dat.GUI()

// Scene
const scene = new THREE.Scene()

// Lights
const ambientLight = new THREE.AmbientLight(0xff0000, 0.5)
scene.add(ambientLight)
gui.addColor(ambientLight, 'color')

const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.5)
scene.add(directionalLight)

const pointLight = new THREE.PointLight()
scene.add(pointLight)

// Mesh
const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45)
const donutMaterial = new THREE.MeshPhongMaterial()

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

const geometry = new THREE.PlaneGeometry()
const material = new THREE.MeshStandardMaterial()
material.roughness = 0
const mesh = new THREE.Mesh(geometry, material)
mesh.position.z = -0.5
scene.add(mesh)

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