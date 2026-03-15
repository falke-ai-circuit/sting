import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// Mock data for attack trends
const attackTrendsData = [
  { date: '2024-01-01', attacks: 45 },
  { date: '2024-01-02', attacks: 52 },
  { date: '2024-01-03', attacks: 38 },
  { date: '2024-01-04', attacks: 67 },
  { date: '2024-01-05', attacks: 89 },
  { date: '2024-01-06', attacks: 76 },
  { date: '2024-01-07', attacks: 94 },
  { date: '2024-01-08', attacks: 112 },
  { date: '2024-01-09', attacks: 98 },
  { date: '2024-01-10', attacks: 125 },
  { date: '2024-01-11', attacks: 143 },
  { date: '2024-01-12', attacks: 156 },
  { date: '2024-01-13', attacks: 132 },
  { date: '2024-01-14', attacks: 167 },
];

// Mock data for geographic distribution
const geoData = [
  { name: 'China', value: 234, color: '#ff0040' },
  { name: 'Russia', value: 156, color: '#8b5cf6' },
  { name: 'USA', value: 123, color: '#00b7ff' },
  { name: 'Brazil', value: 89, color: '#00ff88' },
  { name: 'India', value: 76, color: '#ffff00' },
  { name: 'Germany', value: 54, color: '#ff6600' },
  { name: 'Other', value: 45, color: '#666666' },
];

// Mock data for top attacked ports
const portsData = [
  { port: '22 (SSH)', attacks: 456 },
  { port: '80 (HTTP)', attacks: 312 },
  { port: '443 (HTTPS)', attacks: 234 },
  { port: '3389 (RDP)', attacks: 189 },
  { port: '445 (SMB)', attacks: 156 },
  { port: '21 (FTP)', attacks: 98 },
  { port: '3306 (MySQL)', attacks: 67 },
  { port: '5432 (PostgreSQL)', attacks: 45 },
];

// Mock data for protocol breakdown
const protocolData = [
  { name: 'SSH', value: 42, color: '#8b5cf6' },
  { name: 'HTTP/HTTPS', value: 28, color: '#00b7ff' },
  { name: 'Telnet', value: 15, color: '#ff0040' },
  { name: 'SMB', value: 8, color: '#00ff88' },
  { name: 'FTP', value: 5, color: '#ffff00' },
  { name: 'Other', value: 2, color: '#666666' },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');

  const stats = {
    totalAttacks: 4567,
    uniqueAttackers: 1234,
    topCountry: 'China',
    topPort: '22 (SSH)',
  };

  return (
    <div className="analytics">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-header" style={{ color: '#ff0040', marginBottom: '1.5rem' }}>Attack Analytics</h2>
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`btn-base btn-sm ${timeRange === range ? 'btn-red' : 'btn-gray'}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Attacks</div>
          <div className="text-2xl font-bold text-cyber-red">{stats.totalAttacks.toLocaleString()}</div>
        </div>
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Unique Attackers</div>
          <div className="text-2xl font-bold text-white">{stats.uniqueAttackers.toLocaleString()}</div>
        </div>
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Top Source</div>
          <div className="text-2xl font-bold text-purple-400">{stats.topCountry}</div>
        </div>
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Top Target</div>
          <div className="text-2xl font-bold text-cyan-400">{stats.topPort}</div>
        </div>
      </div>

      {/* Attack Trends Chart */}
      <div className="bg-cyber-dark border border-cyber-gray p-4 mb-6">
        <h3 className="section-header" style={{ marginBottom: '1rem' }}>Attack Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attackTrendsData}>
              <XAxis
                dataKey="date"
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111',
                  border: '1px solid #333',
                  borderRadius: 2,
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="attacks"
                stroke="#ff0040"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#ff0040' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Geographic Distribution */}
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <h3 className="section-header" style={{ marginBottom: '1rem' }}>Geographic Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={geoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {geoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: '1px solid #333',
                    borderRadius: 2,
                    color: '#fff'
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: '#888' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Breakdown */}
        <div className="bg-cyber-dark border border-cyber-gray p-4">
          <h3 className="section-header" style={{ marginBottom: '1rem' }}>Protocol Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: '1px solid #333',
                    borderRadius: 2,
                    color: '#fff'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: '#888' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Attacked Ports - Horizontal Bar Chart */}
      <div className="bg-cyber-dark border border-cyber-gray p-4">
        <h3 className="section-header" style={{ marginBottom: '1rem' }}>Top Attacked Ports</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={portsData} layout="vertical">
              <XAxis type="number" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="port"
                stroke="#666"
                tick={{ fill: '#888', fontSize: 11 }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111',
                  border: '1px solid #333',
                  borderRadius: 2,
                  color: '#fff'
                }}
              />
              <Bar dataKey="attacks" fill="#ff0040" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
