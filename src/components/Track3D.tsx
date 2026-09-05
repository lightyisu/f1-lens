"use client";
// 3D 赛道查看器：客户端懒加载封装（three 依赖浏览器 API，不做 SSR）
import dynamic from "next/dynamic";

const Track3DScene = dynamic(() => import("./Track3DScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-display text-[10px] tracking-[0.18em] text-white/30">
      LOADING
    </div>
  ),
});

export default function Track3D({ circuitId }: { circuitId: string }) {
  return <Track3DScene circuitId={circuitId} />;
}
