import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import CANNON from 'cannon'

// Debug
const gui = new dat.GUI()

// Physical
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)

const sphereShape = new CANNON.Sphere(0.5)
const sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape: sphereShape
})
world.addBody(sphereBody)

// Scene
const scene = new THREE.Scene()

// Lights
const ambientLight = new THREE.AmbientLight()
ambientLight.intensity = 0.2
scene.add(ambientLight)
gui.addColor(ambientLight, 'color')

const directionalLight = new THREE.DirectionalLight()
directionalLight.position.set(1, 1, 1)
directionalLight.lookAt(0, 0, 0)
directionalLight.intensity = 2
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
scene.add(directionalLight)

const pointLight = new THREE.PointLight()
pointLight.position.set(-2, 0, 0)
pointLight.color.set(1, 0, 0)
pointLight.intensity = 10
pointLight.castShadow = true
scene.add(pointLight)

// Mesh
const material = new THREE.MeshStandardMaterial()
material.roughness = 0.5
const plane = new THREE.Mesh( new THREE.PlaneGeometry(), material)
plane.rotation.x = -Math.PI * 0.5
plane.scale.set(6, 6, 6)
plane.position.y = -0.5
plane.castShadow = true
plane.receiveShadow = true
scene.add(plane)

const sphere = new THREE.Mesh(new THREE.SphereGeometry(), material)
sphere.castShadow = true
sphere.receiveShadow = true
scene.add(sphere)

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
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

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