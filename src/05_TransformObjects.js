import * as THREE from 'three'

// Scene
const scene = new THREE.Scene()

// Red cube
const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const mesh = new THREE.Mesh(geometry, material)
mesh.position.y = 1
mesh.scale.x = 0.5
mesh.rotation.reorder('YXZ')
mesh.rotation.y = 0.5 * Math.PI

// Objects
const group = new THREE.Group()

const cube1 = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
)
cube1.position.x = -2;
const cube2 = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
)
cube2.position.x = 0;
const cube3 = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
)
cube2.position.x = 2;
group.add(cube1, cube2, cube3)
group.rotation.y = 0.25 * Math.PI
scene.add(group)

// Axes helper
const axesHelper = new THREE.AxesHelper()
scene.add(axesHelper)

// Sizes
const sizes = {
    width : 800,
    height : 600
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3;
camera.lookAt(mesh.position)
scene.add(camera)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas : document.querySelector(".ThreeJourney")
})
renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)