"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Text3D, ContactShadows, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { Colorway } from "@/lib/catalog";
function HeroFit() {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.position.z = (8.1 / (size.width / size.height) / 0.573) * 1.08;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}
function Lights() {
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[-4, 6, 5]} intensity={3} />
      <directionalLight position={[4, 1, -3]} intensity={0.8} />
    </>
  );
}
function Letters({
  reduced,
  onReady,
}: {
  reduced: boolean;
  onReady?: () => void;
}) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((g, i) => {
      if (g) {
        g.position.x = reduced
          ? 0
          : Math.sin(clock.elapsedTime * 0.4 + i) * 0.015;
        g.rotation.z = reduced
          ? 0
          : Math.sin(clock.elapsedTime * 0.25 + i) * 0.012;
        g.position.y = reduced
          ? 0
          : Math.sin(clock.elapsedTime * 0.55 + i * 1.7) * 0.045;
        g.rotation.y = reduced
          ? 0
          : Math.sin(clock.elapsedTime * 0.3 + i) * 0.04;
      }
    });
  });
  return (
    <Center>
      <group rotation={[0.04, -0.08, -0.035]}>
        {"LES AUTRES".split("").map((letter, i) => (
          <group key={i} position={[i * 0.79, 0, 0]}>
            <group
              ref={(el) => {
                refs.current[i] = el;
              }}
            >
              <Text3D
                font="/fonts/helvetiker_bold.typeface.json"
                size={0.9}
                height={0.17}
                bevelEnabled
                bevelSize={0.012}
                bevelThickness={0.015}
                curveSegments={8}
              >
                <meshStandardMaterial color="#efede6" roughness={0.85} />
                {letter}
              </Text3D>
            </group>
          </group>
        ))}
      </group>
    </Center>
  );
}
function texture(color: Colorway, back: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color.fabric;
  ctx.fillRect(0, 0, 1024, 1024);
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 40000; i++) {
    ctx.fillStyle =
      rand() > 0.5 ? "rgba(255,255,255,.065)" : "rgba(0,0,0,.045)";
    ctx.fillRect(rand() * 1024, rand() * 1024, 1, 2);
  }
  ctx.textAlign = "center";
  if (back) {
    ctx.fillStyle = color.ink;
    ctx.font = "italic 900 40px Arial";
    ctx.fillText("Les", 512, 205);
    ctx.fillText("Autres", 512, 239);
  } else {
    const lines = ["BADDIES", "IN BELGICA,", "HOLLANDA,", "FRANSA,", "ESPAGNA"];
    lines.forEach((line, i) => {
      ctx.font = `900 ${i === 0 ? 115 : 89}px Impact, Arial Narrow, sans-serif`;
      ctx.fillStyle = i === 0 ? color.accent : color.ink;
      ctx.save();
      ctx.translate(512, 350 + i * 83);
      ctx.scale(0.72, 1);
      ctx.fillText(line, 0, 0);
      ctx.restore();
    });
    ctx.fillStyle = color.fabric;
    for (let i = 0; i < 1600; i++)
      ctx.fillRect(
        345 + rand() * 334,
        265 + rand() * 427,
        rand() * 2,
        rand() * 4,
      );
    ctx.fillStyle = "#171717";
    ctx.fillRect(687, 910, 44, 58);
    ctx.fillStyle = "#eee";
    ctx.font = "italic bold 12px Arial";
    ctx.fillText("Les", 709, 933);
    ctx.fillText("Autres", 709, 947);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  t.anisotropy = 4;
  return t;
}
function Garment({
  color,
  rotation,
  reduced,
  dragging,
  onReady,
}: {
  onReady?: () => void;
  color: Colorway;
  rotation: React.RefObject<{ angle: number; last: number; velocity: number }>;
  reduced: boolean;
  dragging: React.RefObject<boolean>;
}) {
  const { scene } = useGLTF("/shirt.glb");
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  const group = useRef<THREE.Group>(null);
  const model = useMemo(() => scene.clone(true), [scene]);
  const maps = useMemo(
    () => [texture(color, false), texture(color, true)],
    [color],
  );
  useEffect(() => {
    model.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const old = obj.material;
        obj.material = new THREE.MeshStandardMaterial({
          map:
            obj.name === "collar" || obj.name === "seams"
              ? null
              : maps[obj.name === "back" ? 1 : 0],
          color:
            obj.name === "collar" || obj.name === "seams"
              ? color.fabric
              : "#ffffff",
          roughness: 1,
          side: THREE.DoubleSide,
        });
        if (old?.userData?.owned) old.dispose();
        obj.material.userData.owned = true;
      }
    });
    return () => {
      maps.forEach((t) => t.dispose());
      model.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material.userData.owned)
          o.material.dispose();
      });
    };
  }, [model, maps]);
  useFrame((_, delta) => {
    if (!group.current) return;
    const r = rotation.current;
    if (!dragging.current) {
      r.angle += r.velocity;
      r.velocity *= 0.9;
      if (!reduced && Date.now() - r.last > 3000) r.angle += delta * 0.16;
    }
    group.current.rotation.y = r.angle;
  });
  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}
