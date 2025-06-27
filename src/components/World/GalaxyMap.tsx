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

// Navigation limits configuration - single source of truth
// Container-based navigation limits that scale with container size
const NAVIGATION_CONFIG = {
  // Navigation area as percentage of container size - unified values (circular boundary)
  horizontalRatio: 2.0, // 200% of container width for navigation (significantly increased)
  verticalRatio: 2.0, // 200% of container height for navigation (significantly increased)
  boundaryThreshold: 5, // threshold for boundary proximity warning
  minContainerSize: 500, // minimum container size for calculations
} as const;

// Calculate navigation limits based on container dimensions
const getNavigationLimits = (
  containerWidth: number,
  containerHeight: number,
) => {
  // Ensure minimum sizes for calculations
  const effectiveWidth = Math.max(
    containerWidth,
    NAVIGATION_CONFIG.minContainerSize,
  );
  const effectiveHeight = Math.max(
    containerHeight,
    NAVIGATION_CONFIG.minContainerSize,
  );

  // Calculate limits as percentage of container size - ensuring they're always equal for uniform navigation
  const baseLimit = Math.min(
    (effectiveWidth * NAVIGATION_CONFIG.horizontalRatio) / 2,
    (effectiveHeight * NAVIGATION_CONFIG.verticalRatio) / 2,
  );

  return {
    horizontal: baseLimit,
    vertical: baseLimit, // Always equal to horizontal for uniform navigation
    boundaryThreshold: NAVIGATION_CONFIG.boundaryThreshold,
  };
};
// Calculate boundary circle dimensions based on map size and constraints
// Map is 200% (2x) of container size, positioned at -50% offset with circular boundary
const getBoundaryDimensions = (
  containerWidth: number,
  containerHeight: number,
) => {
  const limits = getNavigationLimits(containerWidth, containerHeight);

  // Map total dimensions
  const mapWidth = containerWidth * 2;
  const mapHeight = containerHeight * 2;

  // Available movement range (constraint * 2) - circular boundary
  const radius = Math.min(limits.horizontal, limits.vertical);
  const circleDiameter = radius * 2;

  // Calculate boundary circle as percentage of map
  const boundaryWidthPercent = (circleDiameter / mapWidth) * 100;
  const boundaryHeightPercent = (circleDiameter / mapHeight) * 100;

  // Center the boundary in the map
  const boundaryLeftPercent = (100 - boundaryWidthPercent) / 2;
  const boundaryTopPercent = (100 - boundaryHeightPercent) / 2;

  return {
    left: `${boundaryLeftPercent}%`,
    top: `${boundaryTopPercent}%`,
    width: `${boundaryWidthPercent}%`,
    height: `${boundaryHeightPercent}%`,
    radius: radius,
  };
};

const GALAXY_POINTS: MapPointData[] = [
  {
    id: "terra-nova",
    x: 40,
    y: 45,
    name: "Terra Nova",
    type: "planet",
    description: "Um planeta verdejante cheio de vida",
    image:
      "https://images.pexels.com/photos/87651/earth-blue-planet-globe-planet-87651.jpeg",
  },
  {
    id: "estacao-omega",
    x: 60,
    y: 35,
    name: "Estação Omega",
    type: "station",
    description: "Centro comercial da galáxia",
    image: "https://images.pexels.com/photos/2156/sky-earth-space-working.jpg",
  },
  {
    id: "nebulosa-crimson",
    x: 30,
    y: 65,
    name: "Nebulosa Crimson",
    type: "nebula",
    description: "Uma nebulosa misteriosa com energia estranha",
    image: "https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg",
  },
  {
    id: "campo-asteroides",
    x: 70,
    y: 55,
    name: "Campo de Asteroides",
    type: "asteroid",
    description: "Rico em recursos minerais raros",
    image: "https://images.pexels.com/photos/2159/flight-sky-earth-space.jpg",
  },
  {
    id: "mundo-gelado",
    x: 50,
    y: 25,
    name: "Mundo Gelado",
    type: "planet",
    description: "Planeta coberto de gelo eterno",
    image: "https://images.pexels.com/photos/220201/pexels-photo-220201.jpeg",
  },
  // Adicionar novos pontos distribuídos dentro da área circular expandida
  {
    id: "estacao-fronteira",
    x: 25,
    y: 40,
    name: "Estação Fronteira",
    type: "station",
    description: "Posto avançado nas bordas da galáxia",
    image: "https://images.pexels.com/photos/2156/sky-earth-space-working.jpg",
  },
  {
    id: "planeta-desertico",
    x: 75,
    y: 35,
    name: "Planeta Desértico",
    type: "planet",
    description: "Mundo árido com tempestades de areia",
    image: "https://images.pexels.com/photos/220201/pexels-photo-220201.jpeg",
  },
  {
    id: "nebulosa-azul",
    x: 45,
    y: 70,
    name: "Nebulosa Azul",
    type: "nebula",
    description: "Formação cósmica de cores vibrantes",
    image: "https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg",
  },
  {
    id: "asteroides-cristalinos",
    x: 65,
    y: 65,
    name: "Asteroides Cristalinos",
    type: "asteroid",
    description: "Formações rochosas com cristais raros",
    image: "https://images.pexels.com/photos/2159/flight-sky-earth-space.jpg",
  },
  {
    id: "mundo-oceanico",
    x: 55,
    y: 60,
    name: "Mundo Oceânico",
    type: "planet",
    description: "Planeta coberto por oceanos infinitos",
    image:
      "https://images.pexels.com/photos/87651/earth-blue-planet-globe-planet-87651.jpeg",
  },
];

