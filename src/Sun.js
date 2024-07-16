import * as THREE from "three";
import { Vector3, Quaternion, Matrix4 } from "three";

import { Star } from "./CelestialBody.js";

class Sun extends Star {

    constructor(transforms, parameters, textures) {
        super("Sun", transforms, parameters, textures);
        
    }

    createCustomMaterial(shaderManager, vertShader, fragShader, uniforms) {
        this.uniforms = {
            u_textures: {
                // value: [],
            },
            ...uniforms,
        };

        this.mesh.material = new THREE.ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: shaderManager.get(vertShader),
            fragmentShader: shaderManager.get(fragShader),
        } );
        
        let aroundGeometry = new THREE.SphereGeometry( 1, 32, 16 );
        aroundGeometry.computeBoundingBox();

        this.meshAround = new THREE.Mesh(
            aroundGeometry,
            new THREE.ShaderMaterial( {
                uniforms: {
                    u_bboxMin: {
                        value: aroundGeometry.boundingBox.min,
                    },
                    u_bboxMax: {
                        value: aroundGeometry.boundingBox.max,
                    },
                    ...uniforms,
                },
                side: THREE.BackSide,
                vertexShader: shaderManager.get("sunAround.vs"),
                fragmentShader: shaderManager.get("sunAround.fs"),
            } )
        );

        let radiusAround = 200;
        this.meshAround.position.copy(this.position);
        this.meshAround.scale.copy(new THREE.Vector3(this.radius + radiusAround, this.radius + radiusAround, this.radius + radiusAround));
        this.meshAround.updateMatrix();
        this.meshAround.updateMatrixWorld();

        this.group = new THREE.Group();
        this.group.add(this.mesh);
        this.group.add(this.meshAround);
    }
}

export { Sun };