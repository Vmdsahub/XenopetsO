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

// Unified navigation and boundary configuration - single source of truth
// All values calculated from this single configuration to prevent inconsistencies
const NAVIGATION_CONFIG = {
  // Container size multiplier for navigation area (1.0 = container size, 0.8 = 80% of container)
  navigationRatio: 0.8, // 80% of container size provides good navigation area with clear boundaries
  boundaryThreshold: 15, // pixels from boundary edge for proximity warning
  minContainerSize: 400, // minimum container size for calculations
  mapSizeMultiplier: 2.0, // map is 2x container size (200%)
} as const;

// Single function to calculate all navigation and boundary values uniformly
// This ensures navigation limits and visual boundaries are ALWAYS identical
const getUnifiedNavigationConfig = (
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

  // Calculate navigation radius as percentage of smallest container dimension
  // This ensures circular boundary that fits within container regardless of aspect ratio
  const containerSize = Math.min(effectiveWidth, effectiveHeight);
  const navigationRadius =
    (containerSize * NAVIGATION_CONFIG.navigationRatio) / 2;

  // Map dimensions (always 2x container size)
  const mapWidth = containerWidth * NAVIGATION_CONFIG.mapSizeMultiplier;
  const mapHeight = containerHeight * NAVIGATION_CONFIG.mapSizeMultiplier;

  // Calculate boundary circle as percentage of map (for visual boundary)
  const circleDiameter = navigationRadius * 2;
  const boundaryWidthPercent = (circleDiameter / mapWidth) * 100;
  const boundaryHeightPercent = (circleDiameter / mapHeight) * 100;

  // Center the boundary in the map
  const boundaryLeftPercent = (100 - boundaryWidthPercent) / 2;
  const boundaryTopPercent = (100 - boundaryHeightPercent) / 2;

  return {
    // Navigation limits (used for ship movement constraints)
    navigationRadius,
    boundaryThreshold: NAVIGATION_CONFIG.boundaryThreshold,

    // Visual boundary dimensions (used for rendering boundary circle)
    boundaryStyle: {
      left: `${boundaryLeftPercent}%`,
      top: `${boundaryTopPercent}%`,
      width: `${boundaryWidthPercent}%`,
      height: `${boundaryHeightPercent}%`,
    },

    // Debug info
    containerSize,
    mapWidth,
    mapHeight,
  };
};

