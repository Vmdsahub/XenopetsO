import React, { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Home,
  Sparkles,
  Globe,
  Star,
  Rocket,
  Zap,
  Target,
  Search,
  MapPin,
  Navigation,
  Compass,
} from "lucide-react";

interface InteractivePoint {
  id: string;
  name: string;
  x: number; // percentage from left
  y: number; // percentage from top
  imageUrl: string;
  description: string;
  icon: React.ReactNode;
  glowColor: string;
  type: string;
  level: number;
  discovered: boolean;
}

const interactivePoints: InteractivePoint[] = [
  {
    id: "nebula_1",
    name: "Nebulosa Cristalina",
    x: 42,
    y: 38,
    imageUrl:
      "https://images.pexels.com/photos/32657005/pexels-photo-32657005.jpeg",
    description:
      "Uma nebulosa misteriosa onde cristais cósmicos se formam naturalmente, criando paisagens de tirar o fôlego.",
    icon: <Sparkles className="w-5 h-5" />,
    glowColor: "shadow-purple-400/50",
    type: "Mystical",
    level: 1,
    discovered: true,
  },
  {
    id: "galaxy_core",
    name: "Núcleo Galáctico",
    x: 58,
    y: 42,
    imageUrl:
      "https://images.pexels.com/photos/17505898/pexels-photo-17505898.jpeg",
    description:
      "O coração pulsante da galáxia, onde estrelas nascem e morrem em um ciclo eterno de criação.",
    icon: <Globe className="w-5 h-5" />,
    glowColor: "shadow-blue-400/50",
    type: "Galactic",
    level: 3,
    discovered: true,
  },
  {
    id: "cosmic_forest",
    name: "Floresta Cósmica",
    x: 45,
    y: 60,
    imageUrl:
      "https://images.pexels.com/photos/8344071/pexels-photo-8344071.jpeg",
    description:
      "Estruturas luminescentes que se assemelham a árvores flutuam no espaço, criando um jardim celestial.",
    icon: <Star className="w-5 h-5" />,
    glowColor: "shadow-cyan-400/50",
    type: "Natural",
    level: 2,
    discovered: false,
  },
  {
    id: "stargate",
    name: "Portal Estelar",
    x: 35,
    y: 48,
    imageUrl:
      "https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg",
    description:
      "Um portal dimensional que conecta diferentes regiões do universo, guardado por antigas civilizações.",
    icon: <Rocket className="w-5 h-5" />,
    glowColor: "shadow-amber-400/50",
    type: "Ancient",
    level: 5,
    discovered: true,
  },
  {
    id: "energy_field",
    name: "Campo de Energia",
    x: 62,
    y: 55,
    imageUrl:
      "https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg",
    description:
      "Uma região onde energia pura flui livremente, criando fenômenos luminosos espetaculares.",
    icon: <Zap className="w-5 h-5" />,
    glowColor: "shadow-emerald-400/50",
    type: "Energy",
    level: 4,
    discovered: false,
  },
  {
    id: "void_station",
    name: "Estação do Vazio",
    x: 55,
    y: 65,
    imageUrl:
      "https://images.pexels.com/photos/586415/pexels-photo-586415.jpeg",
    description:
      "Uma estação abandonada que flutua no vazio espacial, contendo segredos de civilizações perdidas.",
    icon: <Home className="w-5 h-5" />,
    glowColor: "shadow-red-400/50",
    type: "Ruins",
    level: 6,
    discovered: false,
  },
];

