import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Building } from '@workspace/api-client-react';
import './three-d-master-plan.css';

type ThreeDMasterPlanProps = {
  buildings: Building[];
  selectedBuildingId: string;
  arabic: boolean;
  onSelectBuilding: (buildingId: string) => void;
};

type MasterPlanSceneProps = Pick<ThreeDMasterPlanProps, 'buildings' | 'selectedBuildingId' | 'onSelectBuilding'>;

const TREE_POSITIONS: ReadonlyArray<readonly [number, number, number]> = [
  [-8.4, 0, -5.2], [-7.1, 0, -4.9], [-5.8, 0, -5.5], [-4.5, 0, -5.1],
  [4.8, 0, -5.4], [6.2, 0, -5], [7.6, 0, -5.5], [8.8, 0, -4.8],
  [-8.7, 0, 4.9], [-7.3, 0, 5.4], [-5.9, 0, 4.9], [-4.4, 0, 5.3],
  [4.4, 0, 5.2], [5.9, 0, 4.8], [7.4, 0, 5.4], [8.7, 0, 4.9],
  [-9.1, 0, -1.5], [-8.7, 0, 0], [-9, 0, 1.6],
  [9, 0, -1.7], [8.8, 0, 0], [9.1, 0, 1.6],
];

const GARDEN_PATCHES: ReadonlyArray<readonly [number, number, number, number]> = [
  [-6.6, -2.6, 3.6, 2.1],
  [6.5, -2.7, 3.8, 2.3],
  [-6.4, 2.7, 4, 2.2],
  [6.5, 2.8, 3.8, 2.1],
  [0, 0, 3.7, 3.3],
];

function CameraControls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 13;
    controls.maxDistance = 34;
    controls.minPolarAngle = Math.PI * 0.17;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.enablePan = true;
    controls.panSpeed = 0.65;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.8;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    controls.update();
    controlsRef.current = controls;
    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useFrame(() => controlsRef.current?.update());
  return null;
}

function Tree({ position, scale = 1 }: { position: readonly [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.08, 0.44, 6]} />
        <meshStandardMaterial color="#927d60" roughness={1} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <icosahedronGeometry args={[0.31, 1]} />
        <meshStandardMaterial color="#84947a" roughness={0.92} />
      </mesh>
      <mesh position={[0.13, 0.78, -0.04]} castShadow>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial color="#9aa58a" roughness={0.95} />
      </mesh>
    </group>
  );
}

