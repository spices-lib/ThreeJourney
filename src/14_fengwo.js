import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import * as dat from 'dat.gui'

import fengwovert from '/shaders/Shader.fengwo.BuiltIn.vert?url&raw'
import fengwofrag from '/shaders/Shader.fengwo.BuiltIn.frag?url&raw'

/**
 * @brief GUI
 * */
const gui = new dat.GUI()

/**
 * @brief Function Library
 * */

const functions = {
    durationTime : 2,
    animation: () => {
        gsap.to(material.uniforms.ringRadius, { duration: functions.durationTime, value: 2 })
        gsap.to(material.uniforms.ringRadius, { duration: 0, delay: functions.durationTime, value: 0 })
    }
}
gui.add(functions, 'animation')
gui.add(functions, 'durationTime').min(0).max(1).step(0.01).name('durationTime')

/**
 * @brief Texture
 * */
const loadingManager = new THREE.LoadingManager()
const textureLoader = new THREE.TextureLoader(loadingManager)
const texture = textureLoader.load('/textures/fengwotu.jpg')

/**
 * @brief Scene
 * */
const scene = new THREE.Scene()

/**
 * @brief Mesh
 * */
const material = new THREE.ShaderMaterial({
    uniforms: {
        intexture: { value: texture },
        ringCenter: { value: new THREE.Vector2(0, 0) },
        blurRadius: { value: 0.1 },
        ringRadius: { value: 0.2 },
        ringThickness: { value: 0.05 },
    },
    vertexShader: fengwovert,
    fragmentShader:fengwofrag,
    transparent: true,
})
gui.add(material.uniforms.ringCenter.value, 'x').min(-0.5).max(0.5).step(0.01).name('ringCenter_x')
gui.add(material.uniforms.ringCenter.value, 'y').min(-0.5).max(0.5).step(0.01).name('ringCenter_y')
gui.add(material.uniforms.blurRadius, 'value').min(0).max(0.5).step(0.01).name('blurRadius')
gui.add(material.uniforms.ringRadius, 'value').min(0).max(0.5).step(0.01).name('ringRadius')
gui.add(material.uniforms.ringThickness, 'value').min(0).max(0.5).step(0.01).name('ringThickness')

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    material
)
scene.add(plane)

/**
 * @brief Sizes
 * */
const sizes = {
    width : window.innerWidth,
    height : window.innerHeight
}

/**
 * @brief Camera
 * */
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.PerspectiveCamera(75, aspectRatio)
camera.position.z = 3
scene.add(camera)

/**
 * @breif Renderer
 * */
const canvas = document.querySelector(".ThreeJourney")
const renderer = new THREE.WebGLRenderer({
    canvas : canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * @brief Controls
 * */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * @brief Cursor
 * */
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

/**
 * @brief Animation
 * */
const tick = () => {

    // Update controls
    // When use damp, controls must update
    controls.update()

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()