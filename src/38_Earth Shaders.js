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

const textureLoader = new THREE.TextureLoader()
const dayTexture = textureLoader.load('/textures/8k_earth_daymap.jpg')
dayTexture.colorSpace = THREE.SRGBColorSpace
dayTexture.anisotropy = 8

const nightTexture = textureLoader.load('/textures/8k_earth_nightmap.jpg')
nightTexture.colorSpace = THREE.SRGBColorSpace
nightTexture.anisotropy = 8

const cloudTexture = textureLoader.load('/textures/8k_earth_clouds.jpg')
cloudTexture.anisotropy = 8

const normalTexture = textureLoader.load('/textures/8k_earth_normal_map.png')
normalTexture.anisotropy = 8

const specularTexture = textureLoader.load('/textures/8k_earth_specular_map.png')
specularTexture.anisotropy = 8

const displacementTexture = textureLoader.load('/textures/8081_earthbump10k.jpg')
displacementTexture.anisotropy = 8

// Earth
const earthParameters = {}
earthParameters.atmosphereDayColor = '#00aaff'
earthParameters.atmosphereTwilightColor = '#ff6600'


// Sphere
const geometry = new THREE.SphereGeometry(1, 1280, 1280)
const material = new THREE.ShaderMaterial({
    wireframe: false,
    uniforms: {
        uDayTexture: new THREE.Uniform(dayTexture),
        uNightTexture: new THREE.Uniform(nightTexture),
        uCloudTexture: new THREE.Uniform(cloudTexture),
        uNormalTexture: new THREE.Uniform(normalTexture),
        uSpecularTexture: new THREE.Uniform(specularTexture),
        uDisplacementTexture: new THREE.Uniform(displacementTexture),
        uSunDirection: new THREE.Uniform(new THREE.Vector3()),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor)),
    },
    vertexShader: `
    
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
    
        uniform sampler2D uDisplacementTexture;
    
        void main()
        {
            float displacement = texture(uDisplacementTexture, uv).x;
            vec3 p = position + normalize(position) * displacement * 0.01;
            vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
            
            gl_Position = projectionMatrix * viewMatrix * modelPosition;
            
            vec4 modelNormal = modelMatrix * vec4(normal, 0.0f);
            
            vPosition = modelPosition.xyz;
            vNormal = modelNormal.xyz;
            vUv = uv;
        }
    `,
    fragmentShader: `
    
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
    
        uniform sampler2D uDayTexture;
        uniform sampler2D uNightTexture;
        uniform sampler2D uCloudTexture;
        uniform sampler2D uNormalTexture;
        uniform sampler2D uSpecularTexture;
        uniform vec3 uSunDirection;
        uniform vec3 uAtmosphereDayColor;
        uniform vec3 uAtmosphereTwilightColor;
    
        void main()
        {
            vec3 viewDirection = normalize(vPosition - cameraPosition);
            vec3 normal = normalize(vNormal);
            vec3 color = vec3(0.0);
            
            // Sun orientation
            float sunOrientation = dot(uSunDirection, normal);
            
            // Day / night color
            float dayMix = smoothstep(-0.25, 0.5, sunOrientation);
            vec3 dayColor = texture(uDayTexture, vUv).xyz;
            vec3 nightColor = texture(uNightTexture, vUv).xyz;
            color += mix(nightColor, dayColor, dayMix);
            
            // Clouds color
            float cloud = texture(uCloudTexture, vUv).x;
            float cloudsMix = smoothstep(0.3, 1.0, cloud) * dayMix;
            color = mix(color, vec3(1.0), cloudsMix);
            
            // Fresnel
            float fresnel = dot(viewDirection, normal) + 1.0;
            fresnel = pow(fresnel, 2.0);
            
            // Atmosphere
            float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
            vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
            color = mix(color, atmosphereColor, fresnel * atmosphereDayMix);
            
            // Specular
            vec3 reflection = reflect(-uSunDirection, normal);
            float specular = -dot(reflection, viewDirection);
            specular = max(specular, 0.0) * texture(uSpecularTexture, vUv).x;
            specular = pow(specular, 32.0);
            vec3 specularColor = mix(vec3(1.0), atmosphereColor, fresnel);
            color += specular * specularColor; 
            
            
            gl_FragColor = vec4(color, 1.0);
            
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `
})
const sphere = new THREE.Mesh(geometry, material)
scene.add(sphere)

// Atmosphere
const atmosphereMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    uniforms: {
        uSunDirection: new THREE.Uniform(new THREE.Vector3()),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor)),
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
    
        uniform vec3 uSunDirection;
        uniform vec3 uAtmosphereDayColor;
        uniform vec3 uAtmosphereTwilightColor;
    
        void main()
        {
            vec3 viewDirection = normalize(vPosition - cameraPosition);
            vec3 normal = normalize(vNormal);
            vec3 color = vec3(0.0);
            
            // Sun orientation
            float sunOrientation = dot(uSunDirection, normal);
            
            // Atmosphere
            float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
            vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
            color += atmosphereColor;
            
            // Alpha
            float edgeAlpha = dot(viewDirection, normal);
            edgeAlpha = smoothstep(0.0, 0.5, edgeAlpha);
            
            float dayAlpha = smoothstep(-0.5, 0.0, sunOrientation);
            float alpha = dayAlpha * edgeAlpha;

            gl_FragColor = vec4(color, alpha);
            
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `
})
const atmosphere = new THREE.Mesh(geometry, atmosphereMaterial)
atmosphere.scale.set(1.04, 1.04, 1.04)
scene.add(atmosphere)

// Sun
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5)
const sunDirection = new THREE.Vector3()

// Debug
const debugSun = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.1, 2),
    new THREE.MeshBasicMaterial()
)
scene.add(debugSun)

// Update
const updateSun = ()=> {
    // Sun direction
    sunDirection.setFromSpherical(sunSpherical)

    // Debug
    debugSun.position.copy(sunDirection).multiplyScalar(5)

    // Uniforms
    material.uniforms.uSunDirection.value.copy(sunDirection)
    atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection)
}
updateSun()

// Tweaks
gui.add(sunSpherical, 'phi').min(0).max(Math.PI).onChange(updateSun)
gui.add(sunSpherical, 'theta').min(-Math.PI).max(Math.PI).onChange(updateSun)
gui.addColor(earthParameters, 'atmosphereDayColor').onChange(()=>{
    material.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
    atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
})
gui.addColor(earthParameters, 'atmosphereTwilightColor').onChange(()=>{
    material.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
    atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
})

// Camera
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.PerspectiveCamera(45, aspectRatio)
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