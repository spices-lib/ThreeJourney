import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Scene
const scene = new THREE.Scene()

// Smoke
const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64)
smokeGeometry.translate(0, 0.5, 0)
smokeGeometry.scale(1.5, 6, 1.5)

const textureLoader = new THREE.TextureLoader()
const perlinTexture = textureLoader.load('/textures/noise.png')
perlinTexture.wrapS = THREE.RepeatWrapping
perlinTexture.wrapT = THREE.RepeatWrapping

const smokeMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
    uniforms: {
        uTime: new THREE.Uniform(0),
        uPerlinTexture: new THREE.Uniform(perlinTexture)
    },
    vertexShader: `
        varying vec2 vUv;
    
        uniform sampler2D uPerlinTexture;
    
        vec2 rotate2D(vec2 value, float angle)
        {
            float s = sin(angle);
            float c = cos(angle);
            mat2 m = mat2(c, s, -s, c);
            return m * value;
        }
    
        void main()
        {
            vec3 p = position;
            
            vec2 smokeUv = uv;
            smokeUv.x *= 0.4;
            smokeUv.y *= 0.2;
            
            float smoke = texture(uPerlinTexture, smokeUv).x;
            float angle = position.y * smoke;
            p.xz = rotate2D(p.xz, angle);
            
            vec2 windOffset = vec2(0.0f, 0.0f);
            windOffset.y = position.y * smoke;
            p.xz += windOffset;
            
            vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
            gl_Position = projectionMatrix * viewMatrix * modelPosition;
            
            vUv = uv;
        }
    `,
    fragmentShader:`
        varying vec2 vUv;
        
        uniform sampler2D uPerlinTexture;
        uniform float uTime;

        void main()
        {
            vec2 smokeUv = vUv;
            smokeUv.x *= 0.4;
            smokeUv.y *= 0.2;
            smokeUv.y -= uTime * 0.03;
        
            float smoke = texture(uPerlinTexture, smokeUv).x;
            
            smoke  = smoothstep(0.4, 1.0, smoke);
            smoke *= smoothstep(0.0, 0.1, vUv.x);
            smoke *= smoothstep(1.0, 0.9, vUv.x);
            smoke *= smoothstep(0.0, 0.1, vUv.y);
            smoke *= smoothstep(1.0, 0.4, vUv.y);
            
            gl_FragColor = vec4(smoke, smoke, smoke, smoke);
            
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `
})

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial)
scene.add(smoke)

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
const clock = new THREE.Clock()

// Animation
const tick = () => {

    smokeMaterial.uniforms.uTime.value = clock.getElapsedTime()

    // Update controls
    // When use damp, controls must update
    controls.update()

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()