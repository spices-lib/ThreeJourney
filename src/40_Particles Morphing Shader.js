import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
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

// Models
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)
gltfLoader.load(
    '/models/rubbertoy.gltf',
    (gltf) => {

        let particles = {}

        // Positions
        const positions = gltf.scene.children.map(children => children.geometry.attributes.position)
        particles.maxCount = 0
        for(const position of positions)
        {
            if(position.count >  particles.maxCount)
                particles.maxCount = position.count
        }

        particles.positions = []
        for(const position of positions)
        {
            const originalArray = position.array;
            const newArray = new Float32Array(particles.maxCount * 3)

            for(let i = 0; i < particles.maxCount; i++)
            {
                const i3 = i * 3;

                if(i3 < originalArray.length)
                {
                    newArray[i3 + 0] = originalArray[i3 + 0];
                    newArray[i3 + 1] = originalArray[i3 + 1];
                    newArray[i3 + 2] = originalArray[i3 + 2];
                }
                else
                {
                    const randomIndex = Math.floor(position.count * Math.random()) * 3

                    newArray[i3 + 0] = originalArray[randomIndex + 0];
                    newArray[i3 + 1] = originalArray[randomIndex + 1];
                    newArray[i3 + 2] = originalArray[randomIndex + 2];
                }
            }

            particles.positions.push(new THREE.Float32BufferAttribute(newArray, 3))
        }

        particles.aTarget = particles.positions[0].array
        particles.aTarget = particles.aTarget.map(p => -2.0 * p);

        // Particles
        const particleGeometry = new THREE.BufferGeometry()
        particleGeometry.setAttribute('position', particles.positions[0])
        particleGeometry.setAttribute('aTarget', new THREE.BufferAttribute(particles.aTarget, 3))
        particleGeometry.setIndex(null)
        particleGeometry.deleteAttribute('normal')

        const material = new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: {
                uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
                uProgress: new THREE.Uniform(0.0)
            },
            vertexShader: `
            
            attribute vec3 aTarget;
            
            uniform vec2 uResolution;
            uniform float uProgress;

            void main()
            {
                // Mixed position
                vec3 mixedPosition = mix(position, aTarget, uProgress);
            
            
                vec3 p = mixedPosition;
                vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
                vec4 viewPosition = viewMatrix * modelPosition;
                gl_Position = projectionMatrix * viewPosition;
                
                gl_PointSize = 0.02 * uResolution.y ;
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

        const grid = new THREE.Points(particleGeometry, material)
        scene.add(grid)

        gui.add(material.uniforms.uProgress, 'value').min(0).max(1).step(0.01)
    })

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

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()