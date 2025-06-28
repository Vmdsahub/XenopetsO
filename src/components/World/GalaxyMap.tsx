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

// Configuração do mundo toroidal
const WORLD_CONFIG = {
  width: 5000, // Largura do mundo em unidades lógicas
  height: 5000, // Altura do mundo em unidades lógicas
  viewportSize: 1000, // Tamanho da viewport em unidades lógicas (área visível)
} as const;

// Função wrap para manter coordenadas dentro dos limites do mundo
const wrap = (value: number, min: number, max: number): number => {
  const range = max - min;
  if (range <= 0) return min;

  let result = value;
  while (result < min) result += range;
  while (result >= max) result -= range;
  return result;
};

// Calcula o menor deslocamento entre dois pontos considerando wrap
const getWrappedDelta = (a: number, b: number, size: number): number => {
  const delta = b - a;
  const halfSize = size / 2;

  if (delta > halfSize) {
    return delta - size;
  } else if (delta < -halfSize) {
    return delta + size;
  }
  return delta;
};

// Calcula a menor distância entre dois pontos no mundo toroidal
const toroidalDistance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  worldWidth: number,
  worldHeight: number,
): number => {
  const dx = getWrappedDelta(a.x, b.x, worldWidth);
  const dy = getWrappedDelta(a.y, b.y, worldHeight);
  return Math.sqrt(dx * dx + dy * dy);
};

// Converte coordenadas do mundo para coordenadas da tela
const worldToScreen = (
  worldPos: { x: number; y: number },
  playerPos: { x: number; y: number },
  screenCenter: { x: number; y: number },
  scale: number,
): { x: number; y: number } => {
  const dx = getWrappedDelta(playerPos.x, worldPos.x, WORLD_CONFIG.width);
  const dy = getWrappedDelta(playerPos.y, worldPos.y, WORLD_CONFIG.height);

  return {
    x: screenCenter.x + dx * scale,
    y: screenCenter.y + dy * scale,
  };
};

// Gera múltiplas posições para objetos próximos das bordas (efeito toroidal visual)
const getWrappedPositions = (
  worldPos: { x: number; y: number },
  playerPos: { x: number; y: number },
  screenCenter: { x: number; y: number },
  scale: number,
  screenWidth: number,
  screenHeight: number,
): Array<{ x: number; y: number; id: string }> => {
  const positions: Array<{ x: number; y: number; id: string }> = [];

  // Posição principal
  const mainPos = worldToScreen(worldPos, playerPos, screenCenter, scale);
  positions.push({ ...mainPos, id: "main" });

  // Verifica se precisa renderizar cópias nas bordas
  const margin = 100; // margem para começar a renderizar cópias

  // Cópias horizontais
  if (mainPos.x < margin) {
    const rightCopy = worldToScreen(
      { x: worldPos.x + WORLD_CONFIG.width, y: worldPos.y },
      playerPos,
      screenCenter,
      scale,
    );
    if (rightCopy.x <= screenWidth + margin) {
      positions.push({ ...rightCopy, id: "right" });
    }
  }

  if (mainPos.x > screenWidth - margin) {
    const leftCopy = worldToScreen(
      { x: worldPos.x - WORLD_CONFIG.width, y: worldPos.y },
      playerPos,
      screenCenter,
      scale,
    );
    if (leftCopy.x >= -margin) {
      positions.push({ ...leftCopy, id: "left" });
    }
  }

  // Cópias verticais
  if (mainPos.y < margin) {
    const bottomCopy = worldToScreen(
      { x: worldPos.x, y: worldPos.y + WORLD_CONFIG.height },
      playerPos,
      screenCenter,
      scale,
    );
    if (bottomCopy.y <= screenHeight + margin) {
      positions.push({ ...bottomCopy, id: "bottom" });
    }
  }

  if (mainPos.y > screenHeight - margin) {
    const topCopy = worldToScreen(
      { x: worldPos.x, y: worldPos.y - WORLD_CONFIG.height },
      playerPos,
      screenCenter,
      scale,
    );
    if (topCopy.y >= -margin) {
      positions.push({ ...topCopy, id: "top" });
    }
  }

  // Cópias diagonais (cantos)
  if (mainPos.x < margin && mainPos.y < margin) {
    const cornerCopy = worldToScreen(
      {
        x: worldPos.x + WORLD_CONFIG.width,
        y: worldPos.y + WORLD_CONFIG.height,
      },
      playerPos,
      screenCenter,
      scale,
    );
    positions.push({ ...cornerCopy, id: "corner-br" });
  }

  if (mainPos.x > screenWidth - margin && mainPos.y < margin) {
    const cornerCopy = worldToScreen(
      {
        x: worldPos.x - WORLD_CONFIG.width,
        y: worldPos.y + WORLD_CONFIG.height,
      },
      playerPos,
      screenCenter,
      scale,
    );
    positions.push({ ...cornerCopy, id: "corner-bl" });
  }

  if (mainPos.x < margin && mainPos.y > screenHeight - margin) {
    const cornerCopy = worldToScreen(
      {
        x: worldPos.x + WORLD_CONFIG.width,
        y: worldPos.y - WORLD_CONFIG.height,
      },
      playerPos,
      screenCenter,
      scale,
    );
    positions.push({ ...cornerCopy, id: "corner-tr" });
  }

  if (mainPos.x > screenWidth - margin && mainPos.y > screenHeight - margin) {
    const cornerCopy = worldToScreen(
      {
        x: worldPos.x - WORLD_CONFIG.width,
        y: worldPos.y - WORLD_CONFIG.height,
      },
      playerPos,
      screenCenter,
      scale,
    );
    positions.push({ ...cornerCopy, id: "corner-tl" });
  }

  return positions;
};

