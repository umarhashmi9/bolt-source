import { motion } from 'framer-motion';
import type { Feature } from './types';

export const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className="p-4 cursor-pointer rounded-xl hover:bg-bolt-elements-background-depth-3 border border-gray-100 dark:border-dark-700 hover:shadow-lg transition-all"
    onClick={(e) => {
      e.stopPropagation();
      e.preventDefault();
      window.location.href = `/chat/${feature.id}`;
    }}
  >
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{feature.name}</h3>
        {feature.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{feature.description}</p>}
      </div>
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          feature.status === 'completed'
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : feature.status === 'in-progress'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        {feature.status}
      </span>
    </div>
  </motion.div>
);