export const WorldScreen: React.FC = () => {
  const [selectedPoint, setSelectedPoint] = useState<InteractivePoint | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDirection, setDragDirection] = useState(0); // Ângulo de rotação da nave em graus
  const [trailPoints, setTrailPoints] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);

  const mapRef = useRef<HTMLDivElement>(null);

  // Distance threshold for point interaction (in pixels)
  const INTERACTION_DISTANCE = 50;

  // Calculate distance between player and a point
  const calculateDistance = useCallback(
    (point: InteractivePoint) => {
      // Player is always at the center of the visible area
      const playerX = 400; // Center of the visible area
      const playerY = 400; // Center of the visible area

      // Point position on the map - usando o sistema original de coordenadas
      const pointX = (point.x * 1600) / 100;
      const pointY = (point.y * 1600) / 100;

      // Account for map offset - o container agora está posicionado com left: -600px, top: -600px
      const adjustedPointX = pointX + mapPosition.x;
      const adjustedPointY = pointY + mapPosition.y;

      return Math.sqrt(
        Math.pow(playerX - adjustedPointX, 2) +
          Math.pow(playerY - adjustedPointY, 2),
      );
    },
    [mapPosition],
  );

  // Check if a point is within interaction range
  const isPointInRange = useCallback(
    (point: InteractivePoint) => {
      return calculateDistance(point) <= INTERACTION_DISTANCE;
    },
    [calculateDistance, INTERACTION_DISTANCE],
  );

  // Get points that are currently in range
  const pointsInRange = useMemo(() => {
    return interactivePoints.filter(isPointInRange);
  }, [isPointInRange]);

  // Check if player is near any point (for aura effect)
  const isPlayerNearAnyPoint = pointsInRange.length > 0;

  // Center the map (player position)
  const centerMap = useCallback(() => {
    setMapPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - mapPosition.x,
        y: e.clientY - mapPosition.y,
      });
    },
    [mapPosition],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Calculate drag direction for spaceship rotation
      const deltaX = e.clientX - (dragStart.x + mapPosition.x);
      const deltaY = e.clientY - (dragStart.y + mapPosition.y);

      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        // Calculate angle in degrees - subtract 90 to align with spaceship pointing up by default
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) - 90;
        setDragDirection(angle);

        // Add trail point (center of screen where spaceship is)
        setTrailPoints((prev) => {
          const newPoint = { x: 400, y: 400, id: Date.now() };
          const updated = [...prev, newPoint];
          // Keep only last 8 points for a short trail
          return updated.slice(-8);
        });
      }

      // Limit dragging to canvas bounds - increased for larger navigable area
      const maxX = 600;
      const minX = -1200;
      const maxY = 600;
      const minY = -1200;

      setMapPosition({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });
    },
    [isDragging, dragStart, mapPosition],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Clear trail gradually
    setTimeout(() => setTrailPoints([]), 1000);
  }, []);

  // Touch event handlers for mobile devices
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - mapPosition.x,
        y: touch.clientY - mapPosition.y,
      });
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

      // Calculate drag direction for spaceship rotation
      const deltaX = touch.clientX - (dragStart.x + mapPosition.x);
      const deltaY = touch.clientY - (dragStart.y + mapPosition.y);

      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        // Calculate angle in degrees - subtract 90 to align with spaceship pointing up by default
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) - 90;
        setDragDirection(angle);

        // Add trail point (center of screen where spaceship is)
        setTrailPoints((prev) => {
          const newPoint = { x: 400, y: 400, id: Date.now() };
          const updated = [...prev, newPoint];
          // Keep only last 8 points for a short trail
          return updated.slice(-8);
        });
      }

      // Limit dragging to canvas bounds - increased for larger navigable area
      const maxX = 600;
      const minX = -1200;
      const maxY = 600;
      const minY = -1200;

      setMapPosition({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });
    },
    [isDragging, dragStart, mapPosition],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    // Clear trail gradually
    setTimeout(() => setTrailPoints([]), 1000);
  }, []);

  const handlePointClick = (point: InteractivePoint) => {
    if (!isDragging && isPointInRange(point)) {
      setSelectedPoint(point);
    }
  };

  const closeModal = () => {
    setSelectedPoint(null);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      Mystical: "border-purple-300 bg-purple-50 text-purple-700",
      Galactic: "border-blue-300 bg-blue-50 text-blue-700",
      Natural: "border-green-300 bg-green-50 text-green-700",
      Ancient: "border-amber-300 bg-amber-50 text-amber-700",
      Energy: "border-emerald-300 bg-emerald-50 text-emerald-700",
      Ruins: "border-red-300 bg-red-50 text-red-700",
    };
    return colors[type as keyof typeof colors] || colors.Mystical;
  };

  const getLevelColor = (level: number) => {
    if (level <= 2) return "bg-green-500";
    if (level <= 4) return "bg-yellow-500";
    return "bg-red-500";
  };

  const filteredPoints = interactivePoints.filter((point) => {
    const matchesSearch =
      point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Generate stars for background - optimized and cached
  const stars = useMemo(() => {
    return Array.from({ length: 400 }, (_, i) => ({
      id: i,
      x: Math.random() * 200,
      y: Math.random() * 200,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.4,
      animationDelay: Math.random() * 4,
    }));
  }, []);

  const discoveredCount = interactivePoints.filter((p) => p.discovered).length;
  const totalCount = interactivePoints.length;

  return (
    <div className="max-w-md mx-auto">
      {/* Map Container */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Map Header Info */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
          <div className="text-center">
            <h3 className="font-bold text-xl text-black">Xenoverse</h3>
            <p className="text-black text-sm">Mapa Galáctico Interativo</p>
          </div>
        </div>

        {/* Interactive Map */}
        <motion.div
          className="relative h-[28rem] overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 cursor-grab active:cursor-grabbing touch-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          ref={mapRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "none" }}
        >
          {/* Center Button inside map */}
          <motion.button
            onClick={centerMap}
            className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-white/20 hover:bg-white transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Centralizar no jogador"
          >
            <Target className="w-4 h-4 text-gray-700" />
          </motion.button>
          {/* Stars Background */}
          <div
            className="absolute"
            style={{
              transform: `translate(${mapPosition.x * 1.5}px, ${mapPosition.y * 1.5}px)`,
              width: "200%",
              height: "200%",
              left: "-50%",
              top: "-50%",
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
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3 + star.animationDelay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Player Position Indicator - Spaceship */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.03, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Yellow Trail Effect */}
              {isDragging && (
                <motion.div
                  className="absolute w-10 h-10 -top-1 -left-1"
                  animate={{
                    rotate: dragDirection,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 25,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/60 via-yellow-300/40 to-transparent rounded-full blur-sm transform scale-75 translate-y-2" />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-400/40 via-yellow-200/30 to-transparent rounded-full blur-md transform scale-50 translate-y-3" />
                </motion.div>
              )}

              <motion.div
                className="w-10 h-10 flex items-center justify-center relative z-10"
                animate={{
                  rotate: dragDirection,
                }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 25,
                }}
              >
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F10ecfb5da47f4e839c19217692c6bd08%2F2966df92fa1d4cf0b029c1c2617c247a?format=webp&width=800"
                  alt="Nave Espacial"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </motion.div>

              {/* Subtle green aura when near points */}
              {isPlayerNearAnyPoint && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-400 bg-green-400/5"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 0.3, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white bg-black/70 px-2 py-1 rounded-lg">
              Você
            </div>
          </div>

          {/* Draggable Map Container */}
          <motion.div
            className="absolute inset-0"
            style={{
              transform: `translate(${mapPosition.x}px, ${mapPosition.y}px)`,
              width: "1600px",
              height: "1600px",
              left: "-600px",
              top: "-600px",
            }}
          >
            {/* Interactive Points */}
            {filteredPoints.map((point, index) => {
              const pointInRange = isPointInRange(point);
              return (
                <motion.button
                  key={point.id}
                  onClick={() => handlePointClick(point)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 border group ${
                    pointInRange
                      ? "bg-white/90 border-gray-300 hover:bg-white hover:scale-150 cursor-pointer"
                      : "bg-gray-500/60 border-gray-500 cursor-not-allowed"
                  }`}
                  style={{
                    left: `${(point.x * 1600) / 100}px`,
                    top: `${(point.y * 1600) / 100}px`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  whileHover={
                    pointInRange
                      ? {
                          scale: 1.5,
                        }
                      : {}
                  }
                  whileTap={pointInRange ? { scale: 0.8 } : {}}
                  disabled={!pointInRange}
                >
                  {/* Point Name Label on Hover */}
                  <motion.div
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    initial={{ opacity: 0, y: 5 }}
                  >
                    {point.name}
                  </motion.div>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Map Legend */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-600"></span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2"></div>
            <div className="flex items-center space-x-2"></div>
            <div className="flex items-center space-x-2"></div>
            <div className="flex items-center space-x-2"></div>
          </div>
        </div>
      </motion.div>

      {/* Location Detail Modal */}
      <AnimatePresence>
        {selectedPoint && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100">
                <div className="text-center mb-6">
                  <div
                    className={`w-20 h-20 mx-auto rounded-2xl border-2 ${getTypeColor(selectedPoint.type)} flex items-center justify-center mb-3 shadow-lg overflow-hidden relative`}
                  >
                    {selectedPoint.imageUrl ? (
                      <img
                        src={selectedPoint.imageUrl}
                        alt={selectedPoint.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-4xl">{selectedPoint.icon}</span>
                    )}

                    {/* Level Badge */}
                    <span
                      className={`absolute -top-1 -right-1 ${getLevelColor(selectedPoint.level)} text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg`}
                    >
                      {selectedPoint.level}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedPoint.name}
                  </h3>
                  <div className="flex items-center justify-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedPoint.type)}`}
                    >
                      {selectedPoint.type}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${selectedPoint.discovered ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                    >
                      {selectedPoint.discovered ? "Descoberto" : "Inexplorado"}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {selectedPoint.description}
                  </p>
                </div>

                {/* Region Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                    <span className="text-purple-700 font-medium flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      Nível de Dificuldade:
                    </span>
                    <span className="text-purple-800 font-bold">
                      Nível {selectedPoint.level}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                    <span className="text-blue-700 font-medium flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Status de Exploração:
                    </span>
                    <span
                      className={`font-bold ${selectedPoint.discovered ? "text-green-700" : "text-gray-700"}`}
                    >
                      {selectedPoint.discovered ? "Descoberto" : "Inexplorado"}
                    </span>
                  </div>

                  {selectedPoint.discovered && (
                    <div className="p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center space-x-2 text-green-600 mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Região Descoberta
                        </span>
                      </div>
                      <p className="text-green-700 text-xs">
                        Você já explorou esta região e pode acessar suas
                        funcionalidades especiais.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    onClick={closeModal}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {selectedPoint.discovered ? "Explorar Região" : "Descobrir"}
                  </motion.button>
                </div>

                <motion.button
                  onClick={closeModal}
                  className="w-full mt-3 text-gray-600 hover:text-gray-800 transition-colors py-2 font-medium"
                  whileHover={{ scale: 1.02 }}
                >
                  Fechar
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
