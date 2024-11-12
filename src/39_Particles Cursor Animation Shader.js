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

// Displacement
const displacement = {}
displacement.canvas = document.createElement('canvas')
displacement.canvas.width = 128
displacement.canvas.height = 128
displacement.canvas.style.position = 'fixed'
displacement.canvas.style.width = '256px'
displacement.canvas.style.height = '256px'
displacement.canvas.style.top = 0
displacement.canvas.style.left = 0
displacement.canvas.style.zIndex = 10
document.body.append(displacement.canvas)

// Context
displacement.context = displacement.canvas.getContext('2d')
//displacement.context.fillStyle = 'red'
displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)

// Glow image
displacement.glowImage = new Image()
displacement.glowImage.src = './textures/face_woman_hat_skin.jpg'
window.setTimeout(()=>{
    displacement.context.drawImage(displacement.glowImage, 20, 20, 32, 32)
}, 1000)

// Interactive plane
displacement.interactivePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({color: 'red', side: THREE.DoubleSide })
)
displacement.interactivePlane.visible = false
scene.add(displacement.interactivePlane)

// Raycaster
displacement.raycaster = new THREE.Raycaster()

// Coordinates
displacement.screenCursor = new THREE.Vector2(9999, 9999)
displacement.canvasCursor = new THREE.Vector2(9999, 9999)
displacement.canvasCursorPrevious = new THREE.Vector2(9999, 9999)

// Texture
displacement.texture = new THREE.CanvasTexture(displacement.canvas)


const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('./textures/face_woman_hat_skin.jpg')

// Particles
const particleGeometry = new THREE.PlaneGeometry(10, 10, 128, 128)
particleGeometry.setIndex(null)
particleGeometry.deleteAttribute('normal')
const intensitiesArray = new Float32Array(particleGeometry.attributes.position.count)
const anglesArray = new Float32Array(particleGeometry.attributes.position.count)

for(let i = 0; i < particleGeometry.attributes.position.count; i++)
{
    intensitiesArray[i] = Math.random()
    anglesArray[i] = Math.random() * Math.PI * 2
}
particleGeometry.setAttribute('aIntensity', new THREE.BufferAttribute(intensitiesArray, 1))
particleGeometry.setAttribute('aAngle', new THREE.BufferAttribute(anglesArray, 1))

const material = new THREE.ShaderMaterial({
    uniforms: {
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
        uPictureTexture: new THREE.Uniform(texture),
        uDisplacementTexture: new THREE.Uniform(displacement.texture),
    },
    vertexShader: `
            
            attribute float aIntensity;
            attribute float aAngle;
            
            uniform vec2 uResolution;
            uniform sampler2D uPictureTexture;
            uniform sampler2D uDisplacementTexture;
            
            varying vec3 vColor;

            void main()
            {
                vec3 p = position;
                float displacementIntensity = texture(uDisplacementTexture, uv).r;
                displacementIntensity = smoothstep(0.1, 1.0, displacementIntensity);
                
                vec3 displacement = vec3(cos(aAngle), sin(aAngle), 1.0);
                displacement = normalize(displacement);
                displacement *= displacementIntensity;
                p += displacement * 2.0 * aIntensity;
                
                vec4 modelPosition = modelMatrix * vec4(p, 1.0f);
                vec4 viewPosition = viewMatrix * modelPosition;
                gl_Position = projectionMatrix * viewPosition;
                
                float pictureIntensity = texture(uPictureTexture, uv).r;
                
                gl_PointSize = 0.05 * uResolution.y * pictureIntensity;
                gl_PointSize *= 1.0 / -viewPosition.z;
                
                vColor = vec3(pow(pictureIntensity, 2.0));
            }
        `,
    fragmentShader: `

            varying vec3 vColor;

            void main()
            {
                vec2 uv = gl_PointCoord;
                float distanceToCenter = distance(uv, vec2(0.5));
                
                if(distanceToCenter > 0.5)
                {
                    discard;
                }

                gl_FragColor = vec4(1.0);
                
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `
})

const grid = new THREE.Points(particleGeometry, material)
scene.add(grid)

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

window.addEventListener('pointermove', (event) => {
    displacement.screenCursor.x = (event.clientX / sizes.width) * 2 - 1
    displacement.screenCursor.y = -(event.clientY / sizes.height) * 2 + 1

})

// Animation
const tick = () => {

    // Update controls
    // When use damp, controls must update
    controls.update()

    // Raycaster
    displacement.raycaster.setFromCamera(displacement.screenCursor, camera)
    const intersections = displacement.raycaster.intersectObject(displacement.interactivePlane)

    if(intersections.length)
    {
        const uv = intersections[0].uv
        displacement.canvasCursor.x = uv.x * displacement.canvas.width
        displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height
    }

    // Displacement
    displacement.context.globalCompositeOperation = 'source-over'
    displacement.context.globalAlpha = 0.02
    displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)

    // Speed alpha
    const cursorDistance = displacement.canvasCursorPrevious.distanceTo(displacement.canvasCursor)
    displacement.canvasCursorPrevious.copy(displacement.canvasCursor)
    const alpha = Math.min(cursorDistance * 0.1, 1)


    if(intersections.length)
    {
        const glowSize = displacement.canvas.width * 0.25
        displacement.context.globalCompositeOperation = 'lighten'
        displacement.context.globalAlpha = alpha
        displacement.context.drawImage(
            displacement.glowImage,
            displacement.canvasCursor.x - glowSize * 0.5,
            displacement.canvasCursor.y - glowSize * 0.5,
            glowSize,
            glowSize
        )
    }
    displacement.texture.needsUpdate = true

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()