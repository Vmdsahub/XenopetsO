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

      {/* Spaceship SVG */}
      <motion.svg
        viewBox="0 0 32 32"
        className="w-full h-full drop-shadow-lg"
        animate={{
          filter: isNearPoint
            ? "drop-shadow(0 0 8px rgb(34, 197, 94))"
            : "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))",
        }}
      >
        {/* Ship body */}
        <path
          d="M16 2 L28 12 L24 16 L28 20 L16 30 L4 20 L8 16 L4 12 Z"
          fill="url(#shipGradient)"
          stroke="#1e40af"
          strokeWidth="0.5"
        />

        {/* Cockpit */}
        <circle
          cx="16"
          cy="12"
          r="3"
          fill="url(#cockpitGradient)"
          stroke="#3b82f6"
          strokeWidth="0.5"
        />

        {/* Engine glow */}
        <circle
          cx="16"
          cy="24"
          r="2"
          fill={isDragging ? "#22d3ee" : "#60a5fa"}
          opacity={isDragging ? "0.8" : "0.6"}
        >
          {isDragging && (
            <animate
              attributeName="r"
              values="2;3;2"
              dur="0.5s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Gradients */}
        <defs>
          <linearGradient id="shipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <radialGradient id="cockpitGradient">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1e40af" />
          </radialGradient>
        </defs>
      </motion.svg>

      {/* Wing lights */}
      <div className="absolute top-1/2 -left-1 w-1 h-1 bg-red-400 rounded-full transform -translate-y-1/2 animate-pulse" />
      <div className="absolute top-1/2 -right-1 w-1 h-1 bg-green-400 rounded-full transform -translate-y-1/2 animate-pulse" />
    </motion.div>
  );
};
