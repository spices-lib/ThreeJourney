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

// Particles
const createFirework = (count, position, size, radius, color)=> {
    const positionArray = new Float32Array(count * 3)
    const sizesArray = new Float32Array(count)
    const timeMultipliersArray = new Float32Array(count)

    for(let i = 0; i < count; i++)
    {
        const i3 = i *  3;

        const spherical = new THREE.Spherical(
            radius * (0.75 + Math.random() * 0.25),
            Math.random() * Math.PI,
            Math.random() * Math.PI * 2
        )
        const position = new THREE.Vector3()
        position.setFromSpherical(spherical)

        positionArray[i3    ] = position.x
        positionArray[i3 + 1] = position.y
        positionArray[i3 + 2] = position.z

        sizesArray[i] = Math.random()

        timeMultipliersArray[i] = 1 + Math.random()
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3))
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizesArray, 1))
    geometry.setAttribute('aTimeMultiplier', new THREE.Float32BufferAttribute(sizesArray, 1))

    const material = new THREE.ShaderMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        uniforms: {
            uSize: new THREE.Uniform(size),
            uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
            uColor: new THREE.Uniform(color),
            uProgress: new THREE.Uniform(0)
        },
        vertexShader: `
            attribute float aSize;
            attribute float aTimeMultiplier;
        
            uniform float uSize;
            uniform vec2 uResolution;
            uniform float uProgress;
            
            float remap(float value, float originMin, float originMax, float destinationMin, float destinationMax)
            {
                return destinationMin + (value - originMin) * (destinationMax - destinationMin) / (originMax - originMin);
            }
            
            void main()
            {
                float progress = uProgress * aTimeMultiplier;
                vec3 p = position;
                
                // Exploding
                float explodingProgress = remap(progress, 0.0, 0.1, 0.0, 1.0);
                explodingProgress = clamp(explodingProgress, 0.0, 1.0);
                explodingProgress = 1.0 - pow(1.0 - explodingProgress, 3.0);
                p *= explodingProgress;
                
                // Falling
                float fallingProgress = remap(progress, 0.1, 1.0, 0.0, 1.0);
                fallingProgress = clamp(fallingProgress, 0.0, 1.0);
                fallingProgress = 1.0 - pow(1.0 - fallingProgress, 3.0);
                p.y -= fallingProgress * 0.2;
                
                // Scale
                float sizeOpeningProgress = remap(progress, 0.0, 0.125, 0.0, 1.0);
                float sizeClosingProgress = remap(progress, 0.125, 1.0, 1.0, 0.0);
                float sizeProgress = min(sizeOpeningProgress, sizeClosingProgress);
                sizeProgress = clamp(sizeProgress, 0.0, 1.0);
                
                // Twinkling
                float twinklingProgress = remap(progress, 0.2, 0.8, 0.0, 1.0);
                twinklingProgress = clamp(twinklingProgress, 0.0, 1.0);
                float sizeTwinkling = sin(progress * 30.0) * 0.5 + 0.5;
                sizeTwinkling = 1.0 - sizeTwinkling * twinklingProgress;
                
                vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
                vec4 viewPosition = viewMatrix * modelPosition;
                gl_Position = projectionMatrix * viewPosition;
                
                gl_PointSize = uSize * uResolution.y * aSize * sizeProgress * sizeTwinkling;
                gl_PointSize *= 1.0 / -viewPosition.z;
                
                if(gl_PointSize < 1.0)
                {
                    gl_Position = vec4(9999.9);
                }
            }
        `,
        fragmentShader: `

            uniform vec3 uColor;

            void main()
            {
                gl_FragColor = vec4(uColor, 1.0);
                
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `
    })

    const firework = new THREE.Points(geometry, material)
    firework.position.copy(position)
    scene.add(firework)

    // Destroy
    const destroy = () => {
        scene.remove(firework)
        geometry.dispose()
        material.dispose()
    }

    // Animate
    gsap.to(
        material.uniforms.uProgress,
        {value: 1, duration: 3, ease: 'linear', onComplete: destroy}
    )
}

const createRandomFirework = ()=> {
    const count = Math.round(400 + Math.random() * 1000)
    const position = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random(),
        (Math.random() - 0.5) * 2,
    )
    const size = 0.02 + Math.random() * 0.04
    const radius = 0.5 + Math.random()
    const color = new THREE.Color()
    color.setHSL(Math.random(), 1, 0.7)

    createFirework(count, position, size, radius, color)
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

window.addEventListener('click', createRandomFirework)

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