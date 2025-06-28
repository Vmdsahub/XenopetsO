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

// Sistema unificado de navegação - uma única fonte de verdade
const NAVIGATION_CONFIG = {
  // Fator do raio de navegação baseado no menor lado do container
  radiusFactor: 0.35, // 35% do menor lado do container
  warningZone: 30, // pixels antes do limite para alertas
  minRadius: 140, // raio mínimo independente do tamanho do container
  maxRadius: 280, // raio máximo para containers muito grandes
} as const;

// Calcula todas as configurações de navegação e boundary de forma unificada
const calculateNavigationBounds = (
  containerWidth: number,
  containerHeight: number,
) => {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return {
      radius: NAVIGATION_CONFIG.minRadius,
      centerX: 0,
      centerY: 0,
      warningRadius:
        NAVIGATION_CONFIG.minRadius - NAVIGATION_CONFIG.warningZone,
      boundaryStyles: { display: "none" },
    };
  }

  // Calcula o raio baseado no menor lado do container
  const minDimension = Math.min(containerWidth, containerHeight);
  let radius = minDimension * NAVIGATION_CONFIG.radiusFactor;

  // Aplica limites mínimo e máximo
  radius = Math.max(
    NAVIGATION_CONFIG.minRadius,
    Math.min(NAVIGATION_CONFIG.maxRadius, radius),
  );

  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const warningRadius = radius - NAVIGATION_CONFIG.warningZone;

  // Estilos para a boundary visual que coincidem exatamente com os limites de navegação
  const boundaryStyles = {
    position: "absolute" as const,
    left: centerX - radius,
    top: centerY - radius,
    width: radius * 2,
    height: radius * 2,
    borderRadius: "50%",
  };

  return {
    radius,
    centerX,
    centerY,
    warningRadius,
    boundaryStyles,
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
];

export const GalaxyMap: React.FC<GalaxyMapProps> = ({ onPointClick }) => {
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

  // Posição da nave no espaço absoluto (center of container = 0,0)
  const mapX = useMotionValue(0);
  const mapY = useMotionValue(0);
  const shipRotation = useMotionValue(0);

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

  // Carrega posição salva quando as dimensões estão disponíveis
  useEffect(() => {
    if (containerDimensions.width > 0 && containerDimensions.height > 0) {
      const saved = localStorage.getItem("xenopets-map-position");
      if (saved) {
        try {
          const { x, y } = JSON.parse(saved);
          const bounds = calculateNavigationBounds(
            containerDimensions.width,
            containerDimensions.height,
          );

          // Valida se a posição salva está dentro dos limites atuais
          const distance = Math.sqrt(x * x + y * y);
          if (distance <= bounds.radius) {
            mapX.set(x);
            mapY.set(y);
          }
        } catch (error) {
          console.warn("Posição salva inválida, resetando para centro");
          localStorage.removeItem("xenopets-map-position");
        }
      }
    }
  }, [containerDimensions, mapX, mapY]);

  // Verifica proximidade com pontos
  const checkProximity = useCallback(() => {
    const threshold = 8;
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

  // Validação contínua de posição com boundary unificado
  useEffect(() => {
    if (containerDimensions.width === 0) return;

    const bounds = calculateNavigationBounds(
      containerDimensions.width,
      containerDimensions.height,
    );

    const validatePosition = () => {
      const currentX = mapX.get();
      const currentY = mapY.get();
      const distance = Math.sqrt(currentX * currentX + currentY * currentY);

      // Restringe movimento dentro do círculo
      if (distance > bounds.radius) {
        const angle = Math.atan2(currentY, currentX);
        const clampedX = Math.cos(angle) * bounds.radius;
        const clampedY = Math.sin(angle) * bounds.radius;

        mapX.set(clampedX);
        mapY.set(clampedY);
      }

      // Atualiza estado de proximidade com boundary
      setIsNearBoundary(distance >= bounds.warningRadius);
    };

    const unsubscribeX = mapX.on("change", validatePosition);
    const unsubscribeY = mapY.on("change", validatePosition);

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [mapX, mapY, containerDimensions]);

  // Salva posição automaticamente
  useEffect(() => {
    const savePosition = () => {
      const position = { x: mapX.get(), y: mapY.get() };
      localStorage.setItem("xenopets-map-position", JSON.stringify(position));
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
  }, [mapX, mapY, isDragging]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = useCallback(
    (event: any, info: any) => {
      if (containerDimensions.width === 0) return;

      const bounds = calculateNavigationBounds(
        containerDimensions.width,
        containerDimensions.height,
      );
      const deltaX = info.delta.x;
      const deltaY = info.delta.y;

      // Nova posição baseada no movimento
      const newX = mapX.get() + deltaX;
      const newY = mapY.get() + deltaY;
      const distance = Math.sqrt(newX * newX + newY * newY);

      let finalX = newX;
      let finalY = newY;

      // Se ultrapassar o limite, implementa deslizamento na borda
      if (distance > bounds.radius) {
        const currentDistance = Math.sqrt(
          mapX.get() * mapX.get() + mapY.get() * mapY.get(),
        );

        // Se já está na borda, permite movimento tangencial (deslizar na borda)
        if (currentDistance >= bounds.radius - 3) {
          const currentAngle = Math.atan2(mapY.get(), mapX.get());
          const tangentX = -Math.sin(currentAngle);
          const tangentY = Math.cos(currentAngle);

          // Calcula componente tangencial do movimento
          const tangentialComponent = deltaX * tangentX + deltaY * tangentY;

          // Aplica apenas movimento tangencial
          finalX = mapX.get() + tangentialComponent * tangentX;
          finalY = mapY.get() + tangentialComponent * tangentY;

          // Garante que ainda está dentro do limite
          const finalDistance = Math.sqrt(finalX * finalX + finalY * finalY);
          if (finalDistance > bounds.radius) {
            const finalAngle = Math.atan2(finalY, finalX);
            finalX = Math.cos(finalAngle) * bounds.radius;
            finalY = Math.sin(finalAngle) * bounds.radius;
          }
        } else {
          // Movimento normal que ultrapassa limite - clamp na borda
          const angle = Math.atan2(newY, newX);
          finalX = Math.cos(angle) * bounds.radius;
          finalY = Math.sin(angle) * bounds.radius;
        }
      }

      // Atualiza rotação da nave baseada no movimento
      const movementMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (movementMagnitude > 2) {
        const angle = Math.atan2(-deltaY, -deltaX) * (180 / Math.PI) + 90;
        animate(shipRotation, angle, { duration: 0.2 });
      }

      mapX.set(finalX);
      mapY.set(finalY);
    },
    [mapX, mapY, shipRotation, containerDimensions],
  );

  const handleDragEnd = () => {
    setIsDragging(false);

    // Salva posição imediatamente após parar de arrastar
    const position = { x: mapX.get(), y: mapY.get() };
    localStorage.setItem("xenopets-map-position", JSON.stringify(position));
  };

  const resetShipPosition = () => {
    animate(mapX, 0, { duration: 0.5 });
    animate(mapY, 0, { duration: 0.5 });
    animate(shipRotation, 0, { duration: 0.5 });

    localStorage.removeItem("xenopets-map-position");
    setIsNearBoundary(false);
  };

  const handlePointClick = (pointId: string) => {
    const point = GALAXY_POINTS.find((p) => p.id === pointId);
    if (point) {
      onPointClick(pointId, point);
    }
  };

  const bounds = calculateNavigationBounds(
    containerDimensions.width,
    containerDimensions.height,
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