// Pontos da galáxia em coordenadas absolutas do mundo (0 a WORLD_CONFIG.width/height)
const GALAXY_POINTS: MapPointData[] = [
  {
    id: "terra-nova",
    x: WORLD_CONFIG.width * 0.4, // 40% da largura do mundo
    y: WORLD_CONFIG.height * 0.45, // 45% da altura do mundo
    name: "Terra Nova",
    type: "planet",
    description: "Um planeta verdejante cheio de vida",
    image:
      "https://images.pexels.com/photos/87651/earth-blue-planet-globe-planet-87651.jpeg",
  },
  {
    id: "estacao-omega",
    x: WORLD_CONFIG.width * 0.6,
    y: WORLD_CONFIG.height * 0.35,
    name: "Estação Omega",
    type: "station",
    description: "Centro comercial da galáxia",
    image: "https://images.pexels.com/photos/2156/sky-earth-space-working.jpg",
  },
  {
    id: "nebulosa-crimson",
    x: WORLD_CONFIG.width * 0.3,
    y: WORLD_CONFIG.height * 0.65,
    name: "Nebulosa Crimson",
    type: "nebula",
    description: "Uma nebulosa misteriosa com energia estranha",
    image: "https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg",
  },
  {
    id: "campo-asteroides",
    x: WORLD_CONFIG.width * 0.7,
    y: WORLD_CONFIG.height * 0.55,
    name: "Campo de Asteroides",
    type: "asteroid",
    description: "Rico em recursos minerais raros",
    image:
      "https://images.pexels.com/photos/2159/flight-sky-earth-space-working.jpg",
  },
  {
    id: "mundo-gelado",
    x: WORLD_CONFIG.width * 0.5,
    y: WORLD_CONFIG.height * 0.25,
    name: "Mundo Gelado",
    type: "planet",
    description: "Planeta coberto de gelo eterno",
    image: "https://images.pexels.com/photos/220201/pexels-photo-220201.jpeg",
  },
  // Pontos adicionais para demonstrar o wrap toroidal
  {
    id: "estacao-borda",
    x: WORLD_CONFIG.width * 0.95, // Próximo da borda direita
    y: WORLD_CONFIG.height * 0.1, // Próximo da borda superior
    name: "Estação da Borda",
    type: "station",
    description: "Estação próxima aos limites do espaço conhecido",
    image: "https://images.pexels.com/photos/2156/sky-earth-space-working.jpg",
  },
  {
    id: "planeta-limite",
    x: WORLD_CONFIG.width * 0.05, // Próximo da borda esquerda
    y: WORLD_CONFIG.height * 0.9, // Próximo da borda inferior
    name: "Planeta Limite",
    type: "planet",
    description: "Mundo nos confins da galáxia",
    image:
      "https://images.pexels.com/photos/87651/earth-blue-planet-globe-planet-87651.jpeg",
  },
];

