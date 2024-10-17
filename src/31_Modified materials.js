
import * as THREE from 'three'

let material = new THREE.MeshBasicMaterial()

material.onBeforeCompile = (shader) => {

    shader.vertexShader = shader.vertexShader.replace(
        `#include <common>`,
        `#include <common> 
        xxx
        `
    )
}