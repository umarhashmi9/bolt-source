import React from 'react';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from '~/utils/constants';

interface FrameworkLinkProps {
  template: Template;
}

const FrameworkLink: React.FC<FrameworkLinkProps> = ({ template }) => (
  <a
    href={`/git?https://github.com/${template.githubRepo}.git`}
    data-state="closed"
    data-discover="true"
    className="block"
  >
    <div className={`inline-block ${template.icon} w-8 h-8 text-4xl transition-theme transition-all`} />
  </a>
);

const StarterTemplates: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm text-gray-500">or start a blank app with your favorite stack</span>

      <div className="grid grid-cols-7 mx-auto mt-5 gap-4 justify-items-center">
        {STARTER_TEMPLATES.map((template) => (
          <FrameworkLink key={template.name} template={template} />
        ))}
      </div>
    </div>
  );
};

export default StarterTemplates;
