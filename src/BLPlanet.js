import * as THREE from "three";
import { Vector3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GUI } from "https://cdn.skypack.dev/lil-gui";
import { Planet } from "./Planet.js";

class App {

    constructor() {
        // time attributes
        this.clock = new THREE.Clock();
        this.date = 0; // "1/1/0 00:00"
        this.timeStep = 0.01; // 0.005
        this.maxDelta = 0.02;

        // scene attributes
        this.scene = null;
        this.renderer = null;
        this.composer = null;

        this.camera = null;
        this.controls = null;
        this.zoom = 200.0;

        this.INTERSECTED;
        this.SELECTED;
        this.FOLLOWING;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        // constants
        this.G = 6.6743e-29; // Gravitational constant (Mm^3 kg^-1 s^-2)

        this.planets = [];
        this.planetsMeshes = [];
    }

    init() {

        let scene = this.scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x1f1f1f1f );
        // let gridHelper = new THREE.GridHelper( 100, 10 );   // square = 10 Mm^2
        // gridHelper.name = "GridHelper";
        // scene.add( gridHelper );
        //let gridHelper2 = new THREE.GridHelper( 100000, 10000 );   // square = 10000 Mm^2
        //scene.add( gridHelper2 );

        // Renderer
        let renderer = this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.toneMapping = THREE.ReinhardToneMapping;
        //renderer.toneMapping = THREE.LinearToneMapping;
        renderer.toneMappingExposure = Math.pow( 1.0, 4.0 );
        renderer.shadowMap.enabled = true;
        document.body.appendChild( renderer.domElement );

