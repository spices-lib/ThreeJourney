import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

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

// Particles
const createFirework = (count, position, size, radius)=> {
    const positionArray = new Float32Array(count * 3)
    const sizesArray = new Float32Array(count)

    for(let i = 0; i < count; i++)
    {
        const i3 = i *  3;

        positionArray[i3    ] = Math.random() - 0.5
        positionArray[i3 + 1] = Math.random() - 0.5
        positionArray[i3 + 2] = Math.random() - 0.5

        sizesArray[i] = Math.random()
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3))
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizesArray, 1))

    const material = new THREE.ShaderMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        uniforms: {
            uSize: new THREE.Uniform(size),
            uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio))
        },
        vertexShader: `
            attribute float aSize;
        
            uniform float uSize;
            uniform vec2 uResolution;
            
            void main()
            {
                vec3 p = position;
                vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
                vec4 viewPosition = viewMatrix * modelPosition;
                gl_Position = projectionMatrix * viewPosition;
                
                gl_PointSize = uSize * uResolution.y * aSize;
                gl_PointSize *= 1.0 / -viewPosition.z;
            }
        `,
        fragmentShader: `

            void main()
            {
                gl_FragColor = vec4(gl_PointCoord, 1.0, 1.0);
                
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `
    })

    const firework = new THREE.Points(geometry, material)
    firework.position.copy(position)
    scene.add(firework)
}

createFirework(100, new THREE.Vector3(), 0.1, 1)

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