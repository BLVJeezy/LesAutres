import * as THREE from "three";
import type { Colorway } from "@/lib/catalog";
let fontPromise: Promise<void> | undefined;
export function loadPrintFont() {
  return (fontPromise ??= new FontFace(
    "LesAutresPrint",
    "url(/fonts/Anton-Regular.ttf)",
  )
    .load()
    .then((font) => {
      document.fonts.add(font);
    }));
}
function mask(back = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  if (back) {
    ctx.fillStyle = "#00ff00";
    ctx.font = "italic 900 240px Arial";
    ctx.fillText("Les", 512, 230);
    ctx.fillText("Autres", 512, 435);
  } else {
    const lines = ["BADDIES", "IN BELGICA,", "HOLLANDA,", "FRANSA,", "ESPAGNA"];
    lines.forEach((line, i) => {
      ctx.font = `${i === 0 ? 223 : 183}px LesAutresPrint`;
      ctx.fillStyle = i === 0 ? "#ff0000" : "#00ff00";
      // Keep a consistent statement block with the same optical width on each line.
      const measure = ctx.measureText(line).width;
      ctx.save();
      ctx.translate(512, 25 + i * 198);
      ctx.scale(Math.min(1, 930 / measure), 1);
      ctx.fillText(line, 0, 0);
      ctx.restore();
    });
    let seed = 123;
    const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.25 + random() * 0.6})`;
      ctx.fillRect(
        random() * 1024,
        random() * 1024,
        0.5 + random() * 2,
        random() * 4,
      );
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}
export function garmentMaterial(
  source: THREE.MeshStandardMaterial,
  color: Colorway,
) {
  const front = mask(),
    back = mask(true);
  const uniforms = {
    frontPrint: { value: front },
    backPrint: { value: back },
    printInk: { value: new THREE.Color(color.ink) },
    printAccent: { value: new THREE.Color(color.accent) },
  };
  const material = new THREE.MeshPhysicalMaterial({
    color: color.fabric,
    roughness: 0.96,
    metalness: 0,
    normalMap: source.normalMap,
    normalScale: new THREE.Vector2(0.16, 0.16),
    aoMap: source.aoMap,
    aoMapIntensity: 0.85,
    sheen: 0.22,
    sheenRoughness: 1,
    sheenColor: new THREE.Color("#e7e3db"),
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      "#include <common>\nvarying vec3 garmentPosition;\nvarying vec3 garmentNormal;",
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ngarmentPosition = position;\ngarmentNormal = normal;",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
    varying vec3 garmentPosition;
    varying vec3 garmentNormal;
    uniform sampler2D frontPrint;
    uniform sampler2D backPrint;
    uniform vec3 printInk;
    uniform vec3 printAccent;
  `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
    bool isFront = garmentPosition.z > 0.0 && garmentNormal.z > 0.25;
    bool isBack = garmentPosition.z < 0.0 && garmentNormal.z < -0.25;
    vec2 printUV = isFront ? vec2(garmentPosition.x / 1.40 + 0.5, (garmentPosition.y - 0.02) / 1.70 + 0.5) : vec2(-garmentPosition.x / 0.46 + 0.5, (garmentPosition.y - 0.93) / 0.27 + 0.5);
    if ((isFront || isBack) && all(greaterThanEqual(printUV, vec2(0.0))) && all(lessThanEqual(printUV, vec2(1.0)))) {
      vec4 inkMask = isFront ? texture2D(frontPrint, printUV) : texture2D(backPrint, printUV);
      vec3 ink = mix(printInk, printAccent, step(inkMask.g, inkMask.r));
      diffuseColor.rgb = mix(diffuseColor.rgb, ink, inkMask.a * 0.95);
    }
    vec2 labelUV = vec2((garmentPosition.x - .67) / .13 + .5, (garmentPosition.y + 1.10) / .16 + .5);
    if (isFront && all(greaterThanEqual(labelUV, vec2(0.0))) && all(lessThanEqual(labelUV, vec2(1.0)))) {
      float mark = texture2D(backPrint, labelUV).a;
      diffuseColor.rgb = mix(vec3(.008), vec3(.8), mark);
    }
  `,
    );
  };
  material.customProgramCacheKey = () => "les-autres-garment-print-v2";
  return {
    material,
    uniforms,
    dispose: () => {
      material.dispose();
      front.dispose();
      back.dispose();
    },
  };
}
