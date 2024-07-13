import * as THREE from "three";
import { Vector3, Quaternion, Matrix4 } from "three";

// &nbsp; (Regular space) &ensp; (Two spaces gap) &emsp; (Four spaces gap)
const tab26 = "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;";
const tab15 = "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;";
const tab19 = "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;";
const tab9 = "&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;";
const tab2 = "&ensp;&ensp;";
const tab14 = "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;";

class Planet {

    constructor(name, transforms, options, textures, shaders) {
        
        this.name = name || "Unnamed";
        
        if (transforms) {
            this.model = new Matrix4();                                             //
            this.position = transforms.position || new Vector3(0.0);                // on average, km away from Earth
            this.orientation = transforms.orientation || new Quaternion();          //
            this.scale = new Vector3().setScalar(transforms.scale) || new Vector3().setScalar(1.0);  // represents the radius, we asume perfect sphere

            this.updateModel();
        }

        // physics
        this.radius = transforms.scale;                                     // in Mm (1000 km)
        this.invMass = 1.0 / options.mass || 1.0;                           // in kg

        this.linearVelocity = options.velLin || new Vector3(0.0);           // in Mm/s
        this.orbitalVelocity = options.velOrb || 0.0;                       // in Mm/s

        if (options) {
            this.mass = options.mass || 1;                                  // in kg
            this.gravity = options.gravity || 0;                            // in m/s^2
            this.velocityRotation = options.velRot || 1;                    // in km/s
            this.velocityOrbital = options.velOrb || 1;                     // in Mm/s

            this.traits = "<br />" + 
            "<br /> Mass:" + tab26 + options.mass + " kg" +
            "<br /> Surface Gravity:" + tab15 + (options.gravity * 1000000).toFixed(2) + " m/s^2" +
            "<br /> Mean Radius:" + tab19 + (transforms.scale * 1000).toFixed(2) + " km" +
            "<br /> Average Orbital Speed:" + tab9 + ((options.velLin.x + options.velLin.y + options.velLin.z) * 100000).toFixed(2) + " km/s" +
            "<br /> Equatorial Rotation Velocity:" + tab2 + options.velRot + " km/s" +
            "<br /><br /> Current Velocity:" + tab14;
        }

        // assets
        this.group = new THREE.Group();

        // let material;
        // if (shaders) {
        //     material = new THREE.ShaderMaterial( {
        //         uniforms: {
        //             u_textures: {
        //                 value: [],
        //             },
        //         },
        //         vertexShader: shaders.vertShader,
        //         fragmentShader: shaders.fragShader,
        //     } );
        // } else {
        //     material = new THREE.MeshStandardMaterial();
        // }

        this.mesh = new THREE.Mesh( new THREE.SphereGeometry( 1, 32, 16 ), new THREE.MeshStandardMaterial() );
        this.mesh.position.copy(this.position);
        this.mesh.name = this.name;
        this.group.add(this.mesh);
        this.mesh.scale.copy(new THREE.Vector3(this.radius, this.radius, this.radius));

        if (textures) {
            if (textures.diffuse) {
                let diffmap = new THREE.TextureLoader().load( textures.diffuse,
                    undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
                );
                this.mesh.material.map = diffmap;
            } else {
                this.mesh.material.color.setHex( Math.random() * 0xffffff );
            }
    
            if (textures.normal) {
                let normap = new THREE.TextureLoader().load( textures.normal,
                    undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
                );
                this.mesh.material.normalMap = normap;
            }

            if (textures.bump) {
                let bumpmap = new THREE.TextureLoader().load( textures.bump,
                    undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
                );
                this.mesh.material.bumpMap = bumpmap;
                this.mesh.material.bumpScale = 0.05;
            }
            
            if (textures.emissive) {
                //this.mesh.material.emissive = new THREE.Color( 1, 1, 1 );
                
                let dirLight = this.light = new THREE.DirectionalLight( 0xffffff, 5 );
                dirLight.position.set( this.position.x, this.position.y, this.position.z );
                // TODO: check if we need to do it in the update
                // let dirtarget = new THREE.Object3D(); 
                // dirtarget.position.set( 0.0, 0.0, 0.0);
                // dirLight.target = dirtarget;
                // dirLight.target.updateMatrixWorld();
            }

            if (textures.shadow) {
                let shadowmap = new THREE.TextureLoader().load( textures.shadow,
                    undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
                );
                this.mesh.material.emissiveMap = shadowmap;
                this.mesh.material.emissive = new THREE.Color( 0x444433 );

                this.mesh.material.onBeforeCompile = ( shader ) => {
                    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
                      #ifdef USE_EMISSIVEMAP
              
                        vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
              
                        // Methodology of showing night lights only:
                        //
                        // going through the shader calculations in the meshphysical shader chunks (mostly on the vertex side),
                        // we can confirm that geometryNormal is the normalized normal in view space,
                        // for the night side of the earth, the dot product between geometryNormal and the directional light would be negative
                        // since the direction vector actually points from target to position of the DirectionalLight,
                        // for lit side of the earth, the reverse happens thus emissiveColor would be multiplied with 0.
                        // The smoothstep is to smoothen the change between night and day
                        
                        emissiveColor *= 1.0 - smoothstep(-0.02, 0.0, dot(geometryNormal, directionalLights[0].direction));
                        
                        totalEmissiveRadiance *= emissiveColor.rgb;
              
                      #endif
              
                      ...previous calculations of clouds shadowing
                    `)
                };
            }

            if (textures.clouds) {
                let cloudmap = new THREE.TextureLoader().load( textures.clouds,
                    undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
                );
                // let cloudGeo = new THREE.SphereGeometry( this.radius * 1.01, 32, 16 );
                let cloudGeo = new THREE.SphereGeometry( 1.0, 32, 16 );
                let cloudsMat = new THREE.MeshStandardMaterial({
                  alphaMap: cloudmap,
                  transparent: true,
                });
                this.clouds = new THREE.Mesh( cloudGeo, cloudsMat );
                this.group.add( this.clouds );
            }

            if (textures.oceans) {
                let oceanmap = new THREE.TextureLoader().load( textures.oceans,
                    undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
                );
                this.mesh.material.roughnessMap = oceanmap, // will get reversed in the shaders
                this.mesh.material.metalness = 0.1, // gets multiplied with the texture values from metalness map
                this.mesh.material.metalnessMap = oceanmap,

                this.mesh.material.onBeforeCompile = ( shader ) => {
                    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
                      float roughnessFactor = roughness;
              
                      #ifdef USE_ROUGHNESSMAP
              
                        vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
                        // reversing the black and white values because we provide the ocean map
                        texelRoughness = vec4(1.0) - texelRoughness;
              
                        // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
                        roughnessFactor *= clamp(texelRoughness.g, 0.5, 1.0);
              
                      #endif
                    `);
                  };
            }
        } else {
            this.mesh.material.color.setHex( Math.random() * 0xffffff );
        }
        
