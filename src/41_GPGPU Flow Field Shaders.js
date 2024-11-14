import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import {GPUComputationRenderer} from "three/addons/misc/GPUComputationRenderer.js";
import gsap from 'gsap'
import particleShader from '/shaders/Shader.particles.glsl?url&raw'

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

// Base geometry
const baseGeometry = {}
baseGeometry.instance = new THREE.SphereGeometry(3)
baseGeometry.instance.setIndex(null)
baseGeometry.instance.deleteAttribute('normal')
baseGeometry.count = baseGeometry.instance.attributes.position.count

// GPU Compute
const gpgpu = {}
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count))
gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

// Base particles
const baseParticlesTexture = gpgpu.computation.createTexture()

for(let i = 0; i < baseGeometry.count; i++)
{
    const i3 = i * 3
    const i4 = i * 4

    baseParticlesTexture.image.data[i4 + 0] = baseGeometry.instance.attributes.position.array[i3 + 0]
    baseParticlesTexture.image.data[i4 + 1] = baseGeometry.instance.attributes.position.array[i3 + 1]
    baseParticlesTexture.image.data[i4 + 2] = baseGeometry.instance.attributes.position.array[i3 + 2]
    baseParticlesTexture.image.data[i4 + 3] = 0
}

// Particles variable
gpgpu.particlesVariable = gpgpu.computation.addVariable('uParticles', particleShader, baseParticlesTexture)
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [gpgpu.particlesVariable])

// Init
gpgpu.computation.init()

// Debug
gpgpu.debug = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({
        map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture
    })
)
scene.add(gpgpu.debug)

// Geometry
const particlesUvArray = new Float32Array(baseGeometry.count * 2)
for(let y = 0; y < gpgpu.size; y++)
{
    for(let x = 0; x < gpgpu.size; x++)
    {
        const i = (y * gpgpu.size) + x
        const i2 = i * 2

        const uvX = (x + 0.5) / gpgpu.size
        const uvY = (y + 0.5) / gpgpu.size

        particlesUvArray[i2 + 0] = uvX
        particlesUvArray[i2 + 1] = uvY
    }
}

const geometry = new THREE.BufferGeometry()
geometry.setDrawRange(0, baseGeometry.count)
geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesUvArray, 2))
const material = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
        uParticles: new THREE.Uniform(gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture)
    },
    vertexShader: `
    
    attribute vec3 aTarget;
    attribute vec2 aParticlesUv;
    
    uniform vec2 uResolution;
    uniform sampler2D uParticles;

    void main()
    {
        vec4 particle = texture(uParticles, aParticlesUv);
    
    
        vec3 p = particle.xyz;
        vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
        vec4 viewPosition = viewMatrix * modelPosition;
        gl_Position = projectionMatrix * viewPosition;
        
        gl_PointSize = 0.2 * uResolution.y ;
        gl_PointSize *= 1.0 / -viewPosition.z;
    }
    `,
    fragmentShader: `
    varying vec3 vColor;

    void main()
    {
        vec2 uv = gl_PointCoord;
        float distanceToCenter = length(uv - 0.5);
        float alpha = 0.05 / distanceToCenter - 0.1;

        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
    `
})

const grid = new THREE.Points(geometry, material)
scene.add(grid)

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

    // update material
    material.uniforms.uResolution.value = new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio);

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

    // GPGPU Update
    gpgpu.computation.compute()
    material.uniforms.uParticles.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture


    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()