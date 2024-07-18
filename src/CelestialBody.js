import * as THREE from "three";
import { Vector3, Quaternion, Matrix4 } from "three";

class CelestialBody {

    constructor(name, transforms, parameters, textures) {
    
        this.name = name || "undefined";

        // Physical parameters
        this.radius = transforms.scale || 1.0;                                     // in Mm (1000 km)
        this.velocity = undefined;
        
        if (parameters) {
            this.mass = parameters.mass || 1.0;                                  // in kg
            this.invMass = 1.0 / this.mass || 1.0;                           // in kg
            this.gravity = parameters.gravity || 0.0;                            // in m/s^2
            this.linearVelocity = parameters.velLin || new Vector3(0.0);           // in Mm/s
            this.orbitalVelocity = parameters.velOrb || 0.0;                       // in Mm/s

            this.traits = "<br />" + 
            "<br /> Mass:&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;" + parameters.mass + " kg" +
            "<br /> Surface Gravity:&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;" + (parameters.gravity * 1000000).toFixed(2) + " m/s^2" +
            "<br /> Mean Radius:&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;" + (transforms.scale * 1000).toFixed(2) + " km" +
            "<br /> Average Orbital Speed:&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;" + ((parameters.velLin.x + parameters.velLin.y + parameters.velLin.z) * 100000).toFixed(2) + " km/s" +
            "<br /> Equatorial Rotation Velocity:&ensp;&ensp;" + parameters.velRot + " km/s" +
            "<br /><br /> Current Velocity:&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;";
        }

        // Mesh and model
        this.mesh = new THREE.Mesh( new THREE.SphereGeometry( 1, 32, 16 ), new THREE.MeshStandardMaterial() );
        this.mesh.name = this.name;
        
        if (transforms) {
            this.position = transforms.position || new Vector3(0.0);
            this.mesh.position.copy(this.position);
            this.mesh.scale.copy(new THREE.Vector3(this.radius, this.radius, this.radius));

            this.mesh.updateMatrix();
            this.mesh.updateMatrixWorld();
        }

        if (textures) {
            if (textures.diffuse) {
                let diffmap = new THREE.TextureLoader().load( textures.diffuse,
                    ( tex ) => { this.mesh.material.map = tex; }, 
                    undefined, 
                    () => { if (this.mesh.material.color) this.mesh.material.color.setHex( Math.random() * 0xffffff ); }//console.error("The texture has not been loaded correctly."); }
                );
            } else {
                this.mesh.material.color.setHex( Math.random() * 0xffffff );
            }
    
            if (textures.normal) {
                let normap = new THREE.TextureLoader().load( textures.normal,
                    ( tex ) => { this.mesh.material.normalMap = tex; }, 
                    undefined, 
                    () => { }//console.error("The texture has not been loaded correctly."); }
                );
            }
        } else {
            this.mesh.material.color.setHex( Math.random() * 0xffffff );
        }
    }

    getPosition() {
        return this.mesh.position;
    }

    setPosition(vec3Pos) {
        this.mesh.position.copy(vec3Pos);
    }

    setInitialVelocity(orbiteCenter) {
        this.velocity = new THREE.Vector3();
        
        let dir = new THREE.Vector3();
        dir.subVectors(orbiteCenter, this.getPosition()).normalize();

        let right = new THREE.Vector3();
        right.crossVectors(dir, new THREE.Vector3(0, -1, 0)).normalize();

        this.velocity.copy( right.multiplyScalar(this.velocityOrbital) );
    }

    getPhysicalParameters() {

    }

    update(delta) {
        this.position.addScaledVector(this.linearVelocity, delta)
        this.mesh.position.copy(this.position);

        // this.updateModel();
        this.mesh.updateMatrix();
        this.mesh.updateMatrixWorld();

        this.updateUniforms();
    }

    updateUniforms() {
        
    }

    applyImpulse(impulse) {
        if (this.invMass == 0.0)
            return;
    
        this.linearVelocity.addScaledVector(impulse, this.invMass)
        //console.log(this.name, this.linearVelocity.x, this.linearVelocity.y, this.linearVelocity.z);
    }

}

class Planet extends CelestialBody {
    
    constructor(name, transforms, parameters, textures) {
        super(name, transforms, parameters, textures);

        this.distanceToSun = transforms.position.length();
    }

    addMoon(_moon) {
        this.moon = _moon;
    }
}

class Moon extends CelestialBody {
    
    constructor(name, planet, transforms, parameters, textures) {
        // add the distance to the sun to make it global
        let _distanceToPlanet = transforms.position.length();
        transforms.position.x = _distanceToPlanet + planet.distanceToSun;

        super(name, transforms, parameters, textures);

        this.distanceToPlanet = _distanceToPlanet;

        planet.addMoon(this);
    }
}

class Star extends CelestialBody {
    
    constructor(name, transforms, parameters, textures) {
        super(name, transforms, parameters, textures);

        // Stars emits lights
        this.light = new THREE.PointLight( 0xffffff, 5000, 5000000, 0.5);
        this.light.position.set( this.position.x, this.position.y, this.position.z );
    }
}

export { CelestialBody, Planet, Moon, Star };