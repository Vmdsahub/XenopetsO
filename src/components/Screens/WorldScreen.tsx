import React from "react";
import { motion } from "framer-motion";

export const WorldScreen: React.FC = () => {
  return (
    <div className="max-w-md mx-auto">
      {/* World Map Card */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
          <div className="text-center">
            <h3 className="font-bold text-xl text-gray-900">Mapa do Mundo</h3>
            <p className="text-gray-600 text-sm">Em construção...</p>
          </div>
        </div>

        {/* Empty Content Area */}
        <div className="h-96 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Área vazia</p>
            <p className="text-gray-400 text-sm mt-2">
              Pronto para começar do zero
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
