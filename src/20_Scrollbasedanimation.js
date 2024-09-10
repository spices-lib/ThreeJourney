import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

// Debug
const gui = new dat.GUI()

const parameters = {
    materialColor: '#ffeded'
}
gui.addColor(parameters, 'materialColor').onChange(() => {
    material.color.set(parameters.materialColor)
    pariclesMaterial.color.set(parameters.materialColor)
})

// Scene
const scene = new THREE.Scene()

// objects
const objectsDistance = 4
const material = new THREE.MeshToonMaterial({color: parameters.materialColor})

const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 60),
    material
)
//mesh1.position.x = 2
mesh1.position.y = - objectsDistance * 0
mesh1.scale.set(0.5, 0.5, 0.5
)
const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    material
)
//mesh2.position.x = 2
mesh2.position.y = - objectsDistance * 1

const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
    material
)
//mesh3.position.x = 2
mesh3.position.y = - objectsDistance * 2
mesh3.scale.set(0.5, 0.5, 0.5)

scene.add(mesh1, mesh2, mesh3)

const sectionMeshes = [ mesh1, mesh2, mesh3 ]

// Particles
const pariclesCount = 200
const positions = new Float32Array(pariclesCount * 3)
for(let i = 0; i < pariclesCount; i++)
{
    positions[3 * i    ] = (Math.random() - 0.5) * 10
    positions[3 * i + 1] = objectsDistance * 0.4 - Math.random() * objectsDistance * sectionMeshes.length
    positions[3 * i + 2] = (Math.random() - 0.5) * 10
}
const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const pariclesMaterial = new THREE.PointsMaterial({
    color: parameters.materialColor,
    size: 0.03,
    sizeAttenuation: true
})

const particles = new THREE.Points(particlesGeometry, pariclesMaterial)
scene.add(particles)

// lights
const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)

// Sizes
const sizes = {
    width : window.innerWidth,
    height : window.innerHeight
}

// Group
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Camera
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.PerspectiveCamera(75, aspectRatio)
camera.position.z = 3
cameraGroup.add(camera)

// Renderer
const canvas = document.querySelector(".ThreeJourney")
const renderer = new THREE.WebGLRenderer({
    canvas : canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enabled = false

// Cursor
const cursor = {
    x: 0,
    y: 0
}

window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = event.clientY / sizes.height - 0.5

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
})

// Scroll
let scrollY = window.scrollY
window.addEventListener('scroll', () => {
    scrollY = window.scrollY
})

const clock = new THREE.Clock()
let previousTime = 0

// Animation
const tick = () => {

    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Animate camera
    camera.position.y = - scrollY / sizes.height * objectsDistance

    const parallaxX =   cursor.x * 0.5
    const parallaxY = - cursor.y * 0.5
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime

    // Update controls
    // When use damp, controls must update
    controls.update()

    // Animate meshes
    for(const mesh of sectionMeshes)
    {
        mesh.rotation.x = elapsedTime * 0.1
        mesh.rotation.y = elapsedTime * 0.12
    }

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()