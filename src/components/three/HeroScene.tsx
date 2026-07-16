"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function Blob() {
  const mesh = useRef<Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const spin = useRef(0);
  const scale = useRef(1);

  useFrame((state) => {
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
    if (!mesh.current) return;

    spin.current *= 0.94;
    scale.current += (1 - scale.current) * 0.12;
    mesh.current.scale.setScalar(scale.current);

    mesh.current.rotation.x += 0.0015;
    mesh.current.rotation.y += 0.002 + spin.current;
    mesh.current.rotation.y += pointer.current.x * 0.002;
    mesh.current.rotation.x += pointer.current.y * 0.001;
  });

  const handleClick = () => {
    spin.current += 0.35;
    scale.current = 1.18;
  };

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={mesh} onClick={handleClick}>
        <icosahedronGeometry args={[1.6, 12]} />
        <MeshDistortMaterial
          color="#ff5a36"
          distort={0.45}
          speed={2}
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={1.2} />
      <Blob />
    </Canvas>
  );
}
