import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Scene
const scene = new THREE.Scene()

// Red cube
const geometry = new THREE.SphereGeometry(1, 32, 32)

const material = new THREE.ShaderMaterial({
    uniforms: {
        uTime: new THREE.Uniform(0),
        uColor: new THREE.Uniform(new THREE.Color('red')),
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
    
        uniform float uTime;
    
        float random2D(vec2 value)
        {
            return fract(sin(dot(value.xy, vec2(12.985, 72.351))) * 850.273);
        }
    
        void main()
        {
            vec3 p = position;
            vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
            
            float glitchTime = uTime - modelPosition.y;
            float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.4) + sin(glitchTime * 8.3);
            glitchStrength /= 3.0;
            glitchStrength = smoothstep(0.3, 1.0, glitchStrength);
            glitchStrength *= 0.25;
            modelPosition.x += (random2D(modelPosition.xz + uTime) - 0.5) * glitchStrength;
            modelPosition.z += (random2D(modelPosition.zx + uTime) - 0.5) * glitchStrength;
            
            gl_Position = projectionMatrix * viewMatrix * modelPosition;
            
            vec4 modelNormal = modelMatrix * vec4(normal, 0.0f);
            
            vPosition = modelPosition.xyz;
            vNormal = modelNormal.xyz;
        }
    `,
    fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        uniform float uTime;
        uniform vec3 uColor;

        void main()
        {
            vec3 normal = normalize(vNormal);
            if(!gl_FrontFacing)
            {
                normal *= -1.0;
            }
            
            float stripes = mod((vPosition.y + uTime * 0.02) * 15.0, 1.0);
            stripes = pow(stripes, 3.0);
        
            vec3 viewDirection = normalize(vPosition - cameraPosition);
            float fresnel = dot(viewDirection, normal) + 1.0;
            fresnel = pow(fresnel, 5.0);
        
            float falloff = smoothstep(0.5, 0.0, fresnel);
        
            float holographic = stripes * fresnel;
            holographic += fresnel * 1.25;
            holographic *= falloff;
        
            
        
            gl_FragColor = vec4(uColor, holographic);
            
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `
})
const mesh = new THREE.Mesh(geometry, material)
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

window.addEventListener('dblclick', () => {

    // full screen / window switch
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
    if(!fullscreenElement)
    {
        if(canvas.requestFullscreen)
        {
            canvas.requestFullscreen()
        }
        else if(canvas.webkitRequestFullscreen)
        {
            canvas.webkitRequestFullscreen()
        }
    }
    else
    {
        if(document.exitFullscreen)
        {
            document.exitFullscreen()
        }
        else if(document.webkitExitFullscreen)
        {
            document.webkitExitFullscreen()
        }
    }
})

// Animation
const clock = new THREE.Clock()

// Animation
const tick = () => {

    material.uniforms.uTime.value = clock.getElapsedTime()

    // Update controls
    // When use damp, controls must update
    controls.update()

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()