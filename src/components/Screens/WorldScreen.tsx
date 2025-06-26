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
  },
];

export const WorldScreen: React.FC = () => {
  const [selectedPoint, setSelectedPoint] = useState<InteractivePoint | null>(
    null,
  );
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Center the map (player position)
  const centerMap = useCallback(() => {
    setMapPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
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

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Limit dragging to canvas bounds (800x800 - optimized)
      const maxX = 200; // Allow some padding
      const minX = -(800 - 400); // Canvas width minus viewport width
      const maxY = 200; // Allow some padding
      const minY = -(800 - 384); // Canvas height minus viewport height

      setMapPosition({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointClick = (point: InteractivePoint) => {
    if (!isDragging) {
      setSelectedPoint(point);
    }
  };

  const closeModal = () => {
    setSelectedPoint(null);
  };

  // Generate stars for background - optimized and cached
  const stars = useMemo(() => {
    return Array.from({ length: 400 }, (_, i) => ({
      id: i,
      x: Math.random() * 200, // Full map coverage
      y: Math.random() * 200,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.4,
      animationDelay: Math.random() * 4,
    }));
  }, []); // Empty dependency array means this only runs once

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <motion.div
        className="bg-white/95 backdrop-blur-md text-gray-900 p-6 rounded-t-3xl border-t border-x border-gray-100 shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Xenoverse
          </div>
          <p className="text-gray-600 text-sm">
            Explore o cosmos e descubra regiões místicas
          </p>
        </div>
      </motion.div>

      {/* Infinite Draggable Universe Map */}
      <motion.div
        className="relative h-96 overflow-hidden bg-gray-900 border-x border-gray-100 cursor-grab active:cursor-grabbing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        ref={mapRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Center Button */}
        <motion.button
          onClick={centerMap}
          className="absolute top-4 right-4 z-10 p-3 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-gray-200 hover:bg-white transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Centralizar no jogador"
        >
          <Target className="w-5 h-5 text-gray-700" />
        </motion.button>

        {/* Player Position Indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <motion.div
            className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full border-3 border-white shadow-lg"
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 10px rgba(147, 51, 234, 0.3)",
                "0 0 20px rgba(147, 51, 234, 0.5)",
                "0 0 10px rgba(147, 51, 234, 0.3)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white bg-black/70 px-2 py-1 rounded-lg">
            Você
          </div>
        </div>
        {/* Subtle Parallax Stars Background */}
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
                opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
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

        {/* Optimized Draggable Map Container */}
        <motion.div
          className="absolute inset-0"
          style={{
            transform: `translate(${mapPosition.x}px, ${mapPosition.y}px)`,
            width: "800px",
            height: "800px",
            left: "-200px",
            top: "-200px",
          }}
        >
          {/* Interactive Points */}
          {interactivePoints.map((point, index) => (
            <motion.button
              key={point.id}
              onClick={() => handlePointClick(point)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-gray-700 shadow-lg transition-all duration-300 hover:scale-110 border-2 border-gray-200 hover:border-purple-300 hover:shadow-purple-200/50"
              style={{
                left: `${(point.x * 800) / 100}px`,
                top: `${(point.y * 800) / 100}px`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.2 + 0.5 }}
              whileHover={{
                scale: 1.2,
                boxShadow: "0 0 30px rgba(147, 51, 234, 0.3)",
              }}
              whileTap={{ scale: 0.9 }}
            >
              {point.icon}

              {/* Simplified Pulsing Ring Animation */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-300/40"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0.1, 0.6],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.5,
                  ease: "easeInOut",
                }}
              />

              {/* Point Name Label */}
              <motion.div
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md text-gray-800 text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-200 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
              >
                {point.name}
              </motion.div>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Points List */}
      <motion.div
        className="bg-gradient-to-b from-gray-900 to-black text-white p-6 rounded-b-3xl border-b border-x border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-bold mb-4 flex items-center" />
        <div className="grid grid-cols-2 gap-3" />
      </motion.div>

      {/* Location Page Modal */}
      <AnimatePresence>
        {selectedPoint && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/80 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-black rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-purple-500/30 h-96">
                {/* Modal Header */}
                <div className="relative p-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                        {selectedPoint.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedPoint.name}
                      </h3>
                    </div>
                    <motion.button
                      onClick={closeModal}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>

                {/* Location Image - Same size as map component */}
                <div className="relative h-64 overflow-hidden">
                  <motion.img
                    src={selectedPoint.imageUrl}
                    alt={selectedPoint.name}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* Description */}
                <div className="p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {selectedPoint.description}
                  </p>

                  <motion.div
                    className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-4 border border-purple-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center space-x-2 text-purple-300">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Região Mística
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Esta região contém energias especiais que podem ser
                      exploradas no futuro.
                    </p>
                  </motion.div>

                  <motion.button
                    onClick={closeModal}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Fechar Exploração
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
