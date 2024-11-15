import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// Scene
const scene = new THREE.Scene()

// Red cube
let geometry = new THREE.IcosahedronGeometry(2.5, 50)
geometry = mergeVertices(geometry)
geometry.computeTangents()

const material = new THREE.MeshStandardMaterial({
    metalness: 0.5,
    roughness: 0.25,
    color: '#858080'
})

const patchMap = {
    csm_Slice: {
        '#include <colorspace_fragment>':
        `
            #include <colorspace_fragment>
            
            if(!gl_FrontFacing)
            {
                gl_FragColor = vec4(0.75, 0.15, 0.3, 1.0);
            }
        `
    }
}

const slicedMaterial = new CustomShaderMaterial({

    baseMaterial: THREE.MeshStandardMaterial,
    silent: true,
    vertexShader:`
        varying vec3 vPosition;
        void main()
        {
            vPosition = position;
        }
    `,
    fragmentShader:`
        varying vec3 vPosition;
        void main()
        {
            float uSliceStart = 1.0;
            float uSliceArc = 1.5;
            
            float angle = atan(vPosition.y, vPosition.x);
        
            if(angle > uSliceStart && angle < uSliceStart + uSliceArc)
            {
                discard;
            }
        
            csm_FragColor = vec4(1.0);
            
            float csm_Slice;
        
            
        }
    `,
    metalness: 0.5,
    roughness: 0.25,
    color: '#858080',
    patchMap: patchMap.csm_Slice
})

const mesh = new THREE.Mesh(geometry, slicedMaterial)
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