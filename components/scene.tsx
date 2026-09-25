"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Center,
  Text3D,
  Environment,
  Lightformer,
  useGLTF,
} from "@react-three/drei";
import {
  Suspense,
  useMemo,
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
} from "react";
import * as THREE from "three";
import type { Colorway } from "@/lib/catalog";
import { garmentMaterial, loadPrintFont } from "./garment-material";
import {
  AUTO_TURN_SPEED,
  COLOR_TURN_SECONDS,
  colorTurn,
  nextFrontAngle,
  TURN,
} from "@/lib/scene-motion";
type Rotation = { angle: number; last: number; velocity: number };
type SceneProps = {
  mode: "hero" | "shirt";
  color: Colorway;
  reduced?: boolean;
  active?: boolean;
  onInteract?: () => void;
  onFail?: () => void;
  onReady?: () => void;
};
function Studio({ chrome }: { chrome: boolean }) {
  return (
    <>
      <ambientLight intensity={chrome ? 0.25 : 0.8} />
      <directionalLight position={[-3, 5, 5]} intensity={chrome ? 2 : 2.8} />
      <directionalLight position={[3, 1, -4]} intensity={1.4} />
      {chrome && (
        <Environment resolution={128} frames={1}>
          <color attach="background" args={["#a4adba"]} />
          <Lightformer
            form="rect"
            intensity={3}
            position={[0, 1, 5]}
            scale={[9, 5, 1]}
          />
          <Lightformer
            form="rect"
            intensity={4}
            position={[-4, 3, 3]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[3, 7, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2}
            position={[3, 0, 4]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={[1, 8, 1]}
          />
          <Lightformer
            form="rect"
            intensity={3}
            position={[0, 5, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[9, 3, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1}
            position={[0, -3, 4]}
            rotation={[Math.PI / 5, 0, 0]}
            scale={[7, 1, 1]}
          />
          <Lightformer
            form="rect"
            color="#8595b2"
            intensity={1.5}
            position={[-3, 0, -4]}
            scale={[5, 6, 1]}
          />
        </Environment>
      )}
    </>
  );
}
function FitCamera({ hero }: { hero: boolean }) {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const aspect = size.width / size.height;
    const width = hero ? 6.5 : 3.35,
      height = hero ? 3.6 : 3.05;
    camera.position.z =
      Math.max(height, width / aspect) /
      (2 * Math.tan(THREE.MathUtils.degToRad(32 / 2)));
    camera.updateProjectionMatrix();
  }, [camera, size, hero]);
  return null;
}
function Logo({
  reduced,
  onReady,
}: {
  reduced: boolean;
  onReady?: () => void;
}) {
  const outer = useRef<THREE.Group>(null);
  const letters = useRef<(THREE.Group | null)[]>([]);
  const italic = useMemo(
    () =>
      new THREE.Matrix4().set(
        1,
        0.22,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
      ),
    [],
  );
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (outer.current) {
      outer.current.position.y = reduced ? 0 : Math.sin(t * 0.8) * 0.1;
      outer.current.rotation.set(
        0.1 + (reduced ? 0 : Math.sin(t * 0.43) * 0.045),
        -0.28 + (reduced ? 0 : Math.sin(t * 0.5) * 0.09),
        -0.07 + (reduced ? 0 : Math.sin(t * 0.38) * 0.018),
      );
    }
    letters.current.forEach((letter, i) => {
      if (letter) {
        letter.position.y = reduced ? 0 : Math.sin(t * 0.7 + i * 0.8) * 0.018;
        letter.rotation.y = reduced ? 0 : Math.sin(t * 0.46 + i) * 0.018;
      }
    });
  });
  const words = [
    { text: "Les", x: -2.12, y: 0.72, widths: [1.04, 1.1, 1.05] },
    {
      text: "Autres",
      x: -2.8,
      y: -0.75,
      widths: [1.44, 1.06, 0.69, 0.7, 1.1, 1.05],
    },
  ];
  return (
    <group ref={outer}>
      <Center>
        <group matrix={italic} matrixAutoUpdate={false}>
          {words.map((word, row) => {
            let x = word.x;
            return (
              <group key={word.text}>
                {word.text.split("").map((letter, i) => {
                  const anchor = x;
                  x += word.widths[i];
                  return (
                    <group key={i} position={[anchor, word.y, 0]}>
                      <group
                        ref={(node) => {
                          letters.current[row * 3 + i] = node;
                        }}
                      >
                        <Text3D
                          font="/fonts/helvetiker_bold.typeface.json"
                          size={1.38}
                          height={0.34}
                          bevelEnabled
                          bevelThickness={0.035}
                          bevelSize={0.025}
                          bevelSegments={3}
                          curveSegments={10}
                        >
                          <meshPhysicalMaterial
                            attach="material-0"
                            color="#e4e8ee"
                            metalness={1}
                            roughness={0.17}
                            envMapIntensity={1.35}
                            clearcoat={0.65}
                            clearcoatRoughness={0.12}
                          />
                          <meshPhysicalMaterial
                            attach="material-1"
                            color="#657184"
                            metalness={1}
                            roughness={0.11}
                            envMapIntensity={1.2}
                            clearcoat={1}
                            clearcoatRoughness={0.08}
                          />
                          {letter}
                        </Text3D>
                      </group>
                    </group>
                  );
                })}
              </group>
            );
          })}
        </group>
      </Center>
    </group>
  );
}
function Shirt({
  color,
  reduced,
  rotation,
  dragging,
  onReady,
}: {
  color: Colorway;
  reduced: boolean;
  rotation: React.RefObject<Rotation>;
  dragging: React.RefObject<boolean>;
  onReady?: () => void;
}) {
  const { scene } = useGLTF("/models/drop-001.glb");
  const [fontReady, setFontReady] = useState(false);
  const group = useRef<THREE.Group>(null);
  const currentColor = useRef(color);
  const transition = useRef<{
    elapsed: number;
    angle: number;
    endAngle: number;
    manual: boolean;
    fabric: THREE.Color;
    ink: THREE.Color;
    accent: THREE.Color;
  } | null>(null);
  const target = useMemo(
    () => ({
      fabric: new THREE.Color(color.fabric),
      ink: new THREE.Color(color.ink),
      accent: new THREE.Color(color.accent),
    }),
    [color],
  );
  useEffect(() => {
    let live = true;
    loadPrintFont()
      .then(() => {
        if (live) setFontReady(true);
      })
      .catch(() => {
        if (live) setFontReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  const garment = useMemo(() => {
    if (!fontReady) return null;
    let source: THREE.Mesh | null = null;
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !source) source = obj;
    });
    const mesh = source as THREE.Mesh | null;
    if (!mesh) throw new Error("Garment mesh unavailable");
    const surface = garmentMaterial(
      mesh.material as THREE.MeshStandardMaterial,
      currentColor.current,
    );
    return { ...surface, geometry: mesh.geometry };
  }, [scene, fontReady]);
  useEffect(() => {
    if (garment) onReady?.();
  }, [garment, onReady]);
  useEffect(
    () => () => {
      garment?.dispose();
    },
    [garment],
  );
  useEffect(() => {
    if (!garment) return;
    if (currentColor.current.id !== color.id) {
      transition.current = reduced
        ? null
        : {
            elapsed: 0,
            angle: rotation.current.angle,
            endAngle: nextFrontAngle(rotation.current.angle),
            manual: false,
            fabric: garment.material.color.clone(),
            ink: garment.uniforms.printInk.value.clone(),
            accent: garment.uniforms.printAccent.value.clone(),
          };
      if (reduced) {
        garment.material.color.copy(target.fabric);
        garment.uniforms.printInk.value.copy(target.ink);
        garment.uniforms.printAccent.value.copy(target.accent);
      }
      rotation.current.velocity = 0;
      currentColor.current = color;
    }
  }, [color, garment, reduced, rotation, target]);
  useFrame(({ clock }, dt) => {
    if (!group.current || !garment) return;
    const delta = Math.min(dt, 0.05);
    const r = rotation.current;
    const change = transition.current;
    if (change) {
      if (reduced) {
        change.elapsed = COLOR_TURN_SECONDS;
      } else change.elapsed += delta;
      const pose = colorTurn(change.elapsed);
      if (dragging.current) change.manual = true;
      if (!change.manual && !reduced)
        r.angle = THREE.MathUtils.lerp(
          change.angle,
          change.endAngle,
          pose.turn / TURN,
        );
      garment.material.color.lerpColors(change.fabric, target.fabric, pose.mix);
      garment.uniforms.printInk.value.lerpColors(
        change.ink,
        target.ink,
        pose.mix,
      );
      garment.uniforms.printAccent.value.lerpColors(
        change.accent,
        target.accent,
        pose.mix,
      );
      group.current.rotation.z = reduced ? 0 : pose.lean;
      group.current.position.y = reduced ? 0 : pose.lift;
      if (pose.done) {
        transition.current = null;
        r.last = performance.now();
      }
    } else {
      if (!dragging.current) {
        r.angle += r.velocity * delta;
        r.velocity *= Math.exp(-delta * 7);
        if (!reduced && performance.now() - r.last > 3000)
          r.angle += delta * AUTO_TURN_SPEED;
      }
      group.current.rotation.z = 0;
      group.current.position.y = reduced
        ? 0
        : Math.sin(clock.elapsedTime * 0.8) * 0.022;
    }
    group.current.rotation.y = r.angle;
  });
  return garment ? (
    <group ref={group}>
      <mesh
        geometry={garment.geometry}
        material={garment.material}
        dispose={null}
      />
    </group>
  ) : null;
}
/** Lower pixel density on sustained slow rendering. Never replace a healthy animated scene with a still. */
function AdaptiveResolution() {
  const { setDpr, gl } = useThree();
  const sample = useRef({ elapsed: 0, frames: 0, settled: false });
  useFrame((_, delta) => {
    const s = sample.current;
    if (s.settled || document.hidden || delta > 0.15) return;
    s.elapsed += delta;
    s.frames++;
    if (s.elapsed > 5) {
      if (s.frames / s.elapsed < 28) setDpr(0.85);
      s.settled = true;
      gl.domElement.dataset.quality =
        s.frames / s.elapsed < 28 ? "balanced" : "full";
    }
  });
  return null;
}
function ContextMonitor({ onFail }: { onFail?: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handle = (event: Event) => {
      event.preventDefault();
      onFail?.();
    };
    canvas.addEventListener("webglcontextlost", handle);
    return () => canvas.removeEventListener("webglcontextlost", handle);
  }, [gl, onFail]);
  return null;
}
export default function Scene({
  mode,
  color,
  reduced = false,
  active = true,
  onInteract,
  onFail,
  onReady,
}: SceneProps) {
  const rotation = useRef<Rotation>({ angle: -0.1, last: -3000, velocity: 0 });
  const dragging = useRef(false);
  const pointer = useRef({ x: 0, y: 0, time: 0, id: -1, axis: "" });
  function end() {
    dragging.current = false;
    pointer.current.axis = "";
    rotation.current.last = performance.now();
  }
  return (
    <div
      tabIndex={mode === "shirt" ? 0 : undefined}
      role={mode === "shirt" ? "group" : undefined}
      aria-label={
        mode === "shirt"
          ? "Draaibaar T-shirt. Gebruik de pijltjestoetsen links en rechts."
          : undefined
      }
      className={`canvas-wrap ${mode}`}
      data-scene={mode}
      onKeyDown={(e) => {
        if (mode === "shirt" && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          rotation.current.angle += e.key === "ArrowLeft" ? -0.22 : 0.22;
          rotation.current.last = performance.now();
          onInteract?.();
        }
      }}
      onPointerDown={
        mode === "shirt"
          ? (e) => {
              if (!e.isPrimary) return;
              pointer.current = {
                x: e.clientX,
                y: e.clientY,
                time: performance.now(),
                id: e.pointerId,
                axis: "",
              };
              dragging.current = true;
              rotation.current.velocity = 0;
              rotation.current.last = performance.now();
            }
          : undefined
      }
      onPointerMove={
        mode === "shirt"
          ? (e) => {
              if (!dragging.current || e.pointerId !== pointer.current.id)
                return;
              const p = pointer.current;
              const dx = e.clientX - p.x,
                dy = e.clientY - p.y;
              if (!p.axis) {
                if (Math.hypot(dx, dy) < 5) return;
                if (Math.abs(dy) > Math.abs(dx)) {
                  end();
                  return;
                }
                p.axis = "x";
                e.currentTarget.setPointerCapture(e.pointerId);
              }
              const now = performance.now();
              rotation.current.angle += dx * 0.009;
              rotation.current.velocity = THREE.MathUtils.clamp(
                (dx * 0.009) / Math.max(0.016, (now - p.time) / 1000),
                -3,
                3,
              );
              rotation.current.last = now;
              pointer.current = { ...p, x: e.clientX, y: e.clientY, time: now };
              onInteract?.();
            }
          : undefined
      }
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <Canvas
        dpr={[1, 1.25]}
        frameloop={active ? "always" : "never"}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 6], fov: 32 }}
      >
        <FitCamera hero={mode === "hero"} />
        <Studio chrome={mode === "hero"} />
        <ContextMonitor onFail={onFail} />
        <Suspense fallback={null}>
          {mode === "hero" ? (
            <Logo reduced={reduced} onReady={onReady} />
          ) : (
            <Shirt
              color={color}
              reduced={reduced}
              rotation={rotation}
              dragging={dragging}
              onReady={onReady}
            />
          )}
        </Suspense>
        <AdaptiveResolution />
      </Canvas>
    </div>
  );
}
