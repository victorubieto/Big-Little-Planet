import * as THREE from "three";
import { Vector3, Quaternion, Matrix4 } from "three";

import { Planet } from "./CelestialBody.js";

class Earth extends Planet {

    constructor(transforms, parameters, textures) {
        super("Earth", transforms, parameters, textures);

    }
}

export { Earth };