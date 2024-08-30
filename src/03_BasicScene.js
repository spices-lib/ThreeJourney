import * as THREE from 'three'

// Scene
const scene = new THREE.Scene()

// Red cube
const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
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
renderer.render(scene, camera)