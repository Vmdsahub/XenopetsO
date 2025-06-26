import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { PlayerShip } from "./PlayerShip";
import { MapPoint } from "./MapPoint";

interface GalaxyMapProps {
  onPointClick: (pointId: string, pointData: any) => void;
}

interface MapPointData {
  id: string;
  x: number;
  y: number;
  name: string;
  type: "planet" | "station" | "nebula" | "asteroid";
  description: string;
  image?: string;
}

const GALAXY_POINTS: MapPointData[] = [
  {
    id: "terra-nova",
    x: 30,
    y: 40,
    name: "Terra Nova",
    type: "planet",
    description: "Um planeta verdejante cheio de vida",
    image:
      "https://images.pexels.com/photos/87651/earth-blue-planet-globe-planet-87651.jpeg",
  },
  {
    id: "estacao-omega",
    x: 70,
    y: 25,
    name: "Estação Omega",
    type: "station",
    description: "Centro comercial da galáxia",
    image: "https://images.pexels.com/photos/2156/sky-earth-space-working.jpg",
  },
  {
    id: "nebulosa-crimson",
    x: 20,
    y: 70,
    name: "Nebulosa Crimson",
    type: "nebula",
    description: "Uma nebulosa misteriosa com energia estranha",
    image: "https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg",
  },
  {
    id: "campo-asteroides",
    x: 85,
    y: 60,
    name: "Campo de Asteroides",
    type: "asteroid",
    description: "Rico em recursos minerais raros",
    image: "https://images.pexels.com/photos/2159/flight-sky-earth-space.jpg",
  },
  {
    id: "mundo-gelado",
    x: 45,
    y: 15,
    name: "Mundo Gelado",
    type: "planet",
    description: "Planeta coberto de gelo eterno",
    image: "https://images.pexels.com/photos/220201/pexels-photo-220201.jpeg",
  },
];

export const GalaxyMap: React.FC<GalaxyMapProps> = ({ onPointClick }) => {
  const [shipPosition, setShipPosition] = useState({ x: 50, y: 50 });
  const [nearbyPoint, setNearbyPoint] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mapX = useMotionValue(0);
  const mapY = useMotionValue(0);
  const shipRotation = useMotionValue(0);

  // Check proximity to points
  const checkProximity = useCallback(() => {
    const threshold = 8; // Distance threshold for proximity
    let closest: string | null = null;
    let closestDistance = Infinity;

    GALAXY_POINTS.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(shipPosition.x - point.x, 2) +
          Math.pow(shipPosition.y - point.y, 2),
      );

      if (distance < threshold && distance < closestDistance) {
        closest = point.id;
        closestDistance = distance;
      }
    });

    setNearbyPoint(closest);
  }, [shipPosition]);

  useEffect(() => {
    checkProximity();
  }, [checkProximity]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = useCallback(
    (event: any, info: any) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = info.delta.x;
      const deltaY = info.delta.y;

      // Calculate ship rotation based on drag direction
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      animate(shipRotation, angle, { duration: 0.2 });

      // Update map position
      mapX.set(mapX.get() + deltaX);
      mapY.set(mapY.get() + deltaY);
    },
    [mapX, mapY, shipRotation],
  );

  const handleDragEnd = () => {
    setIsDragging(false);
    // Reset ship rotation gradually
    animate(shipRotation, 0, { duration: 0.5 });
  };

  const handlePointClick = (pointId: string) => {
    const point = GALAXY_POINTS.find((p) => p.id === pointId);
    if (point) {
      onPointClick(pointId, point);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-96 bg-gradient-to-br from-indigo-900 via-purple-900 to-black rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing"
    >
      {/* Stars background */}
      <div className="absolute inset-0 opacity-60">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Galaxy background nebulae */}
      <div className="absolute inset-0">
        <div
          className="absolute w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #ec4899, #8b5cf6)",
            left: "20%",
            top: "30%",
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-15 blur-2xl"
          style={{
            background: "radial-gradient(circle, #06b6d4, #3b82f6)",
            right: "25%",
            bottom: "20%",
          }}
        />
      </div>

      {/* Draggable galaxy map */}
      <motion.div
        ref={mapRef}
        className="absolute inset-0 w-[200%] h-[200%] -left-1/2 -top-1/2"
        style={{ x: mapX, y: mapY }}
        drag
        dragConstraints={{
          left: -400,
          right: 400,
          top: -400,
          bottom: 400,
        }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: "grabbing" }}
      >
        {/* Galaxy points */}
        {GALAXY_POINTS.map((point) => (
          <MapPoint
            key={point.id}
            point={point}
            isNearby={nearbyPoint === point.id}
            onClick={() => handlePointClick(point.id)}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
            }}
          />
        ))}
      </motion.div>

      {/* Player ship - fixed position in center */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <PlayerShip
          rotation={shipRotation}
          isNearPoint={nearbyPoint !== null}
          isDragging={isDragging}
        />
      </div>

      {/* Nearby point indicator */}
      {nearbyPoint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-green-400/30"
        >
          <div className="text-green-400 font-medium">
            {GALAXY_POINTS.find((p) => p.id === nearbyPoint)?.name}
          </div>
          <div className="text-xs text-gray-300">Clique para explorar</div>
        </motion.div>
      )}

      {/* Navigation hint */}
      <div className="absolute top-4 right-4 text-white/60 text-xs bg-black/40 px-3 py-2 rounded-lg backdrop-blur-sm">
        Arraste para navegar
      </div>
    </div>
  );
};
