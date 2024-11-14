import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {mergeVertices} from "three/addons/utils/BufferGeometryUtils.js";

// Scene
const scene = new THREE.Scene()

// Red cube
let geometry = new THREE.IcosahedronGeometry(2.5, 50)
geometry = mergeVertices(geometry)
geometry.computeTangents()

const material = new CustomShaderMaterial({

    // CSM
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader:  `
        varying vec2 vUv;
        void main()
        {
            //vec3 biTangent = cross(normal, tangent);
            
            csm_Position.y += sin(csm_Position.x * 3.0) * 0.5;
            
            // Neighbours positions
            //float shift = 0.01;
            //vec3 positionA = csm_Position + tangent.xyz * shift;
            //vec3 positionB = csm_Position + biTangent.xyz * shift;
            
            //vec3 toA = normalize(positionA - csm_Position);
            //vec3 toB = normalize(positionB - csm_Position);
            //csm_Normal = cross(toA, toB);
            
            vUv = uv;
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        void main()
        {
            csm_Metalness = step(0.0, sin(vUv.x * 100.0 + 0.5));
            csm_Roughness = 1.0 - csm_Metalness;
            csm_FragColor.rgb = vec3(vUv, 0.5);
        }
    `,
    silent: true,
    // MeshPhysicalMaterial
    metalness: 0,
    roughness: 0.5,
    color: '#ffffff',
    transmission: 0,
    ior: 1.5,
    thickness: 1.5,
    transparent: true,
    wireframe: false
})

const depthMaterial = new CustomShaderMaterial({

    // CSM
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader:  `
        varying vec2 vUv;
        void main()
        {
            //vec3 biTangent = cross(normal, tangent.xyz);
            
            csm_Position.y += sin(csm_Position.x * 3.0) * 0.5;
            
            // Neighbours positions
            float shift = 0.01;
            //vec3 positionA = csm_Position + tangent.xyz * shift;
            //vec3 positionB = csm_Position + biTangent.xyz * shift;
            
            //vec3 toA = normalize(positionA - csm_Position);
            //vec3 toB = normalize(positionB - csm_Position);
            //cmz_Normal = cross(toA, toB);
            
            vUv = uv;
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        void main()
        {
            csm_Metalness = step(0.0, sin(vUv.x * 100.0 + 0.5));
            csm_Roughness = 1.0 - csm_Metalness;
            csm_FragColor.rgb = vec3(vUv, 0.5);
        }
    `,
    silent: true,
    depthPacking: THREE.RGBADepthPacking
})

const mesh = new THREE.Mesh(geometry, material)
mesh.customDepthMaterial = depthMaterial
scene.add(mesh)

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

// Cursor
const cursor = {
    x: 0,
    y: 0
}

window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = 0.5 - event.clientY / sizes.height
})

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

    // Update controls
    // When use damp, controls must update
    controls.update()

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()