export default function Scene({
  mode,
  color,
  reduced = false,
  onInteract,
  onFail,
  onReady,
}: {
  mode: "hero" | "shirt";
  color: Colorway;
  reduced?: boolean;
  onInteract?: () => void;
  onFail?: () => void;
  onReady?: () => void;
}) {
  const rotation = useRef({ angle: -0.13, last: Date.now(), velocity: 0 });
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const frames = useRef({ n: 0, time: 0 });
  return (
    <div
      tabIndex={mode === "shirt" ? 0 : undefined}
      role={mode === "shirt" ? "group" : undefined}
      aria-label={
        mode === "shirt"
          ? "Draaibaar T-shirt. Gebruik de pijltjestoetsen links en rechts."
          : undefined
      }
      onKeyDown={(e) => {
        if (
          mode === "shirt" &&
          (e.key === "ArrowLeft" || e.key === "ArrowRight")
        ) {
          e.preventDefault();
          rotation.current.angle += e.key === "ArrowLeft" ? -0.2 : 0.2;
          rotation.current.last = Date.now();
          onInteract?.();
        }
      }}
      className={`canvas-wrap ${mode}`}
      onPointerDown={
        mode === "shirt"
          ? (e) => {
              start.current = { x: e.clientX, y: e.clientY };
              dragging.current = true;
              rotation.current.last = Date.now();
              rotation.current.velocity = 0;
            }
          : undefined
      }
      onPointerMove={
        mode === "shirt"
          ? (e) => {
              if (!dragging.current) return;
              const dx = e.clientX - start.current.x;
              const dy = e.clientY - start.current.y;
              if (Math.abs(dy) > Math.abs(dx) * 1.4) {
                dragging.current = false;
                return;
              }
              rotation.current.angle += dx * 0.009;
              rotation.current.velocity = dx * 0.001;
              rotation.current.last = Date.now();
              start.current = { x: e.clientX, y: e.clientY };
              onInteract?.();
            }
          : undefined
      }
      onPointerUp={() => {
        dragging.current = false;
        rotation.current.last = Date.now();
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
      onPointerLeave={() => {
        dragging.current = false;
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          position: [0, 0, mode === "hero" ? 9 : 5.2],
          fov: mode === "hero" ? 32 : 34,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", () => onFail?.());
        }}
      >
        <Lights />
        {mode === "hero" && <HeroFit />}
        <Suspense fallback={null}>
          {mode === "hero" ? (
            <Letters reduced={reduced} onReady={onReady} />
          ) : (
            <>
              <Garment
                onReady={onReady}
                color={color}
                rotation={rotation}
                reduced={reduced}
                dragging={dragging}
              />
              <ContactShadows
                position={[0, -1.55, 0]}
                opacity={0.5}
                scale={7}
                blur={2.7}
                far={3}
                frames={1}
              />
            </>
          )}
        </Suspense>
        <PerformanceWatch frames={frames} onFail={onFail} />
      </Canvas>
    </div>
  );
}
function PerformanceWatch({
  frames,
  onFail,
}: {
  frames: React.RefObject<{ n: number; time: number }>;
  onFail?: () => void;
}) {
  useFrame((_, delta) => {
    const f = frames.current;
    if (document.hidden || delta > 0.2) {
      f.n = 0;
      f.time = 0;
      return;
    }
    f.n++;
    f.time += delta;
    if (f.n >= 180) {
      if (f.time > 12) onFail?.();
      f.n = 0;
      f.time = 0;
    }
  });
  return null;
}
