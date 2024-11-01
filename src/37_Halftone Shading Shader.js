import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import gsap from 'gsap'

// Debug
const gui = new dat.GUI()

// Scene
const scene = new THREE.Scene()

// Sizes
const sizes = {
    width : window.innerWidth,
    height : window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
}

// Sphere
const geometry = new THREE.SphereGeometry(1, 32, 32)
const material = new THREE.ShaderMaterial({
    uniforms: {
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
    },
    vertexShader: `
    
        varying vec3 vPosition;
        varying vec3 vNormal;
    
        void main()
        {
            vec3 p = position;
            vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
            
            gl_Position = projectionMatrix * viewMatrix * modelPosition;
            
            vec4 modelNormal = modelMatrix * vec4(normal, 0.0f);
            
            vPosition = modelPosition.xyz;
            vNormal = modelNormal.xyz;
        }
    `,
    fragmentShader: `
    
        varying vec3 vPosition;
        varying vec3 vNormal;
    
        uniform vec2 uResolution;
    
        void main()
        {
            vec3 viewDirection = normalize(vPosition - cameraPosition);
            vec3 normal = normalize(vNormal);
            vec3 color = vec3(0.4, 0.2, 0.6);
            
            // Lights
            vec3 light = vec3(0.0);
            color += light;
            
            // Halftone
            float repetitions = 50.0;
            vec3 direction = vec3(0.0, -1.0, 0.0);
            float low = -0.8;
            float high = 1.5;
            
            
            float intensity = dot(vNormal, direction);
            intensity = smoothstep(low, high, intensity);
            
            vec2 uv = gl_FragCoord.xy / uResolution.y;
            uv *= repetitions;
            uv = mod(uv, 1.0);
            
            float point = distance(uv, vec2(0.5));
            point = 1.0 - step(0.5 * intensity, point);
            
            gl_FragColor = vec4(point, point, point, 1.0);
            
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `
})
const sphere = new THREE.Mesh(geometry, material)
scene.add(sphere)

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
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    material.uniforms.uResolution.value = new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

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