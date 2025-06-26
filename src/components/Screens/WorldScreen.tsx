import React, { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Navigation2 } from "lucide-react";
import { useGameStore } from "../../store/gameStore";

interface GalaxyPoint {
  id: string;
  name: string;
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  detailImageUrl: string;
  detailPoints?: DetailPoint[];
  discovered: boolean;
  glowColor: string;
}

interface DetailPoint {
  id: string;
  name: string;
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  action: () => void;
}

const galaxyPoints: GalaxyPoint[] = [
  {
    id: "nebula_cristalina",
    name: "Nebulosa Cristalina",
    x: 25,
    y: 30,
    detailImageUrl:
      "https://images.pexels.com/photos/32657005/pexels-photo-32657005.jpeg",
    discovered: true,
    glowColor: "from-purple-400 to-pink-400",
    detailPoints: [
      {
        id: "crystal_cave",
        name: "Caverna de Cristal",
        x: 40,
        y: 60,
        action: () => alert("Explorando Caverna de Cristal!"),
      },
      {
        id: "energy_source",
        name: "Fonte de Energia",
        x: 70,
        y: 35,
        action: () => alert("Coletando energia!"),
      },
    ],
  },
  {
    id: "estacao_espacial",
    name: "Estação Espacial Abandonada",
    x: 65,
    y: 45,
    detailImageUrl:
      "https://images.pexels.com/photos/586415/pexels-photo-586415.jpeg",
    discovered: true,
    glowColor: "from-blue-400 to-cyan-400",
    detailPoints: [
      {
        id: "control_room",
        name: "Sala de Controle",
        x: 30,
        y: 40,
        action: () => alert("Acessando sistemas!"),
      },
      {
        id: "cargo_bay",
        name: "Hangar de Carga",
        x: 80,
        y: 70,
        action: () => alert("Investigando carga!"),
      },
    ],
  },
  {
    id: "portal_dimensional",
    name: "Portal Dimensional",
    x: 45,
    y: 70,
    detailImageUrl:
      "https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg",
    discovered: false,
    glowColor: "from-amber-400 to-orange-400",
    detailPoints: [
      {
        id: "portal_core",
        name: "Núcleo do Portal",
        x: 50,
        y: 50,
        action: () => alert("Ativando portal!"),
      },
    ],
  },
  {
    id: "campo_asteroides",
    name: "Campo de Asteroides",
    x: 75,
    y: 25,
    detailImageUrl:
      "https://images.pexels.com/photos/17505898/pexels-photo-17505898.jpeg",
    discovered: true,
    glowColor: "from-green-400 to-emerald-400",
    detailPoints: [
      {
        id: "mining_spot",
        name: "Local de Mineração",
        x: 35,
        y: 55,
        action: () => alert("Minerando recursos!"),
      },
      {
        id: "rare_asteroid",
        name: "Asteroide Raro",
        x: 65,
        y: 30,
        action: () => alert("Coletando materiais raros!"),
      },
    ],
  },
];

