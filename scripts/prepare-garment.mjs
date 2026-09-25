/** Keep the original UVs, sewn details, AO and normal textures; adapt the silhouette to a boxier fit. */
import { readFileSync, writeFileSync } from "node:fs";
const source = readFileSync("public/models/shirt-source.glb");
const jsonLength = source.readUInt32LE(12);
const gltf = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
const bin = Buffer.from(source.subarray(28 + jsonLength));
const primitive = gltf.meshes[0].primitives[0];
const positions = gltf.accessors[primitive.attributes.POSITION];
const normals = gltf.accessors[primitive.attributes.NORMAL];
const positionView = gltf.bufferViews[positions.bufferView];
const normalView = gltf.bufferViews[normals.bufferView];
const min = [Infinity, Infinity, Infinity],
  max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < positions.count; i++) {
  const offset =
    (positionView.byteOffset || 0) +
    (positions.byteOffset || 0) +
    i * (positionView.byteStride || 12);
  const normalOffset =
    (normalView.byteOffset || 0) +
    (normals.byteOffset || 0) +
    i * (normalView.byteStride || 12);
  const y = bin.readFloatLE(offset + 4);
  const width = 5.15 + 0.55 * Math.max(0, Math.min(1, (0.06 - y) / 0.36));
  const scale = [width, 4.15, 3.2];
  const normal = [];
  for (let axis = 0; axis < 3; axis++) {
    const v =
      (bin.readFloatLE(offset + axis * 4) + (axis === 1 ? 0.045 : 0)) *
      scale[axis];
    bin.writeFloatLE(v, offset + axis * 4);
    min[axis] = Math.min(min[axis], v);
    max[axis] = Math.max(max[axis], v);
    normal[axis] = bin.readFloatLE(normalOffset + axis * 4) / scale[axis];
  }
  const length = Math.hypot(...normal);
  normal.forEach((v, axis) =>
    bin.writeFloatLE(v / length, normalOffset + axis * 4),
  );
}
positions.min = min;
positions.max = max;
gltf.materials[0].pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
gltf.materials[0].pbrMetallicRoughness.roughnessFactor = 0.96;
gltf.materials[0].normalTexture.scale = 0.18;
gltf.asset.extras = {
  source:
    "https://github.com/pmndrs/examples/tree/main/examples/t-shirt-configurator",
  license: "MIT",
  adaptation:
    "Boxier proportions for Les Autres; original UVs and fabric maps retained.",
};
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 32)]);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + json.length + bin.length, 8);
header.writeUInt32LE(json.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(bin.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
writeFileSync(
  "public/models/drop-001.glb",
  Buffer.concat([header, json, binHeader, bin]),
);
console.log("Prepared garment", min, max);