        this.velocity = undefined;
    }

    loadShaders(shaderManager, vertShader, fragShader, uniforms) {
        this.uniforms = {
            u_textures: {
                // value: [],
            },
            ...uniforms,
        };

        this.mesh.material = new THREE.ShaderMaterial( {
            onBeforeCompile: (shader) => {
                console.log(shader.vertexShader);
            },
            uniforms: this.uniforms,
            vertexShader: shaderManager.get(vertShader),
            fragmentShader: shaderManager.get(fragShader),
        } );
    }

    getPosition() {
        return this.mesh.position;
    }

    setPosition(vec3Pos) {
        this.mesh.position.copy(vec3Pos);
    }

    setDiffuseMap(pathDiff) {
        let diffmap = new THREE.TextureLoader().load(pathDiff,
            undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
        );
        this.mesh.material.map = diffmap;
    }

    setNormalMap(pathNor) {
        let normap = new THREE.TextureLoader().load(pathNor,
            undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
        );
        this.mesh.material.normalMap = normap;
    }

    setInitialVelocity(orbiteCenter) {
        this.velocity = new THREE.Vector3();
        
        let dir = new THREE.Vector3();
        dir.subVectors(orbiteCenter, this.getPosition()).normalize();

        let right = new THREE.Vector3();
        right.crossVectors(dir, new THREE.Vector3(0, -1, 0)).normalize();

        this.velocity.copy( right.multiplyScalar(this.velocityOrbital) );
    }

    update(delta) {
        this.position.addScaledVector(this.linearVelocity, delta)
        this.mesh.position.copy(this.position);

        this.updateModel();
    }

    updateModel() {
        let trans_mat = new Matrix4();
        trans_mat.setPosition(this.position);
        let rot_mat = new Matrix4();
        rot_mat.makeRotationFromQuaternion(this.orientation);
        let scale_mat = new Matrix4();
        scale_mat.scale(this.scale);

        let TxR = new Matrix4().multiplyMatrices(trans_mat, rot_mat);
        this.model.multiplyMatrices(TxR, scale_mat);
    }

    updateOrbitVelocityDir(orbitCenter) {
        let dir = new THREE.Vector3().subVectors(orbitCenter, this.getPosition()).normalize();
        let right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, -1, 0)).normalize();

        this.linearVelocity.copy( right.multiplyScalar(this.orbitalVelocity) );
    }

    rotate(delta) {
        this.mesh.rotation.y += this.velocityRotation * delta;
    }

    applyImpulse(impulse) {
        if (this.invMass == 0.0)
            return;
    
        this.linearVelocity.addScaledVector(impulse, this.invMass)
        //console.log(this.name, this.linearVelocity.x, this.linearVelocity.y, this.linearVelocity.z);
    }

}

export { Planet };