export const GalaxyMap: React.FC<GalaxyMapProps> = ({ onPointClick }) => {
  // Force reset corrupted position data
  useEffect(() => {
    localStorage.removeItem("xenopets-map-position");
  }, []);

  // Load saved position or default to center
  const [shipPosition] = useState(() => {
    const saved = localStorage.getItem("xenopets-player-position");
    return saved ? JSON.parse(saved) : { x: 50, y: 50 };
  });
  const [nearbyPoint, setNearbyPoint] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNearBoundary, setIsNearBoundary] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate fixed star positions only once - significantly increased for larger area
  const stars = useMemo(() => {
    return Array.from({ length: 300 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 2,
    }));
  }, []);

  // Load saved map position with validation - will be re-validated when container loads
  const savedMapPosition = useRef(() => {
    try {
      const saved = localStorage.getItem("xenopets-map-position");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Return raw saved position, will be validated when container dimensions are available
        return { x: parsed.x || 0, y: parsed.y || 0 };
      }
    } catch (error) {
      console.warn("Invalid saved map position, resetting to center");
      localStorage.removeItem("xenopets-map-position");
    }
    return { x: 0, y: 0 };
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

  // Detect container dimensions for boundary calculation
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Validate and adjust map position when container dimensions change
  useEffect(() => {
    if (containerDimensions.width > 0 && containerDimensions.height > 0) {
      const limits = getNavigationLimits(
        containerDimensions.width,
        containerDimensions.height,
      );

      // Validate current position against circular limits
      const currentX = mapX.get();
      const currentY = mapY.get();
      const radius = Math.min(limits.horizontal, limits.vertical);
      const distance = Math.sqrt(currentX * currentX + currentY * currentY);

      let clampedX = currentX;
      let clampedY = currentY;

      // If outside circular boundary, clamp to circle edge
      if (distance > radius) {
        const angle = Math.atan2(currentY, currentX);
        clampedX = Math.cos(angle) * radius;
        clampedY = Math.sin(angle) * radius;
      }

      // Only update if position needs adjustment
      if (clampedX !== currentX || clampedY !== currentY) {
        mapX.set(clampedX);
        mapY.set(clampedY);
        console.log(
          `Map position adjusted to fit circular limits: (${clampedX}, ${clampedY})`,
        );
      }
    }
  }, [containerDimensions, mapX, mapY]);

  // Add continuous validation to prevent boundary violations
  useEffect(() => {
    if (containerDimensions.width === 0) return;

    const validatePosition = () => {
      const limits = getNavigationLimits(
        containerDimensions.width,
        containerDimensions.height,
      );
      const currentX = mapX.get();
      const currentY = mapY.get();
      const radius = Math.min(limits.horizontal, limits.vertical);
      const distance = Math.sqrt(currentX * currentX + currentY * currentY);

      if (distance > radius) {
        const angle = Math.atan2(currentY, currentX);
        const clampedX = Math.cos(angle) * radius;
        const clampedY = Math.sin(angle) * radius;
        mapX.set(clampedX);
        mapY.set(clampedY);
      }
    };

    // Monitor position changes and validate continuously
    const unsubscribeX = mapX.on("change", validatePosition);
    const unsubscribeY = mapY.on("change", validatePosition);

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [containerDimensions, mapX, mapY]);

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
      if (!containerRef.current || containerDimensions.width === 0) return;

      const limits = getNavigationLimits(
        containerDimensions.width,
        containerDimensions.height,
      );
      const deltaX = info.delta.x;
      const deltaY = info.delta.y;

      // Update map position with validation
      const newX = mapX.get() + deltaX;
      const newY = mapY.get() + deltaY;

      // Circular boundary constraint
      const radius = Math.min(limits.horizontal, limits.vertical);
      const distance = Math.sqrt(newX * newX + newY * newY);

      let clampedX = newX;
      let clampedY = newY;

      // If outside circular boundary, clamp to circle edge
      if (distance > radius) {
        const angle = Math.atan2(newY, newX);
        clampedX = Math.cos(angle) * radius;
        clampedY = Math.sin(angle) * radius;
      }

      // Check boundary proximity using circular distance
      const proximityRadius = radius - limits.boundaryThreshold;
      const currentDistance = Math.sqrt(
        clampedX * clampedX + clampedY * clampedY,
      );
      setIsNearBoundary(currentDistance >= proximityRadius);

      // Only calculate rotation if there's significant movement
      const movementThreshold = 2;
      const movementMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (movementMagnitude > movementThreshold) {
        const angle = Math.atan2(-deltaY, -deltaX) * (180 / Math.PI) + 90;
        animate(shipRotation, angle, { duration: 0.2 });
      }

      mapX.set(clampedX);
      mapY.set(clampedY);
    },
    [mapX, mapY, shipRotation, containerDimensions],
  );

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsNearBoundary(false); // Reset boundary warning when dragging stops

    // Final validation to ensure position is within circular boundary
    if (containerDimensions.width > 0) {
      const limits = getNavigationLimits(
        containerDimensions.width,
        containerDimensions.height,
      );
      const currentX = mapX.get();
      const currentY = mapY.get();
      const radius = Math.min(limits.horizontal, limits.vertical);
      const distance = Math.sqrt(currentX * currentX + currentY * currentY);

      if (distance > radius) {
        const angle = Math.atan2(currentY, currentX);
        const clampedX = Math.cos(angle) * radius;
        const clampedY = Math.sin(angle) * radius;
        mapX.set(clampedX);
        mapY.set(clampedY);
      }
    }

    // Save current map position
    const mapPos = { x: mapX.get(), y: mapY.get() };
    localStorage.setItem("xenopets-map-position", JSON.stringify(mapPos));
  };

  const resetShipPosition = () => {
    // Reset map to center position
    animate(mapX, 0, { duration: 0.5 });
    animate(mapY, 0, { duration: 0.5 });
    animate(shipRotation, 0, { duration: 0.5 });

    // Clear saved position
    localStorage.removeItem("xenopets-map-position");
    setIsNearBoundary(false);
    setIsDragging(false);
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
      className={`relative w-full h-[750px] bg-gradient-to-br from-gray-950 via-slate-900 to-black rounded-2xl overflow-hidden ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ userSelect: "none" }}
    >
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

      {/* Galaxy background nebulae - enhanced for larger area */}
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
        <div
          className="absolute w-56 h-56 rounded-full opacity-12 blur-3xl"
          style={{
            background: "radial-gradient(circle, #4c1d95, #312e81)",
            left: "10%",
            top: "65%",
          }}
        />
        <div
          className="absolute w-40 h-40 rounded-full opacity-9 blur-2xl"
          style={{
            background: "radial-gradient(circle, #be123c, #881337)",
            right: "15%",
            top: "15%",
          }}
        />
        <div
          className="absolute w-52 h-52 rounded-full opacity-11 blur-2xl"
          style={{
            background: "radial-gradient(circle, #065f46, #064e3b)",
            left: "70%",
            top: "60%",
          }}
        />
      </div>

      {/* Draggable galaxy map */}
      <motion.div
        ref={mapRef}
        className="absolute inset-0 w-[200%] h-[200%] -left-1/2 -top-1/2"
        style={{ x: mapX, y: mapY }}
        drag
        dragConstraints={false}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: "grabbing" }}
      >
        {/* Movement Boundary - circular boundary where the ship can reach */}
        <motion.div
          className="absolute pointer-events-none z-10"
          style={getBoundaryDimensions(
            containerDimensions.width,
            containerDimensions.height,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          {/* Circular boundary */}
          <motion.div
            className={`absolute inset-0 border-2 rounded-full transition-colors duration-300 ${
              isNearBoundary
                ? "border-red-400/60 shadow-lg shadow-red-400/20"
                : "border-cyan-400/30"
            }`}
            animate={{
              borderWidth: isNearBoundary ? 3 : 2,
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Pulsing circular boundary effect */}
            <motion.div
              className={`absolute inset-0 border-2 rounded-full transition-colors duration-300 ${
                isNearBoundary ? "border-red-400/40" : "border-cyan-400/20"
              }`}
              animate={{
                scale: [1, 1.01, 1],
                opacity: isNearBoundary ? [0.6, 1, 0.6] : [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: isNearBoundary ? 1 : 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Circular gradient overlay */}
            <motion.div
              className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                isNearBoundary ? "opacity-20" : "opacity-10"
              }`}
              style={{
                background: `radial-gradient(circle, transparent 70%, ${
                  isNearBoundary
                    ? "rgba(248, 113, 113, 0.3)"
                    : "rgba(34, 211, 238, 0.2)"
                } 100%)`,
              }}
              animate={{
                opacity: isNearBoundary ? [0.2, 0.3, 0.2] : [0.1, 0.15, 0.1],
              }}
              transition={{
                duration: isNearBoundary ? 1 : 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>

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
        {isNearBoundary ? "Limite de Navegação!" : "Área Circular de Navegação"}
      </motion.div>

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

      {/* Reset button */}
      <button
        onClick={resetShipPosition}
        className={`absolute top-4 right-4 text-white/80 text-xs bg-red-600/80 hover:bg-red-600 px-3 py-2 rounded-lg backdrop-blur-sm transition-colors ${isDragging ? "pointer-events-none" : ""}`}
        title="Resetar posição da nave"
      >
        🏠 Voltar ao Centro
      </button>

      {/* Navigation hint */}
      <div
        className={`absolute top-4 right-20 text-white/60 text-xs bg-black/40 px-3 py-2 rounded-lg backdrop-blur-sm ${isDragging ? "pointer-events-none" : ""}`}
      >
        Arraste para navegar
      </div>
    </div>
  );
};