const GALAXY_POINTS: MapPointData[] = [
  {
    id: "terra-nova",
    x: 48,
    y: 47,
    name: "Terra Nova",
    type: "planet",
    description: "Um planeta verdejante cheio de vida",
    image:
      "https://images.pexels.com/photos/87651/earth-blue-planet-globe-planet-87651.jpeg",
  },
  {
    id: "estacao-omega",
    x: 52,
    y: 48,
    name: "Estação Omega",
    type: "station",
    description: "Centro comercial da galáxia",
    image: "https://images.pexels.com/photos/2156/sky-earth-space-working.jpg",
  },
  {
    id: "nebulosa-crimson",
    x: 49,
    y: 52,
    name: "Nebulosa Crimson",
    type: "nebula",
    description: "Uma nebulosa misteriosa com energia estranha",
    image: "https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg",
  },
  {
    id: "campo-asteroides",
    x: 51,
    y: 53,
    name: "Campo de Asteroides",
    type: "asteroid",
    description: "Rico em recursos minerais raros",
    image: "https://images.pexels.com/photos/2159/flight-sky-earth-space.jpg",
  },
  {
    id: "mundo-gelado",
    x: 50,
    y: 49,
    name: "Mundo Gelado",
    type: "planet",
    description: "Planeta coberto de gelo eterno",
    image: "https://images.pexels.com/photos/220201/pexels-photo-220201.jpeg",
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

  // Generate fixed star positions only once
  const stars = useMemo(() => {
    return Array.from({ length: 150 }, (_, i) => ({
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
      const config = getUnifiedNavigationConfig(
        containerDimensions.width,
        containerDimensions.height,
      );

      // Validate current position against unified circular limits
      const currentX = mapX.get();
      const currentY = mapY.get();
      const distance = Math.sqrt(currentX * currentX + currentY * currentY);

      let clampedX = currentX;
      let clampedY = currentY;

      // If outside unified boundary, clamp to circle edge
      if (distance > config.navigationRadius) {
        const angle = Math.atan2(currentY, currentX);
        clampedX = Math.cos(angle) * config.navigationRadius;
        clampedY = Math.sin(angle) * config.navigationRadius;
      }

      // Only update if position needs adjustment
      if (clampedX !== currentX || clampedY !== currentY) {
        mapX.set(clampedX);
        mapY.set(clampedY);
        console.log(
          `Map position adjusted to unified limits: (${clampedX.toFixed(1)}, ${clampedY.toFixed(1)}) - radius: ${config.navigationRadius.toFixed(1)}`,
        );
      }
    }
  }, [containerDimensions, mapX, mapY]);

  // Continuous position validation to handle momentum after drag ends
  useEffect(() => {
    if (containerDimensions.width === 0) return;

    let isValidating = false; // Prevent recursive validation calls

    const validatePosition = () => {
      if (isValidating) return; // Prevent infinite loops

      const config = getUnifiedNavigationConfig(
        containerDimensions.width,
        containerDimensions.height,
      );

      const currentX = mapX.get();
      const currentY = mapY.get();
      const distance = Math.sqrt(currentX * currentX + currentY * currentY);

      // Only clamp if significantly beyond boundary (add small tolerance)
      const tolerance = 2; // pixels of tolerance to prevent jittering at boundary
      if (distance > config.navigationRadius + tolerance) {
        isValidating = true;
        const angle = Math.atan2(currentY, currentX);
        const clampedX = Math.cos(angle) * config.navigationRadius;
        const clampedY = Math.sin(angle) * config.navigationRadius;

        // Set position without animation to maintain responsiveness
        mapX.set(clampedX);
        mapY.set(clampedY);
        isValidating = false;
      }

      // Check boundary proximity for visual feedback
      const proximityRadius =
        config.navigationRadius - config.boundaryThreshold;
      setIsNearBoundary(distance >= proximityRadius);
    };

    // Monitor position continuously during momentum phase
    const unsubscribeX = mapX.on("change", validatePosition);
    const unsubscribeY = mapY.on("change", validatePosition);

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [mapX, mapY, containerDimensions]);

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

      const config = getUnifiedNavigationConfig(
        containerDimensions.width,
        containerDimensions.height,
      );
      const deltaX = info.delta.x;
      const deltaY = info.delta.y;

      // Update map position with validation
      const newX = mapX.get() + deltaX;
      const newY = mapY.get() + deltaY;

      // Unified circular boundary constraint with smooth sliding along edge
      const distance = Math.sqrt(newX * newX + newY * newY);

      let clampedX = newX;
      let clampedY = newY;

      // If outside unified boundary, implement sliding along the edge
      if (distance > config.navigationRadius) {
        const currentDistance = Math.sqrt(
          mapX.get() * mapX.get() + mapY.get() * mapY.get(),
        );

        // If already at boundary, allow tangential movement (sliding along edge)
        if (currentDistance >= config.navigationRadius - 5) {
          // Project movement onto tangent of circle for smooth sliding
          const angle = Math.atan2(mapY.get(), mapX.get());
          const tangentX = -Math.sin(angle);
          const tangentY = Math.cos(angle);

          // Calculate tangential component of movement
          const tangentialMovement = deltaX * tangentX + deltaY * tangentY;

          // Apply only tangential movement
          clampedX = mapX.get() + tangentialMovement * tangentX;
          clampedY = mapY.get() + tangentialMovement * tangentY;

          // Ensure result is still within boundary
          const finalDistance = Math.sqrt(
            clampedX * clampedX + clampedY * clampedY,
          );
          if (finalDistance > config.navigationRadius) {
            const finalAngle = Math.atan2(clampedY, clampedX);
            clampedX = Math.cos(finalAngle) * config.navigationRadius;
            clampedY = Math.sin(finalAngle) * config.navigationRadius;
          }
        } else {
          // Standard clamping for movements from inside to outside
          const angle = Math.atan2(newY, newX);
          clampedX = Math.cos(angle) * config.navigationRadius;
          clampedY = Math.sin(angle) * config.navigationRadius;
        }
      }

      // Check boundary proximity using unified threshold
      const proximityRadius =
        config.navigationRadius - config.boundaryThreshold;
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
    // Note: boundary validation is now handled by continuous monitoring
    // This allows momentum to work naturally while staying within limits

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
      className={`relative w-full h-[650px] bg-gradient-to-br from-gray-950 via-slate-900 to-black rounded-2xl overflow-hidden ${
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
        dragConstraints={false}
        dragElastic={0.05}
        dragMomentum={true}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: "grabbing" }}
      >
        {/* Unified Navigation Boundary - visual boundary matches navigation limits exactly */}
        <motion.div
          className="absolute pointer-events-none z-10"
          style={
            containerDimensions.width > 0
              ? getUnifiedNavigationConfig(
                  containerDimensions.width,
                  containerDimensions.height,
                ).boundaryStyle
              : { display: "none" }
          }
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

      {/* Unified boundary label */}
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
        {isNearBoundary
          ? "Limite Unificado Atingido!"
          : "Navegação Unificada Ativa"}
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
