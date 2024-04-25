import * as THREE from "three";
import { Vector3, Quaternion, Matrix4 } from "three";

// &nbsp; (Regular space) &ensp; (Two spaces gap) &emsp; (Four spaces gap)
const tab1 = "&emsp;";
const tab3 = "&emsp;&emsp;&emsp;";
const tab5 = "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;";
const tab6 = "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;";
const tab7 = "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;";
const tab11 = "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&nbsp;";

class Planet {

    constructor(name, transforms, options, textures) {
        
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
            "<br /> Mass:" + tab11 + options.mass + " kg" +
            "<br /> Surface Gravity:" + tab6 + (options.gravity * 1000000).toFixed(2) + " m/s^2" +
            "<br /> Mean Radius:" + tab7 + (transforms.scale * 1000) + " km" +
            "<br /> Average Orbital Speed:" + tab3 + ((options.velLin.x + options.velLin.y + options.velLin.z) * 100000).toFixed(2) + " km/s" +
            "<br /> Equatorial Rotation Velocity:" + tab1 + options.velRot + " km/s" +
            "<br /><br /> Current Velocity:" + tab5;
        }

        // assets
        this.mesh = new THREE.Mesh( new THREE.SphereGeometry( this.radius, 32, 16 ),  new THREE.MeshStandardMaterial() );
        this.mesh.position.copy(this.position);
        this.mesh.name = this.name;
        if (textures) {
            if (textures.diffuse) {
                let diffmap = new THREE.TextureLoader().load(textures.diffuse,
                    undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
                );
                this.mesh.material.map = diffmap;
            }
            if (textures.normal) {
                let normap = new THREE.TextureLoader().load(textures.normal,
                    undefined, undefined, () => { console.error("The texture has not been loaded correctly."); }
                );
                this.mesh.material.normalMap = normap;
            }
            if (textures.emissive) {
                this.mesh.material.emissive = new THREE.Color(1,1,1);
                
                let dirLight = this.light = new THREE.DirectionalLight( 0xffffff, 5 );
                dirLight.position.set(this.position.x, this.position.y, this.position.z);
                // TODO: check if we need to do it in the update
                // let dirtarget = new THREE.Object3D(); 
                // dirtarget.position.set( 0.0, 0.0, 0.0);
                // dirLight.target = dirtarget;
                // dirLight.target.updateMatrixWorld();
            }
        }
        
        this.velocity = undefined;
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