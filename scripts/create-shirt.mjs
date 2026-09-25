import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { writeFileSync, copyFileSync } from "node:fs";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result =
        "data:application/octet-stream;base64," +
        Buffer.from(buffer).toString("base64");
      this.onloadend?.();
    });
  }
};
const outline = [
  [-0.36, 1.17],
  [-0.73, 1.08],
  [-1.45, 0.43],
  [-1.07, 0.02],
  [-0.82, 0.25],
  [-0.84, -1.28],
  [0.84, -1.28],
  [0.82, 0.25],
  [1.07, 0.02],
  [1.45, 0.43],
  [0.73, 1.08],
  [0.36, 1.17],
];
const shape = new THREE.Shape();
shape.moveTo(...outline[0]);
outline.slice(1).forEach((p) => shape.lineTo(...p));
shape.quadraticCurveTo(0, 0.75, -0.36, 1.17);
const clothVolume = (x, y) => {
  const ax = Math.abs(x);
  const section =
    ax < 0.84
      ? 0.025 + 0.26 * Math.sqrt(Math.max(0, 1 - (x / 0.86) ** 2))
      : 0.025 + 0.07 * Math.sin(Math.min(1, (ax - 0.84) / 0.61) * Math.PI);
  const folds =
    (Math.sin(x * 15 + y * 2) * 0.01 + Math.sin(x * 22 - y * 3) * 0.007) *
    (1 - Math.min(1, ax / 1.5));
  return section * (0.92 + 0.08 * Math.cos(y * 2)) + folds;
};
const base = new TessellateModifier(0.07, 6).modify(
  new THREE.ShapeGeometry(shape, 30),
);
const scene = new THREE.Scene();
for (const back of [false, true]) {
  const geo = base.clone();
  const pos = geo.attributes.position;
  const uvs = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i);
    const volume = clothVolume(x, y);
    pos.setZ(i, (back ? -1 : 1) * volume);
    uvs.push(back ? 1 - (x + 1.6) / 3.2 : (x + 1.6) / 3.2, (1.35 - y) / 2.8);
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.deleteAttribute("normal");
  const smooth = mergeVertices(geo);
  smooth.computeVertexNormals();
  const mesh = new THREE.Mesh(
    smooth,
    new THREE.MeshStandardMaterial({
      color: "#e8e5dd",
      side: THREE.DoubleSide,
      roughness: 1,
    }),
  );
  mesh.name = back ? "back" : "front";
  scene.add(mesh);
}
// A curved, ribbed collar gives the neckline a tangible edge.
const points = [];
for (let i = 0; i <= 48; i++) {
  const t = i / 48;
  points.push(
    new THREE.Vector3(
      -0.36 + 0.72 * t,
      1.17 - 0.21 * Math.sin(t * Math.PI),
      0.29,
    ),
  );
}
const collar = new THREE.Mesh(
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    48,
    0.035,
    8,
    false,
  ),
  new THREE.MeshStandardMaterial({ color: "#dad7cf", roughness: 1 }),
);
collar.name = "collar";
scene.add(collar);
const edge = shape.getPoints(64);
const positions = [],
  uv = [];
const vol = clothVolume;
for (let i = 0; i < edge.length - 1; i++) {
  const a = edge[i],
    b = edge[i + 1];
  const az = vol(a.x, a.y),
    bz = vol(b.x, b.y);
  positions.push(
    a.x,
    a.y,
    az,
    a.x,
    a.y,
    -az,
    b.x,
    b.y,
    bz,
    b.x,
    b.y,
    bz,
    a.x,
    a.y,
    -az,
    b.x,
    b.y,
    -bz,
  );
  for (let j = 0; j < 6; j++) uv.push(0, 0);
}
const seamGeo = new THREE.BufferGeometry();
seamGeo.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(positions, 3),
);
seamGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
seamGeo.computeVertexNormals();
const seams = new THREE.Mesh(
  seamGeo,
  new THREE.MeshStandardMaterial({
    color: "#e8e5dd",
    side: THREE.DoubleSide,
    roughness: 1,
  }),
);
seams.name = "seams";
scene.add(seams);
const buffer = await new GLTFExporter().parseAsync(scene, { binary: true });
writeFileSync("public/shirt.glb", Buffer.from(buffer));
copyFileSync(
  "node_modules/three/examples/fonts/helvetiker_bold.typeface.json",
  "public/fonts/helvetiker_bold.typeface.json",
);
console.log(`Shirt exported: ${buffer.byteLength} bytes`);