export const WorldScreen: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useGameStore();
  const [selectedPoint, setSelectedPoint] = useState<GalaxyPoint | null>(null);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [shipRotation, setShipRotation] = useState(0);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

  const mapRef = useRef<HTMLDivElement>(null);
  const INTERACTION_DISTANCE = 80; // pixels
  const MAP_SIZE = 2000; // Size of the draggable map

  // Generate stars for galaxy background
  const stars = useMemo(() => {
    return Array.from({ length: 300 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      animationDelay: Math.random() * 4,
    }));
  }, []);

  // Calculate distance between ship (center) and a point
  const calculateDistance = useCallback(
    (point: GalaxyPoint) => {
      const containerRect = mapRef.current?.getBoundingClientRect();
      if (!containerRect) return Infinity;

      const shipX = containerRect.width / 2;
      const shipY = containerRect.height / 2;

      // Point position on the map
      const pointX = (point.x / 100) * MAP_SIZE + mapPosition.x;
      const pointY = (point.y / 100) * MAP_SIZE + mapPosition.y;

      return Math.sqrt(
        Math.pow(shipX - pointX, 2) + Math.pow(shipY - pointY, 2),
      );
    },
    [mapPosition],
  );

  // Check if point is in interaction range
  const isPointInRange = useCallback(
    (point: GalaxyPoint) => {
      return calculateDistance(point) <= INTERACTION_DISTANCE;
    },
    [calculateDistance],
  );

  // Get points currently in range
  const pointsInRange = useMemo(() => {
    return galaxyPoints.filter(isPointInRange);
  }, [isPointInRange]);

  // Center the map
  const centerMap = useCallback(() => {
    setMapPosition({ x: 0, y: 0 });
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - mapPosition.x,
        y: e.clientY - mapPosition.y,
      });
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    },
    [mapPosition],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Calculate ship rotation based on drag direction
      const deltaX = e.clientX - lastMousePosition.x;
      const deltaY = e.clientY - lastMousePosition.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        setShipRotation(angle);
        setLastMousePosition({ x: e.clientX, y: e.clientY });
      }

      // Limit dragging bounds
      const maxOffset = MAP_SIZE / 3;
      setMapPosition({
        x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
      });
    },
    [isDragging, dragStart, lastMousePosition],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - mapPosition.x,
        y: touch.clientY - mapPosition.y,
      });
      setLastMousePosition({ x: touch.clientX, y: touch.clientY });
    },
    [mapPosition],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      // Calculate ship rotation
      const deltaX = touch.clientX - lastMousePosition.x;
      const deltaY = touch.clientY - lastMousePosition.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        setShipRotation(angle);
        setLastMousePosition({ x: touch.clientX, y: touch.clientY });
      }

      // Limit dragging bounds
      const maxOffset = MAP_SIZE / 3;
      setMapPosition({
        x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
      });
    },
    [isDragging, dragStart, lastMousePosition],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle point click
  const handlePointClick = (point: GalaxyPoint) => {
    if (!isDragging && isPointInRange(point)) {
      setSelectedPoint(point);
    }
  };

  if (selectedPoint) {
    return (
      <GalaxyDetailView
        point={selectedPoint}
        onBack={() => setSelectedPoint(null)}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Galaxy Map Card */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
          <div className="text-center">
            <h3 className="font-bold text-xl text-gray-900">Mapa Galáctico</h3>
            <p className="text-gray-600 text-sm">Explore o universo infinito</p>
          </div>
        </div>

        {/* Interactive Galaxy Map */}
        <div
          ref={mapRef}
          className="relative h-96 overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-black cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "none" }}
        >
          {/* Center Map Button */}
          <motion.button
            onClick={centerMap}
            className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-white/20 hover:bg-white transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Centralizar mapa"
          >
            <Target className="w-4 h-4 text-gray-700" />
          </motion.button>

          {/* Stars Background */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${mapPosition.x * 0.3}px, ${mapPosition.y * 0.3}px)`,
            }}
          >
            {stars.map((star) => (
              <motion.div
                key={star.id}
                className="absolute bg-white rounded-full"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                }}
                animate={{
                  opacity: [
                    star.opacity * 0.3,
                    star.opacity,
                    star.opacity * 0.3,
                  ],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3 + star.animationDelay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Galaxy Points */}
          <div
            className="absolute"
            style={{
              transform: `translate(${mapPosition.x}px, ${mapPosition.y}px)`,
              width: `${MAP_SIZE}px`,
              height: `${MAP_SIZE}px`,
              left: "50%",
              top: "50%",
              marginLeft: `-${MAP_SIZE / 2}px`,
              marginTop: `-${MAP_SIZE / 2}px`,
            }}
          >
            {galaxyPoints.map((point, index) => {
              const inRange = isPointInRange(point);
              return (
                <motion.button
                  key={point.id}
                  onClick={() => handlePointClick(point)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 + 0.5 }}
                  whileHover={inRange ? { scale: 1.2 } : {}}
                  disabled={!inRange}
                >
                  {/* Point Glow */}
                  <motion.div
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${point.glowColor} opacity-60 blur-sm absolute inset-0`}
                    animate={
                      point.discovered
                        ? {
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 0.9, 0.6],
                          }
                        : {}
                    }
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Point Core */}
                  <div
                    className={`w-6 h-6 rounded-full relative z-10 ${
                      inRange
                        ? "bg-white border-2 border-gray-300 shadow-lg"
                        : "bg-gray-500 border-2 border-gray-600"
                    }`}
                  />

                  {/* Interaction Range Indicator */}
                  {inRange && (
                    <motion.div
                      className="absolute inset-0 w-16 h-16 -ml-5 -mt-5 border-2 border-green-400 rounded-full"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  {/* Point Name */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {point.name}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Spaceship (Player) - Always at center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <motion.div
              className="w-12 h-12 relative"
              animate={{
                rotate: shipRotation,
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
              }}
            >
              {/* Using Navigation2 icon as spaceship placeholder */}
              <div className="w-full h-full bg-gradient-to-t from-blue-500 to-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <Navigation2 className="w-6 h-6 text-blue-900" />
              </div>

              {/* Ship glow when near points */}
              {pointsInRange.length > 0 && (
                <motion.div
                  className="absolute inset-0 w-16 h-16 -ml-2 -mt-2 border-2 border-green-400 rounded-full bg-green-400/10"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.div>

            {/* Player Label */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white bg-black/70 px-2 py-1 rounded">
              Sua Nave
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {pointsInRange.length > 0
                ? "Ponto acessível próximo!"
                : "Navegue para explorar"}
            </span>
            <span className="text-gray-500">
              {galaxyPoints.filter((p) => p.discovered).length}/
              {galaxyPoints.length} descobertos
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Galaxy Detail View Component
interface GalaxyDetailViewProps {
  point: GalaxyPoint;
  onBack: () => void;
}

const GalaxyDetailView: React.FC<GalaxyDetailViewProps> = ({
  point,
  onBack,
}) => {
  return (
    <div className="max-w-md mx-auto">
      <motion.div
        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <motion.button
              onClick={onBack}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Navigation2 className="w-5 h-5 text-gray-700 rotate-180" />
            </motion.button>
            <div className="text-center">
              <h3 className="font-bold text-lg text-gray-900">{point.name}</h3>
              <p className="text-gray-600 text-sm">Vista detalhada</p>
            </div>
            <div className="w-9"></div>
          </div>
        </div>

        {/* Detail Image */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={point.detailImageUrl}
            alt={point.name}
            className="w-full h-full object-cover"
            style={{ pointerEvents: "none" }}
          />

          {/* Detail Points */}
          {point.detailPoints?.map((detailPoint, index) => (
            <motion.button
              key={detailPoint.id}
              onClick={detailPoint.action}
              className="absolute w-6 h-6 bg-yellow-400 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform shadow-lg group"
              style={{
                left: `${detailPoint.x}%`,
                top: `${detailPoint.y}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.3 + 0.5 }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Pulse animation */}
              <motion.div
                className="absolute inset-0 w-8 h-8 -ml-1 -mt-1 border-2 border-yellow-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0.3, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Point name tooltip */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {detailPoint.name}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-4">
            Clique nos pontos destacados para interagir com esta localização.
          </p>
          <motion.button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Voltar ao Mapa
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
