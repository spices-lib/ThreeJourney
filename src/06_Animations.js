import * as THREE from 'three'
import gsap from 'gsap'

// Scene
const scene = new THREE.Scene()

// Red cube
const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshBasicMaterial({ color: 0xff0000})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// Sizes
const sizes = {
    width : 800,
    height : 600
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3;
scene.add(camera)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas : document.querySelector(".ThreeJourney")
})
renderer.setSize(sizes.width, sizes.height)

// Clock
//const clock = new THREE.Clock()

gsap.to(mesh.position, { duration: 1, delay: 1, x: 2 })

// Animation
const tick = () =>
{
    // Clock
   // const elapsedTime = clock.getElapsedTime()

    // Update objects
    //mesh.rotation.x = elapsedTime * Math.PI * 2

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()