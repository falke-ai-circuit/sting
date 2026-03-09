import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="cyber-section-header">
        <div className="cyber-section-title">Settings</div>
        <div className="cyber-section-subtitle">Configure STING platform</div>
      </div>

      <div className="cyber-card">
        <div className="cyber-section-title mb-4">Platform Configuration</div>
        <div className="space-y-4">
          <div>
            <label className="text-cyber-gray-light text-sm uppercase tracking-wide">Deception Level</label>
            <select className="cyber-select w-full mt-1">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <label className="text-cyber-gray-light text-sm uppercase tracking-wide">Auto-refresh Interval</label>
            <select className="cyber-select w-full mt-1">
              <option>5 seconds</option>
              <option>10 seconds</option>
              <option>30 seconds</option>
              <option>Disabled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="cyber-card">
        <div className="cyber-section-title mb-4">Notifications</div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-cyber-gray-light cursor-pointer">
            <input type="checkbox" className="cyber-input w-4 h-4" defaultChecked />
            <span>Alert on new session</span>
          </label>
          <label className="flex items-center gap-2 text-cyber-gray-light cursor-pointer">
            <input type="checkbox" className="cyber-input w-4 h-4" defaultChecked />
            <span>Alert on canary trigger</span>
          </label>
          <label className="flex items-center gap-2 text-cyber-gray-light cursor-pointer">
            <input type="checkbox" className="cyber-input w-4 h-4" />
            <span>Sound notifications</span>
          </label>
        </div>
      </div>

      <div className="cyber-card">
        <div className="cyber-section-title mb-4">About</div>
        <div className="text-cyber-gray-light text-sm space-y-1">
          <p>STING 2.0 - Deception Platform</p>
          <p>Version: 2.0.0</p>
          <p>Build: 2026.03.09</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
