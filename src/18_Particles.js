import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

// Debug
const gui = new dat.GUI()

// Scene
const scene = new THREE.Scene()

// Particles
const particlesGeometry = new THREE.BufferGeometry()
const count = 50000
const positions = new Float32Array(count * 3)
const colors = new Float32Array(count * 3)
for(let i = 0; i < count * 3; i++)
{
    positions[i] = (Math.random() - 0.5) * 10
    colors[i] = Math.random()
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.01,
    sizeAttenuation: true,
    //color: 'red',
    transparent: true,
    alphaTest: 0.001,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
})
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

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

    // Update Particles
    particles.rotation.y += 0.01

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()