function BuildingMass({
  building,
  selected,
  onSelectBuilding,
}: {
  building: Building;
  selected: boolean;
  onSelectBuilding: (buildingId: string) => void;
}) {
  const height = Math.max(0.72, Math.min(building.floors, 18) * 0.14);
  const x = (Math.max(0, Math.min(100, building.x)) - 50) * 0.2;
  const z = (Math.max(0, Math.min(100, building.y)) - 50) * 0.145;
  const material = selected ? '#d6b27f' : '#d6d2c4';

  return (
    <group position={[x, 0, z]} onClick={(event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onSelectBuilding(building.id);
    }}>
      <mesh position={[0, 0.075, 0]} receiveShadow>
        <boxGeometry args={[1.5, 0.15, 1.25]} />
        <meshStandardMaterial color={selected ? '#d9c9a9' : '#bbb8a8'} roughness={0.92} />
      </mesh>
      <mesh position={[0, height / 2 + 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.12, height, 0.9]} />
        <meshStandardMaterial color={material} roughness={0.78} metalness={0.02} />
      </mesh>
      <mesh position={[0, height + 0.18, 0]} castShadow>
        <boxGeometry args={[1.2, 0.08, 0.98]} />
        <meshStandardMaterial color={selected ? '#b78b58' : '#a8a797'} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.18, 0.463]}>
        <boxGeometry args={[0.68, Math.max(0.22, height - 0.14), 0.018]} />
        <meshStandardMaterial color={selected ? '#879b8a' : '#91a094'} roughness={0.45} metalness={0.08} />
      </mesh>
      {selected && (
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.91, 1.03, 40]} />
          <meshBasicMaterial color="#6e8069" transparent opacity={0.82} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function MasterPlanScene({ buildings, selectedBuildingId, onSelectBuilding }: MasterPlanSceneProps) {
  const geometries = useMemo(() => ({
    terrain: new THREE.BoxGeometry(23, 0.22, 16),
    road: new THREE.BoxGeometry(24, 0.06, 1.25),
    crossRoad: new THREE.BoxGeometry(1.25, 0.06, 16),
    sidewalk: new THREE.BoxGeometry(24, 0.045, 0.22),
    patch: new THREE.BoxGeometry(1, 0.05, 1),
  }), []);

  useEffect(() => () => {
    Object.values(geometries).forEach((geometry) => geometry.dispose());
  }, [geometries]);

  return (
    <>
      <color attach="background" args={['#dce0d3']} />
      <fog attach="fog" args={['#dce0d3', 24, 48]} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[-8, 15, 9]} intensity={2.25} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <hemisphereLight args={['#f7f4e9', '#98a18d', 0.75]} />
      <mesh geometry={geometries.terrain} position={[0, -0.15, 0]} receiveShadow>
        <meshStandardMaterial color="#d4d5c4" roughness={1} />
      </mesh>
      {GARDEN_PATCHES.map(([x, z, width, depth], index) => (
        <mesh key={`garden-${index}`} geometry={geometries.patch} position={[x, 0.005, z]} scale={[width, 1, depth]} receiveShadow>
          <meshStandardMaterial color={index === 4 ? '#b9c1a5' : '#c0c7ae'} roughness={1} />
        </mesh>
      ))}
      <mesh geometry={geometries.road} position={[0, 0.012, 0]} receiveShadow>
        <meshStandardMaterial color="#b8b8aa" roughness={1} />
      </mesh>
      <mesh geometry={geometries.crossRoad} position={[0, 0.014, 0]} receiveShadow>
        <meshStandardMaterial color="#b8b8aa" roughness={1} />
      </mesh>
      {[-0.74, 0.74].map((z) => (
        <mesh key={`sidewalk-h-${z}`} geometry={geometries.sidewalk} position={[0, 0.05, z]}>
          <meshStandardMaterial color="#e6e1d2" roughness={1} />
        </mesh>
      ))}
      {[-0.74, 0.74].map((x) => (
        <mesh key={`sidewalk-v-${x}`} geometry={geometries.sidewalk} position={[x, 0.052, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#e6e1d2" roughness={1} />
        </mesh>
      ))}
      {TREE_POSITIONS.map((position, index) => <Tree key={`tree-${index}`} position={position} scale={index % 3 === 0 ? 1.12 : 1} />)}
      {buildings.map((building) => (
        <BuildingMass
          key={building.id}
          building={building}
          selected={building.id === selectedBuildingId}
          onSelectBuilding={onSelectBuilding}
        />
      ))}
      <CameraControls />
    </>
  );
}

export default function ThreeDMasterPlan({
  buildings,
  selectedBuildingId,
  arabic,
  onSelectBuilding,
}: ThreeDMasterPlanProps) {
  const canvasFallback = (
    <div className="vivid-3d-fallback" role="status" data-testid="status-3d-unavailable">
      {arabic
        ? 'العرض ثلاثي الأبعاد غير متاح على هذا الجهاز. استخدم المخطط ثنائي الأبعاد للمتابعة.'
        : '3D is unavailable on this device. Use the 2D plan to continue.'}
    </div>
  );

  return (
    <section className="vivid-master-plan" dir={arabic ? 'rtl' : 'ltr'} aria-label={arabic ? 'المخطط ثلاثي الأبعاد' : 'Three-dimensional master plan'}>
      <div className="vivid-master-plan__stage" data-testid="scene-master-plan">
        <Canvas
          camera={{ position: [0, 19, 22], fov: 38, near: 0.1, far: 100 }}
          shadows
          dpr={[1, 1.5]}
          fallback={canvasFallback}
          gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
          aria-label={arabic ? 'مشهد تفاعلي للمخطط السكني' : 'Interactive residential master plan scene'}
        >
          <MasterPlanScene
            buildings={buildings}
            selectedBuildingId={selectedBuildingId}
            onSelectBuilding={onSelectBuilding}
          />
        </Canvas>
        <div className="vivid-master-plan__caption" aria-hidden="true">
          <span>{arabic ? 'تصور توضيحي · غير مقياس' : 'ILLUSTRATIVE · NOT TO SCALE'}</span>
          <span>{arabic ? 'اسحب للتدوير · قرّب للتفاصيل' : 'DRAG TO ORBIT · PINCH TO ZOOM'}</span>
        </div>
      </div>
      <div className="vivid-master-plan__selection">
        <div className="vivid-master-plan__selection-heading">
          <span className="vivid-master-plan__kicker">{arabic ? 'اختر مبنى' : 'SELECT A BUILDING'}</span>
          <span className="vivid-master-plan__count">{buildings.length} {arabic ? 'مبانٍ' : 'BUILDINGS'}</span>
        </div>
        {buildings.length > 0 ? (
          <div className="vivid-master-plan__building-list" role="group" aria-label={arabic ? 'اختيار مبنى' : 'Building selection'}>
            {buildings.map((building) => {
              const selected = building.id === selectedBuildingId;
              const label = arabic
                ? `${building.name}، ${building.floors} طوابق، ${building.availableUnits} منزل متاح`
                : `${building.name}, ${building.floors} floors, ${building.availableUnits} homes available`;
              return (
                <button
                  key={building.id}
                  type="button"
                  className={`vivid-master-plan__building-option${selected ? ' is-selected' : ''}`}
                  onClick={() => onSelectBuilding(building.id)}
                  aria-label={label}
                  aria-pressed={selected}
                  data-testid={`button-3d-building-${building.id}`}
                >
                  <span className="vivid-master-plan__building-name">{building.name}</span>
                  <span className="vivid-master-plan__building-meta">
                    {arabic
                      ? `${building.floors} طوابق · ${building.availableUnits} متاح`
                      : `${building.floors} FLOORS · ${building.availableUnits} AVAILABLE`}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="vivid-master-plan__empty" role="status" data-testid="status-no-3d-buildings">
            {arabic ? 'لا توجد مبانٍ لعرضها حالياً.' : 'No buildings to display yet.'}
          </div>
        )}
      </div>
    </section>
  );
}
