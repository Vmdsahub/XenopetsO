import React from "react";
import { motion, MotionValue } from "framer-motion";

interface PlayerShipProps {
  rotation: MotionValue<number>;
  isNearPoint: boolean;
  isDragging: boolean;
}

export const PlayerShip: React.FC<PlayerShipProps> = ({
  rotation,
  isNearPoint,
  isDragging,
}) => {
  return (
    <motion.div
      className="relative w-8 h-8 z-20"
      style={{ rotate: rotation }}
      animate={{
        scale: isDragging ? 1.1 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Proximity glow effect */}
      {isNearPoint && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-400"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.3, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Ship trails */}
      {isDragging && (
        <>
          <motion.div
            className="absolute -left-6 top-1/2 w-4 h-0.5 bg-gradient-to-r from-transparent to-blue-400 transform -translate-y-1/2"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scaleX: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -left-5 top-1/2 w-3 h-0.5 bg-gradient-to-r from-transparent to-cyan-300 transform -translate-y-1/2"
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scaleX: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.1,
            }}
          />
        </>
      )}

      {/* Spaceship Image */}
      <motion.img
        src="https://cdn.builder.io/api/v1/image/assets%2F9f875574753c430c92586f7b0edc1f21%2Facc507d5cb7a48c1bebc0cdc1bb911ff?format=webp&width=800"
        alt="Spaceship"
        className="w-full h-full object-contain drop-shadow-lg"
        animate={{
          filter: isNearPoint
            ? "drop-shadow(0 0 8px rgb(34, 197, 94)) brightness(1.1)"
            : "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))",
        }}
      />

      {/* Wing lights */}
      <div className="absolute top-1/2 -left-1 w-1 h-1 bg-red-400 rounded-full transform -translate-y-1/2 animate-pulse" />
      <div className="absolute top-1/2 -right-1 w-1 h-1 bg-green-400 rounded-full transform -translate-y-1/2 animate-pulse" />
    </motion.div>
  );
};
