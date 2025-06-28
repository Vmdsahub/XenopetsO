import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { motion, useMotionValue, animate } from "framer-motion";
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

// Configuração simplificada do mundo toroidal
const WORLD_CONFIG = {
  width: 200, // Tamanho do mundo em %
  height: 200,
} as const;

// Função wrap para coordenadas toroidais
const wrap = (value: number, min: number, max: number): number => {
  const range = max - min;
  if (range <= 0) return min;

  let result = value;
  while (result < min) result += range;
  while (result >= max) result -= range;
  return result;
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
    image:
      "https://images.pexels.com/photos/2159/flight-sky-earth-space-working.jpg",
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
  // Pontos extras para demonstrar wrap
  {
    id: "estacao-borda",
    x: 95,
    y: 10,
    name: "Estação da Borda",
    type: "station",
    description: "Estação nos limites do espaço",
    image: "https://images.pexels.com/photos/2156/sky-earth-space-working.jpg",
  },
  {
    id: "planeta-limite",
    x: 5,
    y: 90,
    name: "Planeta Limite",
    type: "planet",
    description: "Mundo nos confins da galáxia",
    image:
      "https://images.pexels.com/photos/87651/earth-blue-planet-globe-planet-87651.jpeg",
  },
];

export const GalaxyMap: React.FC<GalaxyMapProps> = ({ onPointClick }) => {
  const [shipPosition, setShipPosition] = useState(() => {
    const saved = localStorage.getItem("xenopets-player-position");
    return saved ? JSON.parse(saved) : { x: 50, y: 50 };
  });

  const [nearbyPoint, setNearbyPoint] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values para posição do mapa (movimento inverso da nave)
  const mapX = useMotionValue(0);
  const mapY = useMotionValue(0);
  const shipRotation = useMotionValue(0);

  // Estrelas fixas
  const stars = useMemo(() => {
    return Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 2,
    }));
  }, []);

  // Verifica proximidade
  const checkProximity = useCallback(() => {
    const threshold = 8;
    let closest: string | null = null;
    let closestDistance = Infinity;

    GALAXY_POINTS.forEach((point) => {
      // Calcula distância considerando wrap toroidal simples
      const dx = Math.min(
        Math.abs(shipPosition.x - point.x),
        Math.abs(shipPosition.x - point.x + WORLD_CONFIG.width),
        Math.abs(shipPosition.x - point.x - WORLD_CONFIG.width),
      );
      const dy = Math.min(
        Math.abs(shipPosition.y - point.y),
        Math.abs(shipPosition.y - point.y + WORLD_CONFIG.height),
        Math.abs(shipPosition.y - point.y - WORLD_CONFIG.height),
      );
      const distance = Math.sqrt(dx * dx + dy * dy);

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

  // Salva posição
  useEffect(() => {
    const savePosition = () => {
      localStorage.setItem(
        "xenopets-player-position",
        JSON.stringify(shipPosition),
      );
    };

    const interval = setInterval(() => {
      if (!isDragging) {
        savePosition();
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      savePosition();
    };
  }, [shipPosition, isDragging]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = useCallback(
    (event: any, info: any) => {
      const deltaX = info.delta.x;
      const deltaY = info.delta.y;

      // Converte pixels para % do mundo
      const worldDeltaX = deltaX / 8;
      const worldDeltaY = deltaY / 8;

      // Atualiza posição da nave com wrap toroidal
      setShipPosition((prev) => ({
        x: wrap(prev.x - worldDeltaX, 0, WORLD_CONFIG.width),
        y: wrap(prev.y - worldDeltaY, 0, WORLD_CONFIG.height),
      }));

      // Atualiza movimento do mapa (visual)
      mapX.set(mapX.get() + deltaX);
      mapY.set(mapY.get() + deltaY);

      // Rotação da nave
      const movementMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (movementMagnitude > 2) {
        const angle = Math.atan2(-deltaY, -deltaX) * (180 / Math.PI) + 90;
        animate(shipRotation, angle, { duration: 0.2 });
      }
    },
    [mapX, mapY, shipRotation],
  );

  const handleDragEnd = () => {
    setIsDragging(false);
    localStorage.setItem(
      "xenopets-player-position",
      JSON.stringify(shipPosition),
    );
  };

  const resetShipPosition = () => {
    setShipPosition({ x: 50, y: 50 });
    animate(mapX, 0, { duration: 0.5 });
    animate(mapY, 0, { duration: 0.5 });
    animate(shipRotation, 0, { duration: 0.5 });
    localStorage.removeItem("xenopets-player-position");
  };

  const handlePointClick = (pointId: string) => {
    const point = GALAXY_POINTS.find((p) => p.id === pointId);
    if (point) {
      onPointClick(pointId, point);
    }
  };

  // Renderiza pontos com wrap visual
  const renderPoints = () => {
    const points = [];

    GALAXY_POINTS.forEach((point) => {
      // Posição principal
      points.push(
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
        />,
      );

      // Cópias para efeito toroidal (simplificado)
      // Cópia à direita
      if (point.x > 80) {
        points.push(
          <MapPoint
            key={`${point.id}-right`}
            point={point}
            isNearby={nearbyPoint === point.id}
            onClick={() => handlePointClick(point.id)}
            isDragging={isDragging}
            style={{
              left: `${point.x - WORLD_CONFIG.width}%`,
              top: `${point.y}%`,
              opacity: 0.7,
            }}
          />,
        );
      }

      // Cópia à esquerda
      if (point.x < 20) {
        points.push(
          <MapPoint
            key={`${point.id}-left`}
            point={point}
            isNearby={nearbyPoint === point.id}
            onClick={() => handlePointClick(point.id)}
            isDragging={isDragging}
            style={{
              left: `${point.x + WORLD_CONFIG.width}%`,
              top: `${point.y}%`,
              opacity: 0.7,
            }}
          />,
        );
      }

      // Cópia embaixo
      if (point.y > 80) {
        points.push(
          <MapPoint
            key={`${point.id}-bottom`}
            point={point}
            isNearby={nearbyPoint === point.id}
            onClick={() => handlePointClick(point.id)}
            isDragging={isDragging}
            style={{
              left: `${point.x}%`,
              top: `${point.y - WORLD_CONFIG.height}%`,
              opacity: 0.7,
            }}
          />,
        );
      }

      // Cópia em cima
      if (point.y < 20) {
        points.push(
          <MapPoint
            key={`${point.id}-top`}
            point={point}
            isNearby={nearbyPoint === point.id}
            onClick={() => handlePointClick(point.id)}
            isDragging={isDragging}
            style={{
              left: `${point.x}%`,
              top: `${point.y + WORLD_CONFIG.height}%`,
              opacity: 0.7,
            }}
          />,
        );
      }
    });

    return points;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[650px] bg-gradient-to-br from-gray-950 via-slate-900 to-black rounded-2xl overflow-hidden ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ userSelect: "none" }}
    >
      {/* Estrelas de fundo */}
      <div className="absolute inset-0 opacity-80 pointer-events-none">
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

      {/* Nebulosas de fundo */}
      <div className="absolute inset-0 pointer-events-none">
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

      {/* Área de drag fixa - sempre cobre toda a tela */}
      <motion.div
        className="absolute inset-0 z-10"
        drag
        dragConstraints={false}
        dragElastic={0.02}
        dragMomentum={true}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: "grabbing" }}
        style={{ backgroundColor: "transparent" }}
      />

      {/* Mapa visual - movido pelo drag acima */}
      <motion.div
        ref={mapRef}
        className="absolute inset-0 w-[300%] h-[300%] -left-full -top-full pointer-events-none"
        style={{ x: mapX, y: mapY }}
      >
        {/* Pontos da galáxia */}
        {renderPoints()}
      </motion.div>

      {/* Nave do jogador - fixa no centro */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <PlayerShip
          rotation={shipRotation}
          isNearPoint={nearbyPoint !== null}
          isDragging={isDragging}
        />
      </div>

      {/* Indicador de status */}
      <motion.div
        className="absolute top-4 left-4 px-3 py-1 rounded-lg text-xs backdrop-blur-sm border bg-black/70 text-cyan-300 border-cyan-400/40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        🌌 Mundo Toroidal
      </motion.div>

      {/* Coordenadas */}
      <motion.div
        className="absolute top-12 left-4 px-3 py-1 rounded-lg text-xs backdrop-blur-sm border bg-black/70 text-gray-300 border-gray-400/40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        X: {Math.round(shipPosition.x)} Y: {Math.round(shipPosition.y)}
      </motion.div>

      {/* Ponto próximo */}
      {nearbyPoint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-green-400/30 pointer-events-none"
        >
          <div className="text-green-400 font-medium">
            {GALAXY_POINTS.find((p) => p.id === nearbyPoint)?.name}
          </div>
          <div className="text-xs text-gray-300">Clique para explorar</div>
        </motion.div>
      )}

      {/* Botão reset */}
      <button
        onClick={resetShipPosition}
        className="absolute top-4 right-4 text-white/90 text-xs bg-red-600/80 hover:bg-red-600/90 px-3 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 border border-red-400/30"
        title="Voltar ao centro"
      >
        🏠 Centro
      </button>

      {/* Dica */}
      <div className="absolute top-4 right-24 text-white/60 text-xs bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/20">
        Arraste • Mundo infinito
      </div>
    </div>
  );
};
