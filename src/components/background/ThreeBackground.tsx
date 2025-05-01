'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { random } from 'maath';

function Stars({ count = 3000, color = "#4A88B3", size = 0.01, opacity = 0.4 }) {
  const ref = useRef<THREE.Points>(null!);
  const sphere = random.inSphere(new Float32Array(count * 3), { radius: 1.5 }) as Float32Array;

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 20;
    ref.current.rotation.y -= delta / 25;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points
        ref={ref}
        positions={sphere}
        stride={3}
        frustumCulled={false}
      >
        <PointMaterial
          transparent
          color={color}
          size={size}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={opacity}
        />
      </Points>
    </group>
  );
}

function SubtleStars() {
  // Create multiple star layers with subtle professional colors
  return (
    <>
      <Stars count={1500} color="#4A88B3" size={0.008} opacity={0.3} />
      <Stars count={1000} color="#2D5670" size={0.006} opacity={0.2} />
    </>
  );
}

function Grid() {
  const gridRef = useRef<THREE.GridHelper>(null!);
  
  useFrame((state, delta) => {
    gridRef.current.position.z += delta * 0.1;
    if (gridRef.current.position.z > 1) {
      gridRef.current.position.z = 0;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[30, 30, '#1A2536', '#1A2536']}
      position={[0, -0.5, 0]}
    />
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-[#0D1117] to-[#161B22]">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ambientLight intensity={0.2} />
        <SubtleStars />
        <Grid />
      </Canvas>
      <div className="absolute top-[20%] left-[15%] w-96 h-96 blob opacity-20" 
           style={{ background: 'radial-gradient(circle, rgba(74, 136, 179, 0.08) 0%, rgba(74, 136, 179, 0) 70%)', animationDuration: '30s' }} />
      <div className="absolute top-[60%] left-[60%] w-80 h-80 blob opacity-10" 
           style={{ background: 'radial-gradient(circle, rgba(45, 86, 112, 0.08) 0%, rgba(45, 86, 112, 0) 70%)', animationDuration: '40s' }} />
      <div className="absolute inset-0 grid-pattern opacity-5" />
    </div>
  );
} 