import { useState } from "react";
import "./index.css";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Honeypots from "./components/Honeypots";
import Designer from "./components/Designer";
import Analytics from "./components/Analytics";
import Malware from "./components/Malware";
import { CyberPanel } from "./components/CyberUI";

type Tab = "dashboard" | "honeypots" | "canaries" | "analytics" | "malware" | "designer" | "config";

// Placeholder components for new tabs
const Canaries = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-cyber-red mb-4">Canaries</h2>
    <p className="text-gray-400">Token-based canary deployment and monitoring.</p>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "▣" },
    { id: "honeypots", label: "Honeypots", icon: "◈" },
    { id: "canaries", label: "Canaries", icon: "◇" },
    { id: "analytics", label: "Analytics", icon: "◎" },
    { id: "malware", label: "Malware", icon: "☠" },
    { id: "designer", label: "Designer", icon: "⚡" },
    { id: "config", label: "Config", icon: "⚙" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "honeypots":
        return <Honeypots />;
      case "canaries":
        return <Canaries />;
      case "analytics":
        return <Analytics />;
      case "malware":
        return <Malware />;
      case "designer":
        return <Designer />;
      case "config":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-cyber-black">
      <aside className="w-64 bg-cyber-dark border-r border-cyber-gray flex flex-col">
        <div className="p-4 border-b border-cyber-gray">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyber-red flex items-center justify-center cyber-glow-red">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-cyber-red font-bold text-xl tracking-wider">STING</h1>
              <p className="text-xs text-gray-500">Network Analysis</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-200 border-l-4 ${
                activeTab === tab.id
                  ? "bg-cyber-red/10 border-cyber-red text-cyber-red"
                  : "border-transparent text-gray-400 hover:bg-cyber-gray/30 hover:text-white"
              }`}
            >
              <span className="text-lg w-6 text-center">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-cyber-gray">
          <p className="text-xs text-gray-600">STING v1.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <CyberPanel>{renderContent()}</CyberPanel>
      </main>
    </div>
  );
}

export default App;
