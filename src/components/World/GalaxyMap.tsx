import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
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
  // Load saved position or default to center
  const [shipPosition] = useState(() => {
    const saved = localStorage.getItem("xenopets-player-position");
    return saved ? JSON.parse(saved) : { x: 50, y: 50 };
  });
  const [nearbyPoint, setNearbyPoint] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNearBoundary, setIsNearBoundary] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate fixed star positions only once
  const stars = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 2,
    }));
  }, []);

  // Load saved map position
  const savedMapPosition = useRef(() => {
    const saved = localStorage.getItem("xenopets-map-position");
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });

  const mapX = useMotionValue(savedMapPosition.current().x);
  const mapY = useMotionValue(savedMapPosition.current().y);
  const shipRotation = useMotionValue(0); // Always start neutral

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

  // Save position continuously and on unmount
  useEffect(() => {
    const savePosition = () => {
      const mapPos = { x: mapX.get(), y: mapY.get() };
      localStorage.setItem("xenopets-map-position", JSON.stringify(mapPos));
    };

    // Save position every 2 seconds when not dragging
    const interval = setInterval(() => {
      if (!isDragging) {
        savePosition();
      }
    }, 2000);

    // Save position on unmount
    return () => {
      clearInterval(interval);
      savePosition();
    };
  }, [mapX, mapY, isDragging]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = useCallback(
    (event: any, info: any) => {
      if (!containerRef.current) return;

      const deltaX = info.delta.x;
      const deltaY = info.delta.y;

      // Update map position
      const newX = mapX.get() + deltaX;
      const newY = mapY.get() + deltaY;

      // Check boundary proximity
      const boundaryThreshold = 50; // Distance from boundary to trigger warning
      const isNearX = newX <= -350 || newX >= 350;
      const isNearY = newY <= -350 || newY >= 350;
      setIsNearBoundary(isNearX || isNearY);

      // Only calculate rotation if there's significant movement
      // This prevents erratic rotation when mouse is held but not moving
      const movementThreshold = 2;
      const movementMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (movementMagnitude > movementThreshold) {
        // Calculate ship rotation based on movement direction
        // Ship should point in the direction it's moving
        // When dragging up (deltaY negative), ship points up
        // When dragging right (deltaX positive), ship points right, etc.
        // Note: We negate deltaY because in screen coordinates, positive Y is down
        // Negate deltaX to fix left/right inversion
        // Add 90 degrees to correct the orientation (ship image seems to be rotated)
        const angle = Math.atan2(-deltaY, -deltaX) * (180 / Math.PI) + 90;
        animate(shipRotation, angle, { duration: 0.2 });
      }

      mapX.set(newX);
      mapY.set(newY);
    },
    [mapX, mapY, shipRotation],
  );

  const handleDragEnd = () => {
    setIsDragging(false);
    // Keep current rotation - ship maintains the direction it was moving

    // Save current map position
    const mapPos = { x: mapX.get(), y: mapY.get() };
    localStorage.setItem("xenopets-map-position", JSON.stringify(mapPos));
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
      className={`relative w-full h-[500px] bg-gradient-to-br from-gray-950 via-slate-900 to-black rounded-2xl overflow-hidden ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ userSelect: "none" }}
    >
      {/* Movement Boundary Indicator */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {/* Boundary rectangle */}
        <motion.div
          className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 rounded-lg transition-colors duration-300 ${
            isNearBoundary
              ? "border-red-400/60 shadow-lg shadow-red-400/20"
              : "border-cyan-400/30"
          }`}
          animate={{
            borderWidth: isNearBoundary ? 3 : 2,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Corner indicators */}
          <motion.div
            className={`absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 transition-colors duration-300 ${
              isNearBoundary ? "border-red-400" : "border-cyan-400"
            }`}
            animate={{
              scale: isNearBoundary ? 1.2 : 1,
            }}
          />
          <motion.div
            className={`absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 transition-colors duration-300 ${
              isNearBoundary ? "border-red-400" : "border-cyan-400"
            }`}
            animate={{
              scale: isNearBoundary ? 1.2 : 1,
            }}
          />
          <motion.div
            className={`absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 transition-colors duration-300 ${
              isNearBoundary ? "border-red-400" : "border-cyan-400"
            }`}
            animate={{
              scale: isNearBoundary ? 1.2 : 1,
            }}
          />
          <motion.div
            className={`absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 transition-colors duration-300 ${
              isNearBoundary ? "border-red-400" : "border-cyan-400"
            }`}
            animate={{
              scale: isNearBoundary ? 1.2 : 1,
            }}
          />

          {/* Pulsing boundary effect */}
          <motion.div
            className={`absolute inset-0 border-2 rounded-lg transition-colors duration-300 ${
              isNearBoundary ? "border-red-400/40" : "border-cyan-400/20"
            }`}
            animate={{
              scale: [1, 1.02, 1],
              opacity: isNearBoundary ? [0.6, 1, 0.6] : [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: isNearBoundary ? 1 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Boundary label */}
        <motion.div
          className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-xs backdrop-blur-sm border transition-colors duration-300 ${
            isNearBoundary
              ? "bg-red-900/60 text-red-400 border-red-400/30"
              : "bg-black/60 text-cyan-400 border-cyan-400/30"
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: isNearBoundary ? 1.05 : 1,
          }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {isNearBoundary ? "Limite de Navegação!" : "Área de Navegação"}
        </motion.div>
      </motion.div>

      {/* Stars background */}
      <div
        className={`absolute inset-0 opacity-80 ${isDragging ? "pointer-events-none" : ""}`}
      >
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animation: `twinkle ${star.animationDuration}s ease-in-out ${star.animationDelay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Galaxy background nebulae */}
      <div
        className={`absolute inset-0 ${isDragging ? "pointer-events-none" : ""}`}
      >
        <div
          className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{
            background: "radial-gradient(circle, #374151, #1f2937)",
            left: "20%",
            top: "30%",
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-8 blur-2xl"
          style={{
            background: "radial-gradient(circle, #1f2937, #111827)",
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
            isDragging={isDragging}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
            }}
          />
        ))}
      </motion.div>

      {/* Player ship - fixed position in center */}
      <div
        className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 ${isDragging ? "pointer-events-none" : ""}`}
      >
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
          className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-green-400/30 ${isDragging ? "pointer-events-none" : ""}`}
        >
          <div className="text-green-400 font-medium">
            {GALAXY_POINTS.find((p) => p.id === nearbyPoint)?.name}
          </div>
          <div className="text-xs text-gray-300">Clique para explorar</div>
        </motion.div>
      )}

      {/* Navigation hint */}
      <div
        className={`absolute top-4 right-4 text-white/60 text-xs bg-black/40 px-3 py-2 rounded-lg backdrop-blur-sm ${isDragging ? "pointer-events-none" : ""}`}
      >
        Arraste para navegar
      </div>
    </div>
  );
};