        // Camera
        let camera = this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 1000000 );
        let controls = this.controls = new OrbitControls( camera, renderer.domElement );
        controls.object.position.set( 0.0, 100, 300 );
        controls.target.set( 0.0, 0.0, 0.0 );
        controls.minDistance = 1;
        controls.maxDistance = 100000;

        // Render passes
        let renderScene = new RenderPass(scene, camera);

        let bloomPass = this.bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = 0.95;
        bloomPass.strength = 0.5;
        bloomPass.radius = 0.1;

        let outputPass = new OutputPass();

        this.composer = new EffectComposer( renderer );
        this.composer.addPass( renderScene );
        this.composer.addPass( bloomPass );
        this.composer.addPass( outputPass );

        // Lights
        let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.05 );
        scene.add(hemiLight);

        // Add planets here
        this.initSolarSystem();

        // Initially follow the Earth
        this.FOLLOWING = this.planetsMeshes.find(p => p.name === "Earth");
        controls.target = this.FOLLOWING.position;
        controls.update();

        // Call the loop
        this.initGUI();

        this.animate();
        document.querySelector("#loading").style.display = "none";

        window.addEventListener( "pointermove",  this.onPointerMove.bind(this) );
        window.addEventListener( "click", this.onClick.bind(this) );
        window.addEventListener( "dblclick", this.onDBClick.bind(this) );
        window.addEventListener( "wheel", this.onWheel.bind(this) );
        window.addEventListener( "resize", this.onWindowResize.bind(this) );
    }

    initSolarSystem() {

        let earth = new Planet("Earth",
            { position: new Vector3(0.0), scale: 6.371 },
            { mass: 5.97219e24, gravity: 0.00000980665, velLin: new Vector3(0.0, 0.0, 0.0002978), velRot: 0.4651 }, // 0.00000980665 9.80665 0.02978
            { diffuse: "../res/textures/coast_land_rocks_01_diff_1k.png", normal: "../res/textures/coast_land_rocks_01_nor_gl_1k.png" });
        this.planets.push(earth);
        this.scene.add(earth.mesh);

        let ball2 = new Planet("Aux_Ball",
            { position: new Vector3(-15.0) },
            { mass: 1e22, gravity: 0.0, velLin: new Vector3(0.0, 0.0, 0.005) });
        this.planets.push(ball2);
        this.scene.add(ball2.mesh);

        let moon = new Planet("Moon",
            { position: new Vector3(384.4, 0.0, 0.0), scale: 1.7374 },
            { mass: 7.34767309e22, gravity: 0.000001622, velLin: new Vector3(0.0, 0.0, 0.001022), velRot: 0.004627 }, //
            { diffuse: "../res/textures/rough_plasterbrick_05_diff_1k.png", normal: "../res/textures/rough_plasterbrick_05_nor_gl_1k.png"});
        this.planets.push(moon);
        this.scene.add(moon.mesh);

        let mercury = new Planet("Mercury",
            { position: new Vector3(77000, 0.0, 0.0), scale: 2.4397 },
            { mass: 3.3011e23, gravity: 0.0000037, velLin: new Vector3(0.0, 0.0, 0.0004736), velRot: 0.0030256 },
            { diffuse: "../res/textures/brushed_concrete_diff_1k.png", normal: "../res/textures/brushed_concrete_nor_gl_1k.png" });
        this.planets.push(mercury);
        this.scene.add(mercury.mesh);

        let venus = new Planet("Venus",
            { position: new Vector3(40000, 0.0, 0.0), scale: 2.4397 },
            { mass: 4.8675e24, gravity: 0.00000887, velLin: new Vector3(0.0, 0.0, 0.0003502), velRot: 0.00181 },
            { diffuse: "../res/textures/beige_wall_001_diff_1k.png", normal: "../res/textures/beige_wall_001_nor_gl_1k.png" });
        this.planets.push(venus);
        this.scene.add(venus.mesh);

        let mars = new Planet("Mars",
            { position: new Vector3(225000, 0.0, 0.0), scale: 2.4397 },
            { mass: 6.4171e23, gravity: 0.00000372076, velLin: new Vector3(0.0, 0.0, 0.0002407), velRot: 0.241 },
            { diffuse: "../res/textures/rust_coarse_01_diff_1k.png", normal: "../res/textures/rust_coarse_01_nor_gl_1k.png" });
        this.planets.push(mars);
        this.scene.add(mars.mesh);

        let jupiter = new Planet("Jupiter",
            { position: new Vector3(714000, 0.0, 0.0), scale: 2.4397 },
            { mass: 1.8982e27, gravity: 0.00002479, velLin: new Vector3(0.0, 0.0, 0.0001307), velRot: 12.6 },
            { diffuse: "../res/textures/rusty_metal_sheet_diff_1k.png", normal: "../res/textures/rusty_metal_sheet_nor_gl_1k.png" });
        this.planets.push(jupiter);
        this.scene.add(jupiter.mesh);

        let saturn = new Planet("Saturn",
            { position: new Vector3(1543100, 0.0, 0.0), scale: 2.4397 },
            { mass: 5.6834e26, gravity: 0.00001044, velLin: new Vector3(0.0, 0.0, 0.0000968), velRot: 9.87 },
            { diffuse: "../res/textures/yellow_plaster_diff_1k.png", normal: "../res/textures/yellow_plaster_nor_gl_1k.png" });
        this.planets.push(saturn);
        this.scene.add(saturn.mesh);

        let uranus = new Planet("Uranus",
            { position: new Vector3(2900000, 0.0, 0.0), scale: 2.4397 },
            { mass: 8.6812e25, gravity: 0.00000869, velLin: new Vector3(0.0, 0.0, 0.000068), velRot: 2.59 },
            { diffuse: "../res/textures/asphalt_04_diff_1k.png", normal: "../res/textures/asphalt_04_nor_gl_1k.png" });
        this.planets.push(uranus);
        this.scene.add(uranus.mesh);

        let neptune = new Planet("Neptune",
            { position: new Vector3(4590900, 0.0, 0.0), scale: 2.4397 },
            { mass: 1.02409e26, gravity: 0.00001115, velLin: new Vector3(0.0, 0.0, 0.0000543), velRot: 2.68 },
            { diffuse: "../res/textures/aerial_asphalt_01_diff_1k.png", normal: "../res/textures/aerial_asphalt_01_nor_gl_1k.png" });
        this.planets.push(neptune);
        this.scene.add(neptune.mesh);

        let sun = new Planet("Sun",
            { position: new Vector3(150530, 0.0, 0.0), scale: 696.3 },
            { mass: 1.9885e30, gravity: 0.000274, velLin: new Vector3(0.0), velRot: 1.997 }, // 274 0.000274
            { emissive: true }); 
        this.planets.push(sun);
        this.scene.add(sun.mesh);
        this.scene.add(sun.light);

        // Create list of the mesh of the planets (to help the raycast)
        this.planetsMeshes = this.planets.map( el => {return el.mesh;} );
    }

    initGUI() {

        // Date
        let date = this.datePanel = document.createElement("div");
        date.innerHTML = "Date: " + this.date;
        date.style.fontFamily = "sans-serif";
        date.style.color = "white";
        date.style.position = "absolute";
        date.style.top = 20 + "px";
        date.style.left = 20 + "px";
        document.body.appendChild(date);

        // Planet Info
        let info = this.planetPanel = document.createElement("div");
        info.innerHTML = "Planet Info < ";
        info.style.fontFamily = "sans-serif";
        info.style.color = "white";
        info.style.position = "absolute";
        info.style.top = 100 + "px";
        info.style.left = 20 + "px";
        info.style.visibility = "hidden";

        this.planetInfo = document.createElement("a");
        document.body.appendChild(info);
        info.appendChild(this.planetInfo);

        // Orbit Curves
        // let points = [
        //     new THREE.Vector3(-100, 0, 100),
        //     new THREE.Vector3(-50, 50, 50),
        //     new THREE.Vector3(0, 0, 0),
        //     new THREE.Vector3(50, -50, 50),
        //     new THREE.Vector3(100, 0, 100),
        // ];
        // let path = new THREE.CatmullRomCurve3(points);
        // path.getPointAt();
        //
        // let pathGeometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(50));
        // let pathMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
        // let pathObject = new THREE.Line(pathGeometry, pathMaterial);
        // this.scene.add(pathObject);

        // Right GUI panel
        let gui = new GUI().title("Big Little Planet Controls");

        let options = this.options = {
            grid: true,
            space: false,
            orbitDebug: false,

            timeMuliplier: 1, // Hours: 3600, Minute: 60, Second: 1
            timeSet: 0,

            follow: "Earth",
        };

        let flagsFolder = gui.addFolder( 'Flags' ).close();
        flagsFolder.add(options, "grid").name("Show Grid").listen().onChange( (value) => {
            this.scene.getObjectByName("GridHelper").visible = value;
        } );
        flagsFolder.add(options, "space").name("Show Space");
        flagsFolder.add(options, "orbitDebug").name("Show Orbit");

        let renderOptions = {
            bloomTh: this.bloomPass.threshold,
            bloomStr: this.bloomPass.strength,
            bloomRad: this.bloomPass.radius,
        }

        let renderFolder = gui.addFolder( 'Render' ).close();
        renderFolder.add( renderOptions, 'bloomTh', 0, 1 ).name("Bloom Threshold").onChange( (val) => { this.bloomPass.threshold = val; });
        renderFolder.add( renderOptions, 'bloomStr', 0, 3 ).name("Bloom Strength").onChange( (val) => { this.bloomPass.strength = val; });
        renderFolder.add( renderOptions, 'bloomRad', 0, 1 ).name("Bloom Radius").onChange( (val) => { this.bloomPass.radius = val; });

        gui.add(options, "timeMuliplier", {Year: 31536000, Month: 2592000, Day: 86400, Hour: 3600, Minute: 60, Second: 1, Stop: 0,
            Minus_Second: -1, Minus_Minute: -60, Minus_Hour: -3600, Minus_Day: -86400, Minus_Month: -2592000, Minus_Year: -31536000}).name("Time Passed in 1s");

        gui.add(options, "follow", {Mercury: "Mercury", Venus: "Venus", Earth: "Earth", Mars: "Mars", Jupiter: "Jupiter", Saturn: "Saturn", Uranus: "Uranus", Neptune: "Neptune", Sun: "Sun", Moon: "Moon"}).name("Fast Travel").onChange( (name) => {
            this.FOLLOWING = this.planetsMeshes.find(p => p.name === name);
            this.controls.target = this.FOLLOWING.position;
        } );
    }

    animate() {

        requestAnimationFrame( this.animate.bind(this) );
        let delta = this.clock.getDelta();

        // Determine a static time step
        let maxIters = Math.min(delta, this.maxDelta);
        if (maxIters >= 0) {
            for (let iDelta = 0; iDelta <= maxIters; iDelta += this.timeStep) {
                this.update(this.timeStep * this.options.timeMuliplier);
            }
        } else {
            for (let iDelta = 0; iDelta <= -maxIters; iDelta += this.timeStep) {
                this.update(-this.timeStep * this.options.timeMuliplier);
            }
        }

        this.render();
    }

    render() {

        if (!this.renderer)
            return;

        this.composer.render();
    }

    update(dt) {

        /* UPDATE CAMERA */
        this.controls.update();

        // move camera along the following planet
        if (this.FOLLOWING) {
            // find dir vector
            let dirToCam = new Vector3().subVectors(this.camera.position, this.FOLLOWING.position).normalize();
            dirToCam.multiplyScalar(this.FOLLOWING.geometry.parameters.radius * 5 + this.zoom);
            this.camera.position.copy(this.FOLLOWING.position).add(dirToCam);
        }

        // update the picking ray with the camera and pointer position
        this.raycaster.setFromCamera( this.pointer, this.camera );

        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects( this.planetsMeshes );
        if ( intersects.length > 0 ) {
            if ( this.INTERSECTED != intersects[0].object ) {
                if ( this.INTERSECTED ) this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );
                this.INTERSECTED = intersects[0].object;

                // what we do with the intersected object
                this.INTERSECTED.currentHex = this.INTERSECTED.material.color.getHex();
                this.INTERSECTED.material.color.setHex( 0xff0000 );
                this.planetInfo.innerHTML = this.INTERSECTED.name + " >";
                this.planetPanel.style.visibility = "visible"; // show info panel
            }
            // If we had it intersected, but we select it, we show more info
            else if (this.SELECTED) {
                if (this.SELECTED.name == this.INTERSECTED.name) {
                    this.planetInfo.innerHTML = this.SELECTED.name + " >" + this.SELECTED.traits + (this.SELECTED.linearVelocity.length() * 100000).toFixed(2) + " km/s";
                }
            }
        } 
        else {
            if ( this.INTERSECTED ) {
                this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );
            }
            if ( this.SELECTED ) {
                this.planetInfo.innerHTML = this.SELECTED.name + " >" + this.SELECTED.traits + (this.SELECTED.linearVelocity.length() * 100000).toFixed(2) + " km/s";
            } else {
                this.planetPanel.style.visibility = "hidden"; // hide info panel
            }
            this.INTERSECTED = null;
        }

        /* UPDATE DATE */
        let stopped = false;
        if (this.datePanel) {

            let date = this.date += dt; // simulation goes to 60fps. Second --> dt = delta * 1 = 0.01. Therefore 0.6 is a minute, 36 an hour, 864 a day, 25.920 a month, and 315.360 a year

            if (this.date < 0.1) {
                date = this.date = 0.1; // 0.1 seems to work instead of 0
                stopped = true;
            } else {
                //stopped = false;
                //this.options.timeMuliplier = 0;
            }

            let seconds = date % 60;
            let minutes = (date % 3600) / 60;
            let hours = (date % 86400) / 3600;

            let years = date / 31536000;
            let seconds_in_year = date % 31536000; // 31.556.926s a year
            let ranges = {
                Jan: [0,        2678400],    // 31 days
                Feb: [2678400,  5097600],    // 28 days
                Mar: [5097600,  7776000],    // 31 days
                Apr: [7776000,  10368000],   // 30 days
                May: [10368000, 13046400],   // 31 days
                Jun: [13046400, 15638400],   // 30 days
                Jul: [15638400, 18316800],   // 31 days
                Aug: [18316800, 20995200],   // 31 days
                Sep: [20995200, 23587200],   // 30 days
                Oct: [23587200, 26265600],   // 31 days
                Nov: [26265600, 28857600],   // 30 days
                Dec: [28857600, 31536000],   // 31 days
            };

            let days = 1;
            let month = "Jan";
            for (let y in ranges) {
                if (ranges[y][0] < seconds_in_year && seconds_in_year < ranges[y][1]) {
                    month = y;
                    let seconds_in_month = seconds_in_year - ranges[y][0];
                    days += seconds_in_month / 86400;
                }
            }

            this.datePanel.innerHTML = "Date: " + Math.floor(years) + " ";
            this.datePanel.innerHTML += month;
            this.datePanel.innerHTML += " " + Math.floor(days) + " / ";

            this.datePanel.innerHTML += ((hours < 10) ? "0" : "") + Math.floor(hours);
            this.datePanel.innerHTML += ((minutes < 10) ? ":0" : ":") + Math.floor(minutes);
            this.datePanel.innerHTML += ((seconds < 10) ? ":0" : ":") + Math.floor(seconds); // this.date = "1/1/0 00:00:00"
        }

        /* UPDATE PHYSICS */
        this.updatePhysics(dt);
    }

    updatePhysics(dt) {

        // Apply impulses
        for (let i = 0; i < this.planets.length; i++) {
            let planetA = this.planets[i];

            // Gravity applied each pair of planets
            for (let j = i+1; j < this.planets.length; j++) {
                let planetB = this.planets[j];
                let dirAB = new Vector3().subVectors(planetB.position, planetA.position).normalize();
                let dirBA = new Vector3().copy(dirAB).negate();

                // Book implementation
                // let gravityVec = new Vector3().copy(dirAB).multiplyScalar(planetB.gravity);
                // let massA = 1.0 / planetA.invMass;
                // let impulseGravity = new Vector3().copy(gravityVec).multiplyScalar( massA * dt );
                // planetA.applyImpulse( impulseGravity );

                // gravityVec = new Vector3().copy(dirBA).multiplyScalar(planetA.gravity);
                // let massB = 1.0 / planetB.invMass;
                // impulseGravity = new Vector3().copy(gravityVec).multiplyScalar( massB * dt );
                // planetB.applyImpulse( impulseGravity );

                // My implementation
                let r = planetA.position.distanceTo( planetB.position );
                let massA = 1.0 / planetA.invMass;
                let massB = 1.0 / planetB.invMass;
                let force = this.G * massA * massB / (r*r); // universal gravitation force (kg Mm s^-2)
                let accelerationBA = dirBA.clone().multiplyScalar( force );
                let impulseGravityBA = accelerationBA.multiplyScalar( dt );
                planetB.applyImpulse( impulseGravityBA );

                let accelerationAB = dirAB.clone().multiplyScalar( force );
                let impulseGravityAB = accelerationAB.multiplyScalar( dt );
                planetA.applyImpulse( impulseGravityAB );
            }
        }

        // Update position
        for (let i = 0; i < this.planets.length; i++) {
            this.planets[i].update( dt );
            //this.planets[i].updateOrbitVelocityDir();
        }
    }

    onPointerMove( event ) {

        // Calculate pointer position in normalized device coordinates (-1 to +1) for both components
        this.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    onClick( event ) { // carefull, double clicks also count as 2 one-clicks

        if (this.INTERSECTED != null) {
            // selected objects not only have the name but the full planet info
            let selPlanet = this.planets.find(p => p.name === this.INTERSECTED.name );
            this.SELECTED = this.SELECTED == selPlanet ? null : selPlanet;
            this.planetInfo.innerHTML = this.INTERSECTED.name + " >";
        }
    }

    onDBClick( event ) {

        if (this.INTERSECTED != null) {
            this.controls.target = this.INTERSECTED.position;

            if (this.FOLLOWING) {
                if (this.FOLLOWING != this.INTERSECTED) {
                    this.FOLLOWING = this.INTERSECTED;
                    // move camera to selected object
                    this.camera.position.copy(this.INTERSECTED.position).add(new Vector3(50.0, 50.0, 100.0));
                } else {
                    this.FOLLOWING = null;
                    this.controls.target = new Vector3().copy(this.INTERSECTED.position);
                }
            } else {
                this.FOLLOWING = this.INTERSECTED;
                // move camera to selected object
                this.camera.position.copy(this.INTERSECTED.position).add(new Vector3(50.0, 50.0, 100.0));
            }
        }
    }

    onWheel( event ) {
        this.zoom += event.deltaY * 0.1;
        // Restrict zoom
        this.zoom = Math.min(Math.max(1.0, this.zoom), 100000);
    }

    onWindowResize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}

let app = new App();
app.init();

export { app };