export const GalaxyMap: React.FC<GalaxyMapProps> = ({ onPointClick }) => {
  // Posição da nave em coordenadas absolutas do mundo
  const [shipPosition, setShipPosition] = useState(() => {
    const saved = localStorage.getItem("xenopets-player-position");
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        return {
          x: wrap(pos.x || WORLD_CONFIG.width / 2, 0, WORLD_CONFIG.width),
          y: wrap(pos.y || WORLD_CONFIG.height / 2, 0, WORLD_CONFIG.height),
        };
      } catch {
        // Posição padrão no centro do mundo
        return { x: WORLD_CONFIG.width / 2, y: WORLD_CONFIG.height / 2 };
      }
    }
    return { x: WORLD_CONFIG.width / 2, y: WORLD_CONFIG.height / 2 };
  });

  const [nearbyPoint, setNearbyPoint] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shipRotation = useMotionValue(0);

  // Escala para conversão de coordenadas do mundo para pixels da tela
  const scale = useMemo(() => {
    if (containerDimensions.width === 0) return 1;
    return (
      Math.min(containerDimensions.width, containerDimensions.height) /
      WORLD_CONFIG.viewportSize
    );
  }, [containerDimensions]);

  // Estrelas fixas geradas uma vez
  const stars = useMemo(() => {
    return Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 2,
    }));
  }, []);

  // Atualiza dimensões do container
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

    return () => resizeObserver.disconnect();
  }, []);

  // Verifica proximidade com pontos usando distância toroidal
  const checkProximity = useCallback(() => {
    const threshold = 200; // Threshold em unidades do mundo
    let closest: string | null = null;
    let closestDistance = Infinity;

    GALAXY_POINTS.forEach((point) => {
      const distance = toroidalDistance(
        shipPosition,
        { x: point.x, y: point.y },
        WORLD_CONFIG.width,
        WORLD_CONFIG.height,
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

  // Salva posição da nave automaticamente
  useEffect(() => {
    const savePosition = () => {
      localStorage.setItem(
        "xenopets-player-position",
        JSON.stringify(shipPosition),
      );
    };

    // Salva a cada 2 segundos quando não está arrastando
    const interval = setInterval(() => {
      if (!isDragging) {
        savePosition();
      }
    }, 2000);

    // Salva ao desmontar o componente
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
      if (containerDimensions.width === 0 || scale === 0) return;

      const deltaX = info.delta.x;
      const deltaY = info.delta.y;

      // Converte movimento da tela para coordenadas do mundo
      // Movimento inverso: mover o mapa para a direita move a nave para a esquerda
      const worldDeltaX = -deltaX / scale;
      const worldDeltaY = -deltaY / scale;

      // Atualiza posição da nave no mundo com wrap toroidal
      const newShipX = wrap(
        shipPosition.x + worldDeltaX,
        0,
        WORLD_CONFIG.width,
      );
      const newShipY = wrap(
        shipPosition.y + worldDeltaY,
        0,
        WORLD_CONFIG.height,
      );

      setShipPosition({ x: newShipX, y: newShipY });

      // Atualiza rotação da nave baseada no movimento
      const movementMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (movementMagnitude > 2) {
        const angle = Math.atan2(-deltaY, -deltaX) * (180 / Math.PI) + 90;
        animate(shipRotation, angle, { duration: 0.2 });
      }
    },
    [shipPosition, scale, shipRotation],
  );

  const handleDragEnd = () => {
    setIsDragging(false);

    // Salva posição imediatamente após parar de arrastar
    localStorage.setItem(
      "xenopets-player-position",
      JSON.stringify(shipPosition),
    );
  };

  const resetShipPosition = () => {
    const centerPos = { x: WORLD_CONFIG.width / 2, y: WORLD_CONFIG.height / 2 };
    setShipPosition(centerPos);
    animate(shipRotation, 0, { duration: 0.5 });

    localStorage.removeItem("xenopets-player-position");
  };

  const handlePointClick = (pointId: string) => {
    const point = GALAXY_POINTS.find((p) => p.id === pointId);
    if (point) {
      onPointClick(pointId, point);
    }
  };

  // Centro da tela para renderização
  const screenCenter = useMemo(
    () => ({
      x: containerDimensions.width / 2,
      y: containerDimensions.height / 2,
    }),
    [containerDimensions],
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[650px] bg-gradient-to-br from-gray-950 via-slate-900 to-black rounded-2xl overflow-hidden ${
        isDragging ? "cursor-grabbing select-none" : "cursor-grab"
      }`}
      style={{ userSelect: "none", touchAction: "none" }}
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

      {/* Boundary visual unificado - coincide exatamente com os limites de navegação */}
      {containerDimensions.width > 0 && (
        <motion.div
          className="pointer-events-none z-10"
          style={bounds.boundaryStyles}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            borderWidth: isNearBoundary ? 3 : 2,
          }}
          transition={{ duration: 0.5 }}
        >
          {/* Borda principal */}
          <div
            className={`absolute inset-0 border-2 rounded-full transition-all duration-300 ${
              isNearBoundary
                ? "border-red-400/70 shadow-lg shadow-red-400/30"
                : "border-cyan-400/40"
            }`}
          />

          {/* Efeito pulsante */}
          <motion.div
            className={`absolute inset-0 border-2 rounded-full ${
              isNearBoundary ? "border-red-400/50" : "border-cyan-400/30"
            }`}
            animate={{
              scale: [1, 1.02, 1],
              opacity: isNearBoundary ? [0.7, 1, 0.7] : [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: isNearBoundary ? 1 : 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Gradiente interno */}
          <motion.div
            className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
              isNearBoundary ? "opacity-25" : "opacity-15"
            }`}
            style={{
              background: `radial-gradient(circle, transparent 75%, ${
                isNearBoundary
                  ? "rgba(248, 113, 113, 0.4)"
                  : "rgba(34, 211, 238, 0.3)"
              } 100%)`,
            }}
          />
        </motion.div>
      )}

      {/* Mapa arrastável */}
      <motion.div
        ref={mapRef}
        className="absolute inset-0 w-[200%] h-[200%] -left-1/2 -top-1/2"
        style={{ x: mapX, y: mapY }}
        drag
        dragConstraints={false}
        dragElastic={0.02}
        dragMomentum={true}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: "grabbing" }}
      >
        {/* Pontos da galáxia */}
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

      {/* Nave do jogador - posição fixa no centro */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <PlayerShip
          rotation={shipRotation}
          isNearPoint={nearbyPoint !== null}
          isDragging={isDragging}
        />
      </div>

      {/* Indicador de status */}
      <motion.div
        className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-xs backdrop-blur-sm border transition-all duration-300 ${
          isNearBoundary
            ? "bg-red-900/70 text-red-300 border-red-400/40 shadow-lg shadow-red-400/20"
            : "bg-black/70 text-cyan-300 border-cyan-400/40"
        }`}
        initial={{ opacity: 0, x: -20 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: isNearBoundary ? 1.05 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {isNearBoundary ? "⚠️ Limite da Área Segura" : "🚀 Navegação Ativa"}
      </motion.div>

      {/* Indicador de ponto próximo */}
      {nearbyPoint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-green-400/40 pointer-events-none"
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

      {/* Dica de navegação */}
      <div className="absolute top-4 right-24 text-white/60 text-xs bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/20">
        Arraste para navegar
      </div>
    </div>
  );
};
