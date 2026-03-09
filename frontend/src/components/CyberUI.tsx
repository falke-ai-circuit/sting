import React from 'react';

// ==================== CARDS & CONTAINERS ====================

export const CyberCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}> = ({ children, className = '', interactive = false, onClick }) => (
  <div 
    className={`cyber-card ${interactive ? 'cyber-card-interactive cursor-pointer' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const CyberPanel: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`cyber-panel ${className}`}>
    {children}
  </div>
);

// ==================== HEADERS ====================

export const CyberSectionHeader: React.FC<{ 
  title: string; 
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, className = '', actions }) => (
  <div className={`cyber-section-header flex justify-between items-center ${className}`}>
    <div>
      <div className="cyber-section-title">{title}</div>
      {subtitle && <div className="cyber-section-subtitle">{subtitle}</div>}
    </div>
    {actions && <div>{actions}</div>}
  </div>
);

export const CyberPageTitle: React.FC<{ 
  children: React.ReactNode; 
  color?: 'red' | 'blue' | 'green' | 'purple';
  className?: string;
}> = ({ children, color = 'red', className = '' }) => (
  <h2 className={`cyber-page-title cyber-page-title-${color} ${className}`}>
    {children}
  </h2>
);

// ==================== INPUTS ====================

export const CyberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
}> = ({ containerClassName = '', className = '', ...props }) => (
  <input className={`cyber-input ${className}`} {...props} />
);

export const CyberSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {
  containerClassName?: string;
}> = ({ containerClassName = '', className = '', ...props }) => (
  <select className={`cyber-select ${className}`} {...props} />
);

export const CyberSlider: React.FC<{ 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  unit?: string;
  onChange: (value: number) => void; 
  description?: string;
  className?: string;
}> = ({ label, value, min, max, unit, onChange, description, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between">
        <label className="cyber-section-title">{label}</label>
        <span className="text-cyber-purple font-mono text-sm">{value} {unit || ''}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="cyber-slider"
      />
      {description && <p className="text-xs text-cyber-gray-light">{description}</p>}
    </div>
  );
};

// ==================== BUTTONS ====================

export const CyberButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'red' | 'blue' | 'green' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}> = ({ variant = 'red', size = 'md', className = '', children, ...props }) => {
  const baseClass = 'btn-base';
  const sizeClass = `btn-${size}`;
  const variantClass = `btn-${variant}`;
  
  return (
    <button 
      className={`${baseClass} ${sizeClass} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ==================== TABS ====================

export const CyberTabs: React.FC<{
  tabs: { id: string; label: string; color?: 'red' | 'blue' | 'green' | 'purple' | 'yellow' }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}> = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`flex gap-2 bg-cyber-darker p-2 border border-cyber-gray ${className}`}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`cyber-tab cyber-tab-${tab.color || 'blue'} ${
          activeTab === tab.id ? 'cyber-tab-active' : 'text-cyber-gray-light'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

// ==================== BADGES ====================

export const CyberBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'online' | 'offline' | 'warning' | 'info';
  className?: string;
}> = ({ children, variant = 'info', className = '' }) => (
  <span className={`cyber-badge cyber-badge-${variant} ${className}`}>
    {children}
  </span>
);

// ==================== DIVIDERS ====================

export const CyberDivider: React.FC<{
  glow?: boolean;
  className?: string;
}> = ({ glow = false, className = '' }) => (
  <hr className={`${glow ? 'cyber-divider-glow' : 'cyber-divider'} ${className}`} />
);
