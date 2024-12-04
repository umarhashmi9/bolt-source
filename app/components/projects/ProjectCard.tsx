import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { Project } from './types';

export const ProjectCard = ({ project, onClick }: { project: Project; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
    onClick={onClick}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />

    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
          {project.name}
        </h3>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-4">
          <motion.div initial={false} whileHover={{ scale: 1.1 }} className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M21 8v13H3V8M23 3H1v5h22V3zM12 12h.01M8 12h.01M16 12h.01"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{project.gitUrl.split('/').pop()?.split('.')[0]}</span>
          </motion.div>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center space-x-4">
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span className="flex items-center text-sm text-gray-500 hover:text-blue-500 transition-colors">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 3v12" />
                  <path d="M18 9a3 3 0 100-6 3 3 0 000 6z" />
                  <path d="M6 21a3 3 0 100-6 3 3 0 000 6z" />
                  <path d="M15 6h-4" />
                  <path d="M15 18h-4" />
                </svg>
                {project.branches.length}
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm" sideOffset={5}>
                Active branches
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

      <motion.div className="flex -space-x-2" initial={false} whileHover={{ scale: 1.05 }}>
        {project.branches.slice(0, 3).map((branch, idx) => (
          <Tooltip.Provider key={idx}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-medium text-white border-2 border-white dark:border-gray-800 cursor-help">
                  {branch.author[0].toUpperCase()}
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm" sideOffset={5}>
                  {branch.author}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ))}
      </motion.div>
    </div>

    {/* {project.features.length > 0 && (
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          {project.features.slice(0, 3).map((feature) => (
            <span
              key={feature.id}
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                feature.status === 'completed'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : feature.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {feature.name}
            </span>
          ))}
        </div>
      </div>
    )} */}
  </motion.div>
);
