"use client";
// 3D 赛道场景：解析赛道 SVG 轮廓 -> 闭合曲线 -> 挤出成带状赛道
import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

interface TrackData {
  curve: THREE.CatmullRomCurve3;
}

/** 抓取并解析赛道 SVG，取最长子路径作为主轮廓，居中并归一化到约 10 个单位 */
async function loadTrack(circuitId: string): Promise<TrackData | null> {
  try {
    const res = await fetch(`/tracks/${circuitId}.svg`);
    if (!res.ok) return null;
    const text = await res.text();
    const data = new SVGLoader().parse(text);

    let best: THREE.Vector2[] = [];
    for (const path of data.paths) {
      for (const sub of path.subPaths) {
        const pts = sub.getPoints();
        if (pts.length > best.length) best = pts;
      }
    }
    if (best.length < 8) return null;

    // SVG 的 Y 轴向下，映射到 XZ 平面并镜像，保持与 2D 轮廓一致的朝向
    let pts3 = best.map((p) => new THREE.Vector3(-p.x, 0, p.y));
    const box = new THREE.Box3().setFromPoints(pts3);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = 10 / Math.max(size.x, size.z, 1e-6);
    pts3 = pts3.map((p) => p.sub(center).multiplyScalar(scale));

    return { curve: new THREE.CatmullRomCurve3(pts3, true, "catmullrom", 0.5) };
  } catch {
    return null;
  }
}

/** 沿赛道曲线挤出的扁平带状网格（赛道本体） */
function TrackMesh({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 0.5; // 赛道宽度
    const t = 0.14; // 赛道厚度
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, -t);
    shape.lineTo(-w / 2, -t);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      steps: 600,
      extrudePath: curve,
      bevelEnabled: false,
    });
  }, [curve]);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#f5f5f4" roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

/** 起终点线：沿曲线切线方向放置的红色薄片 */
function StartLine({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const { pos, angle } = useMemo(() => {
    const p = curve.getPointAt(0);
    const tan = curve.getTangentAt(0);
    return { pos: [p.x, 0.02, p.z] as [number, number, number], angle: Math.atan2(tan.x, tan.z) };
  }, [curve]);

  return (
    <mesh position={pos} rotation={[0, angle, 0]}>
      <boxGeometry args={[0.62, 0.03, 0.16]} />
      <meshBasicMaterial color="#e10600" />
    </mesh>
  );
}

export default function Track3DScene({ circuitId }: { circuitId: string }) {
  const [track, setTrack] = useState<TrackData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadTrack(circuitId).then((t) => {
      if (!alive) return;
      if (t) {
        setTrack(t);
        setFailed(false);
      } else {
        setTrack(null);
        setFailed(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [circuitId]);

  if (failed) {
    return (
      <div className="flex h-full items-center justify-center font-display text-[10px] tracking-[0.18em] text-white/30">
        N/A
      </div>
    );
  }
  if (!track) {
    return (
      <div className="flex h-full items-center justify-center font-display text-[10px] tracking-[0.18em] text-white/30">
        LOADING
      </div>
    );
  }

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 8.5, 8.5], fov: 42 }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 12, 4]} intensity={1.3} />
      <directionalLight position={[-6, 8, -6]} intensity={0.4} />
      <TrackMesh curve={track.curve} />
      <StartLine curve={track.curve} />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.8}
        enablePan={false}
        minDistance={6}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
