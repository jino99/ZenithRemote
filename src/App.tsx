/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { 
  Shield, 
  Zap, 
  Network, 
  Cpu, 
  Lock, 
  Terminal, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Globe, 
  Key,
  Monitor,
  MousePointer2,
  FileBox,
  Clipboard,
  ChevronRight,
  Code2,
  Share2,
  Play,
  StopCircle,
  Activity,
  MonitorPlay,
  ExternalLink,
  ArrowUpRight,
  Users,
  BookOpen,
  Puzzle,
  LayoutDashboard,
  BarChart3,
  Settings2,
  HelpCircle,
  Mail,
  MessageSquare,
  Building2,
  History,
  CreditCard,
  UserPlus,
  LogOut,
  LogIn,
  Download,
  FolderSync,
  Settings,
  X,
  Maximize2,
  Minimize2,
  MousePointer,
  Keyboard,
  Send,
  RefreshCw,
  User as UserIcon,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Target,
  MoreVertical,
  Video,
  HardDrive
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Area 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';

// Mock User Type
interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  licenseStatus: string;
  emailVerified: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let displayError = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) displayError = `System Error: ${parsed.error}`;
      } catch (e) {
        displayError = this.state.error.message || displayError;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center space-y-6 border-red-500/20">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">System Error</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">{displayError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all"
            >
              Reload Application
            </button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const ConnectionQualityIndicator = ({ latency, packetLoss }: { latency: number, packetLoss: number }) => {
  const getQuality = () => {
    if (latency > 300 || packetLoss > 5) return { label: 'Poor', color: 'bg-red-500', bars: 1 };
    if (latency > 150 || packetLoss > 1) return { label: 'Fair', color: 'bg-amber-500', bars: 2 };
    if (latency > 50 || packetLoss > 0.1) return { label: 'Good', color: 'bg-blue-500', bars: 3 };
    return { label: 'Excellent', color: 'bg-emerald-500', bars: 4 };
  };

  const quality = getQuality();

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50 group relative cursor-help">
      <div className="flex items-end gap-0.5 h-3">
        {[1, 2, 3, 4].map((bar) => (
          <div 
            key={bar} 
            className={cn(
              "w-1 rounded-full transition-all duration-300",
              bar <= quality.bars ? quality.color : "bg-zinc-700"
            )}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
      <div className="flex flex-col">
        <span className={cn("text-[8px] font-bold uppercase tracking-widest leading-none", quality.color.replace('bg-', 'text-'))}>
          {quality.label}
        </span>
        <span className="text-[7px] text-zinc-500 font-mono leading-none mt-0.5">
          {Math.round(latency)}ms • {packetLoss.toFixed(2)}%
        </span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-[10px] text-zinc-500 uppercase">Latency</span>
            <span className="text-[10px] font-mono text-white">{Math.round(latency)}ms</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[10px] text-zinc-500 uppercase">Packet Loss</span>
            <span className="text-[10px] font-mono text-white">{packetLoss.toFixed(3)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, icon: Icon }: { title: string, subtitle: string, icon: any }) => (
  <div className="mb-12">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-emerald-500/10 rounded-lg">
        <Icon className="w-6 h-6 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-mono">{title}</h2>
    </div>
    <p className="text-zinc-400 max-w-2xl leading-relaxed">{subtitle}</p>
  </div>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string, key?: any }) => (
  <div className={cn("bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'emerald' | 'amber', className?: string, key?: any }) => {
  const variants = {
    default: "bg-zinc-800 text-zinc-300",
    emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", variants[variant], className)}>
      {children}
    </span>
  );
};

// --- RDP Logic ---

type Role = 'idle' | 'host' | 'client';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface RemoteCursor {
  x: number;
  y: number;
  visible: boolean;
}

const AdvancedStatsOverlay = ({ stats, onClose }: { stats: any, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="absolute top-20 right-6 z-50 w-72 bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl"
  >
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
        <Activity className="w-4 h-4" /> Advanced Metrics
      </h3>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
        <X className="w-4 h-4 text-zinc-500" />
      </button>
    </div>
    
    <div className="space-y-6">
      <div className="space-y-4">
        {[
          { label: 'Round Trip Time', value: `${Math.round(stats.latency)} ms`, sub: 'Direct P2P' },
          { label: 'Packet Jitter', value: `${(Math.random() * 2).toFixed(2)} ms`, sub: 'Network Stability' },
          { label: 'Frame Delay', value: `${(stats.latency / 2 + 2).toFixed(1)} ms`, sub: 'Glass-to-Glass' },
          { label: 'Video Bitrate', value: stats.bitrate, sub: 'H.264 / AVC' },
          { label: 'Audio Bitrate', value: '128 kbps', sub: 'Opus / Stereo' },
          { label: 'Packet Loss', value: `${stats.packetLoss.toFixed(3)}%`, sub: 'SCTP Retransmits' },
          { label: 'Resolution', value: '1920x1080', sub: 'Native Aspect' },
          { label: 'Refresh Rate', value: `${stats.fps} Hz`, sub: 'Hardware Sync' }
        ].map((item) => (
          <div key={item.label} className="flex justify-between items-start border-b border-zinc-800/50 pb-2 last:border-0">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{item.label}</p>
              <p className="text-[8px] text-zinc-600 uppercase tracking-widest">{item.sub}</p>
            </div>
            <p className="text-xs font-mono font-bold text-emerald-400">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
    
    <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">End-to-End Encrypted (AES-256)</p>
    </div>
  </motion.div>
);

const SessionSummaryModal = ({ summary, onClose }: { summary: any, onClose: () => void }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.1)]"
    >
      <div className="p-10 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -z-10" />
        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-4xl font-bold uppercase tracking-tighter mb-2">Session Complete</h2>
        <p className="text-zinc-500 font-medium">Session ID: <span className="font-mono text-zinc-300">{summary.id}</span></p>
      </div>
      
      <div className="px-10 pb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Duration', value: summary.duration, icon: History },
          { label: 'Data Used', value: summary.data, icon: Activity },
          { label: 'Avg Latency', value: summary.avgLatency, icon: Zap },
          { label: 'Actions', value: summary.actions, icon: Terminal }
        ].map((stat) => (
          <div key={stat.label} className="bg-black/40 border border-zinc-800 rounded-2xl p-4 text-center">
            <stat.icon className="w-5 h-5 text-emerald-500 mx-auto mb-3 opacity-50" />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-lg font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="px-10 pb-10 space-y-4">
        <div className="bg-zinc-800/30 rounded-2xl p-6 border border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security Audit
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Encryption Protocol</span>
              <span className="text-emerald-500 font-mono font-bold">DTLS-SRTP (AES-256)</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Authentication Method</span>
              <span className="text-zinc-300 font-bold">OAuth 2.0 + Dynamic Pass</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Compliance Status</span>
              <Badge variant="emerald">SOC2 Type II</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] uppercase tracking-widest text-xs"
          >
            Return to Dashboard
          </button>
          <button className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Log
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

const LatencyGraph = ({ latency }: { latency: number }) => {
  const [points, setPoints] = useState<number[]>(new Array(30).fill(latency));

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => [...prev.slice(1), latency]);
    }, 200);
    return () => clearInterval(interval);
  }, [latency]);

  const max = Math.max(...points, 50);
  const min = Math.min(...points, 5);

  return (
    <div className="h-12 w-32 flex items-end gap-[1px]">
      {points.map((p, i) => {
        const height = ((p - min) / (max - min)) * 100;
        return (
          <div 
            key={i} 
            className={cn(
              "flex-1 rounded-t-[1px] transition-all duration-200",
              p > 100 ? "bg-red-500" : p > 50 ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ height: `${Math.max(5, height)}%` }}
          />
        );
      })}
    </div>
  );
};
const SessionToolbar = ({ 
  onDisconnect, 
  onToggleStats, 
  onToggleChat, 
  onToggleInput, 
  isCaptured, 
  quality, 
  setQuality,
  isRecording,
  onToggleRecording,
  isLowLatency,
  onToggleLowLatency
}: { 
  onDisconnect: () => void, 
  onToggleStats: () => void, 
  onToggleChat: () => void, 
  onToggleInput: () => void, 
  isCaptured: boolean,
  quality: string,
  setQuality: (q: any) => void,
  isRecording: boolean,
  onToggleRecording: () => void,
  isLowLatency: boolean,
  onToggleLowLatency: () => void
}) => (
  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
    <div className="flex items-center gap-1 px-2 border-r border-white/10 mr-1">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[8px] font-black text-white uppercase tracking-widest">Live</span>
    </div>

    <div className="flex items-center gap-1">
      <button 
        onClick={onToggleInput}
        className={cn(
          "p-2.5 rounded-xl transition-all group relative",
          isCaptured ? "bg-emerald-500 text-black" : "text-zinc-400 hover:bg-white/10"
        )}
      >
        <MousePointer2 className="w-4 h-4" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black border border-white/10 rounded text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {isCaptured ? 'Release Input' : 'Capture Input'}
        </div>
      </button>

      <button 
        onClick={onToggleRecording}
        className={cn(
          "p-2.5 rounded-xl transition-all group relative",
          isRecording ? "bg-red-500 text-white animate-pulse" : "text-zinc-400 hover:bg-white/10"
        )}
      >
        <Video className="w-4 h-4" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black border border-white/10 rounded text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </div>
      </button>

      <button 
        onClick={onToggleLowLatency}
        className={cn(
          "p-2.5 rounded-xl transition-all group relative",
          isLowLatency ? "bg-amber-500 text-black" : "text-zinc-400 hover:bg-white/10"
        )}
      >
        <Zap className="w-4 h-4" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black border border-white/10 rounded text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {isLowLatency ? 'Standard Mode' : 'Ultra-Low Latency'}
        </div>
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <div className="flex items-center gap-1">
        <button className="p-2.5 rounded-xl text-zinc-400 hover:bg-white/10 transition-all group relative">
          <RefreshCw className="w-4 h-4" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black border border-white/10 rounded text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Remote Reboot
          </div>
        </button>
        <button className="p-2.5 rounded-xl text-zinc-400 hover:bg-white/10 transition-all group relative">
          <Terminal className="w-4 h-4" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black border border-white/10 rounded text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Send Ctrl+Alt+Del
          </div>
        </button>
      </div>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <select 
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
        className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-400 outline-none px-2 cursor-pointer hover:text-white transition-colors"
      >
        <option value="low">Low Res</option>
        <option value="medium">Medium</option>
        <option value="high">1080p Ultra</option>
      </select>

      <button 
        onClick={onToggleStats}
        className="p-2.5 rounded-xl text-zinc-400 hover:bg-white/10 transition-all group relative"
      >
        <Activity className="w-4 h-4" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black border border-white/10 rounded text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Network Stats
        </div>
      </button>
    </div>

    <div className="w-px h-4 bg-white/10 mx-1" />

    <button 
      onClick={onDisconnect}
      className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
    >
      <StopCircle className="w-4 h-4" /> Terminate
    </button>
  </div>
)
const DashboardOverview = ({ 
  recentActivity,
  sessionId,
  password,
  generateSession,
  startHost,
  userProfile,
  addLog,
  inputSessionId,
  setInputSessionId,
  inputPassword,
  setInputPassword,
  startClient,
  isConnecting
}: { 
  recentActivity: any[],
  sessionId: string,
  password: string,
  generateSession: () => void,
  startHost: () => void,
  userProfile: any,
  addLog: (msg: string) => void,
  inputSessionId: string,
  setInputSessionId: (val: string) => void,
  inputPassword: string,
  setInputPassword: (val: string) => void,
  startClient: () => void,
  isConnecting: boolean
}) => {
  const data = [
    { name: 'Mon', sessions: 12, data: 450 },
    { name: 'Tue', sessions: 19, data: 820 },
    { name: 'Wed', sessions: 15, data: 610 },
    { name: 'Thu', sessions: 22, data: 940 },
    { name: 'Fri', sessions: 30, data: 1200 },
    { name: 'Sat', sessions: 8, data: 300 },
    { name: 'Sun', sessions: 5, data: 150 },
  ];

  return (
    <div className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Sessions', value: '112', icon: Monitor, trend: '+12%', color: 'text-emerald-500' },
          { label: 'Data Transferred', value: '4.2 GB', icon: Activity, trend: '+8%', color: 'text-blue-500' },
          { label: 'Avg. Latency', value: '24ms', icon: Zap, trend: '-15%', color: 'text-amber-500' },
          { label: 'Active Agents', value: '8', icon: Users, trend: 'Stable', color: 'text-purple-500' },
        ].map((stat) => (
          <Card key={stat.label} className="p-6 bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-2xl bg-zinc-800 group-hover:scale-110 transition-transform", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-800", stat.trend.startsWith('+') ? 'text-emerald-500' : stat.trend.startsWith('-') ? 'text-blue-500' : 'text-zinc-500')}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Core Actions: Host & Client - MOVED BELOW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Host Card (Active) */}
          <Card className="relative overflow-hidden group border-emerald-500/20 bg-emerald-500/[0.02] p-8">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <MonitorPlay className="w-48 h-48 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <Share2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Allow Remote Control</h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mt-1">
                      <Shield className="w-3 h-3" /> Encrypted Session
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-zinc-400 mb-10 leading-relaxed text-sm font-medium max-w-md">
                Share your screen with a support agent or colleague. They will be able to see your screen and guide you with a remote cursor.
              </p>
              
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <UserIcon className="w-3 h-3" /> Your ID
                    </label>
                    <div className="relative group/id">
                      <div className="bg-black/60 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 font-mono text-center text-2xl tracking-[0.2em] text-white shadow-inner">
                        {sessionId || '--- --- ---'}
                      </div>
                      {sessionId && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(sessionId);
                            addLog('Session ID copied to clipboard');
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white opacity-0 group-hover/id:opacity-100 transition-all hover:scale-110"
                        >
                          <Clipboard className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Password
                    </label>
                    <div className="relative group/pass">
                      <div className="bg-black/60 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 font-mono text-center text-2xl tracking-[0.2em] text-emerald-400 shadow-inner">
                        {password || '------'}
                      </div>
                      {password && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(password);
                            addLog('Password copied to clipboard');
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white opacity-0 group-hover/pass:opacity-100 transition-all hover:scale-110"
                        >
                          <Clipboard className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={generateSession}
                    disabled={userProfile?.role === 'Viewer'}
                    className={cn(
                      "flex-1 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 border uppercase tracking-widest text-xs",
                      userProfile?.role === 'Viewer' 
                        ? "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed" 
                        : "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 hover:border-zinc-600 active:scale-95"
                    )}
                  >
                    <RefreshCw className="w-4 h-4" /> New Session
                  </button>
                  <button 
                    onClick={() => startHost()}
                    disabled={userProfile?.role === 'Viewer'}
                    className={cn(
                      "flex-[2] font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(16,185,129,0.2)] uppercase tracking-widest text-xs",
                      userProfile?.role === 'Viewer'
                        ? "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95"
                    )}
                  >
                    <Play className="w-4 h-4 fill-current" /> Start Sharing
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Client Card (Active) */}
          <Card className="relative overflow-hidden group border-cyan-500/20 bg-cyan-500/[0.02] p-8">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <MousePointer2 className="w-48 h-48 text-cyan-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <ExternalLink className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Control Remote Computer</h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest mt-1">
                      <ShieldCheck className="w-3 h-3" /> Secure Tunnel
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-zinc-400 mb-10 leading-relaxed text-sm font-medium max-w-md">
                Enter the partner's ID and password to establish a secure, encrypted connection for remote assistance.
              </p>
              
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Target className="w-3 h-3" /> Partner ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="000 000 000"
                      value={inputSessionId}
                      onChange={e => setInputSessionId(e.target.value)}
                      className="w-full bg-black/60 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 font-mono text-center text-2xl tracking-[0.2em] focus:border-cyan-500 outline-none transition-all text-white placeholder:text-zinc-800 shadow-inner"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Key className="w-3 h-3" /> Password
                    </label>
                    <input 
                      type="password" 
                      placeholder="••••••"
                      value={inputPassword}
                      onChange={e => setInputPassword(e.target.value)}
                      className="w-full bg-black/60 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 font-mono text-center text-2xl tracking-[0.2em] focus:border-cyan-500 outline-none transition-all text-cyan-400 placeholder:text-zinc-800 shadow-inner"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => startClient()}
                  disabled={isConnecting || userProfile?.role === 'Viewer'}
                  className={cn(
                    "w-full font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(6,182,212,0.2)] uppercase tracking-widest text-xs",
                    (isConnecting || userProfile?.role === 'Viewer')
                      ? "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-400 text-black active:scale-95"
                  )}
                >
                  {isConnecting ? (
                    <Activity className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                  {isConnecting ? 'Establishing Secure Connection...' : 'Connect to Partner'}
                </button>
              </div>
            </div>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8 bg-zinc-900/30 border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Usage Analytics
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded-lg uppercase tracking-widest">Week</button>
              <button className="px-3 py-1 bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded-lg uppercase tracking-widest hover:text-white">Month</button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 bg-zinc-900/30 border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security Health
          </h3>
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="58" fill="none" stroke="#1f2937" strokeWidth="8" />
                  <circle cx="64" cy="64" r="58" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray="364" strokeDashoffset={364 * (1 - 0.85)} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black tracking-tighter">85%</span>
                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Secure</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'E2E Encryption', status: 'Active', color: 'text-emerald-500' },
                { label: 'MFA Status', status: 'Enabled', color: 'text-emerald-500' },
                { label: 'Audit Logging', status: 'Active', color: 'text-emerald-500' },
                { label: 'IP Whitelisting', status: 'Active', color: 'text-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.label}</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", item.color)}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-zinc-900/30 border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Activity
            </h3>
            <button className="text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-zinc-800 group hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    {activity.type === 'Remote Session' ? <Monitor className="w-4 h-4 text-emerald-500" /> : 
                     activity.type === 'File Transfer' ? <FileBox className="w-4 h-4 text-blue-500" /> :
                     activity.type === 'Security Audit' ? <Shield className="w-4 h-4 text-amber-500" /> :
                     <Users className="w-4 h-4 text-purple-500" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white uppercase tracking-tighter">{activity.type}</p>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{activity.time}</p>
                  </div>
                </div>
                <Badge variant={activity.status === 'Completed' || activity.status === 'Success' || activity.status === 'Passed' ? 'emerald' : 'default'} className="text-[8px]">
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'website' | 'dashboard'>('website');
  const [activeTab, setActiveTab] = useState<'home' | 'architecture' | 'security' | 'resources' | 'audit' | 'settings' | 'overview' | 'history'>('home');
  const [role, setRole] = useState<Role>('idle');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [password, setPassword] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSessionOnly, setIsSessionOnly] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInputCaptured, setIsInputCaptured] = useState(false);
  const [captureMode, setCaptureMode] = useState<'full' | 'pointer'>('full');
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionStats, setConnectionStats] = useState({
    latency: 12,
    packetLoss: 0.02,
    type: 'P2P (Direct)',
    bitrate: '5.4 Mbps',
    fps: 60
  });
  const [remoteCursor, setRemoteCursor] = useState<RemoteCursor>({ x: 0, y: 0, visible: false });
  const [sessionHistory, setSessionHistory] = useState<{id: string, date: string, role: string, dataUsage: number}[]>([]);
  const [sharedFiles, setSharedFiles] = useState<{ name: string, size: number, type: string, data?: string }[]>([]);
  const [isLowLatencyMode, setIsLowLatencyMode] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [recentActivity, setRecentActivity] = useState<{id: string, type: string, user: string, time: string, status: string}[]>([
    { id: 'act-1', type: 'Remote Session', user: 'lagravineseit@gmail.com', time: '2 mins ago', status: 'Completed' },
    { id: 'act-2', type: 'File Transfer', user: 'lagravineseit@gmail.com', time: '15 mins ago', status: 'Success' },
    { id: 'act-3', type: 'Security Audit', user: 'System', time: '1 hour ago', status: 'Passed' },
    { id: 'act-4', type: 'Team Invite', user: 'lagravineseit@gmail.com', time: '3 hours ago', status: 'Pending' },
  ]);
  
  const [actionLogs, setActionLogs] = useState<{ id: string, action: string, timestamp: number, details?: string }[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string, name: string, email: string, role: string, status: string, avatar?: string }[]>([]);

  const updateMemberRole = async (memberId: string, newRole: string) => {
    setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    addLog(`Updated member role to ${newRole}`);
  };
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const getShortcut = (key: string) => {
    return isMac ? `⌘⌥${key.toUpperCase()}` : `Ctrl+Alt+${key.toUpperCase()}`;
  };
  const [userProfile, setUserProfile] = useState<any>(null);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [showChatToast, setShowChatToast] = useState(false);

  const securityChecklist = useMemo(() => [
    { label: "E2E Encryption", status: "Active", checked: true },
    { label: "Audit Logging", status: "Enabled", checked: true },
    { label: "Email Verified", status: user?.emailVerified ? "Verified" : "Pending", checked: !!user?.emailVerified },
    { label: "Team Isolation", status: "Active", checked: true }
  ], [user?.emailVerified]);

  const securityScore = useMemo(() => 
    Math.round((securityChecklist.filter(i => i.checked).length / securityChecklist.length) * 100)
  , [securityChecklist]);
  
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Member');
  
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setConnectionStats(prev => {
          // Add some random spikes to make it look real
          const isSpike = Math.random() > 0.95;
          const baseLatency = isLowLatencyMode ? 12 : 24;
          const latencyChange = isSpike ? (Math.random() * 50) : (Math.random() * 4 - 2);
          const lossChange = isSpike ? (Math.random() * 0.5) : (Math.random() * 0.02 - 0.01);

          return {
            ...prev,
            latency: Math.max(isLowLatencyMode ? 5 : 8, Math.min(450, prev.latency + latencyChange)),
            packetLoss: Math.max(0, Math.min(10, prev.packetLoss + lossChange)),
            bitrate: isLowLatencyMode ? (1.5 + Math.random() * 0.5).toFixed(1) + ' Mbps' : (4 + Math.random() * 2).toFixed(1) + ' Mbps'
          };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  useEffect(() => {
    const handlePointerLockChange = () => {
      if (document.pointerLockElement !== videoRef.current) {
        setIsInputCaptured(false);
      }
    };

    const handlePointerLockError = (e: Event) => {
      console.error('Pointer lock error:', e);
      setIsInputCaptured(false);
      addLog('Failed to capture pointer. Please click the video area to try again.');
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const toggleInputCapture = async () => {
    try {
      if (!isInputCaptured) {
        if (videoRef.current) {
          const promise = videoRef.current.requestPointerLock();
          // Some browsers return a promise, some don't
          if (promise && 'catch' in promise) {
            await (promise as Promise<void>).catch((err) => {
              console.error('Pointer lock request failed:', err);
              setIsInputCaptured(false);
            });
          }
          setIsInputCaptured(true);
          videoRef.current.focus();
        }
      } else {
        document.exitPointerLock();
        setIsInputCaptured(false);
      }
    } catch (err) {
      console.error('Error toggling input capture:', err);
      setIsInputCaptured(false);
    }
  };

  const handleLogin = async () => {
    try {
      // Open mock SSO popup
      const authWindow = window.open('/auth/google', 'zenith_auth', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'AUTH_SUCCESS') {
          const userData = event.data.user;
          setUser(userData);
          setUserProfile(userData);
          setIsAuthReady(true);
          setView('dashboard');
          setActiveTab('home');
          addLog(`Logged in as ${userData.displayName}`);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error("Login Error:", err);
      addLog("Login failed: " + (err as Error).message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setUserProfile(null);
      setRole('idle');
      setIsConnected(false);
      setView('website');
      setActiveTab('home');
      addLog("Logged out successfully");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const recordAction = async (action: string, details?: string) => {
    const newAction = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      timestamp: Date.now(),
      details
    };
    setActionLogs(prev => [newAction, ...prev.slice(0, 99)]);
    addLog(`Action recorded: ${action}`);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setUserProfile(data.user);
          setView('dashboard');
          setActiveTab('home');
        }
      } catch (err) {
        console.log("Not logged in");
      } finally {
        setIsAuthReady(true);
      }
    };
    checkAuth();

    // Mock data initialization
    setSessionHistory([
      { id: 'ZN-8821', date: new Date(Date.now() - 3600000).toLocaleString(), role: 'Host', dataUsage: 1.2 },
      { id: 'ZN-4412', date: new Date(Date.now() - 86400000).toLocaleString(), role: 'Client', dataUsage: 0.8 },
      { id: 'ZN-1109', date: new Date(Date.now() - 172800000).toLocaleString(), role: 'Host', dataUsage: 2.5 }
    ]);

    setTeamMembers([
      { id: '1', name: 'Alex Rivera', email: 'alex@zenith.com', role: 'Admin', status: 'Online', avatar: 'https://picsum.photos/seed/alex/100/100' },
      { id: '2', name: 'Sarah Chen', email: 'sarah@zenith.com', role: 'Member', status: 'Offline', avatar: 'https://picsum.photos/seed/sarah/100/100' },
      { id: '3', name: 'James Wilson', email: 'james@zenith.com', role: 'Member', status: 'Online', avatar: 'https://picsum.photos/seed/james/100/100' }
    ]);
  }, []);

  useEffect(() => {
    // Load history from local storage as fallback or initial state
    if (!user) {
      const history = localStorage.getItem('zenith_history');
      if (history) setSessionHistory(JSON.parse(history));
    }

    socketRef.current = io();
    
    socketRef.current.on('connect', () => {
      addLog('Signaling server connected');
    });

    socketRef.current.on('disconnect', () => {
      addLog('Signaling server disconnected. Attempting to reconnect...');
      // If we were in a session, trigger unexpected disconnect
      if (isConnected) {
        handleDisconnect(true);
      }
    });

    socketRef.current.on('signal', ({ signal, from }) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    socketRef.current.on('client-joined', ({ clientId }) => {
      addLog(`Client ${clientId} joined. Establishing P2P...`);
    });

    socketRef.current.on('session-not-found', () => {
      setIsConnecting(false);
      alert('Session not found or incorrect password');
    });

    return () => {
      socketRef.current?.disconnect();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (showChatToast) {
      const timer = setTimeout(() => setShowChatToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showChatToast]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleFullScreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (role === 'client' && isConnected) {
        const isModifier = isMac ? (e.metaKey && e.altKey) : (e.ctrlKey && e.altKey);
        
        // RDP Shortcuts
        if (isModifier && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          toggleFullScreen();
        }
        if (isModifier && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setIsChatOpen(prev => !prev);
        }
        if (isModifier && e.key.toLowerCase() === 's') {
          e.preventDefault();
          stopSession();
        }
        if (e.key === 'Escape' && isFullScreen) {
          setIsFullScreen(false);
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [role, isConnected, isFullScreen, isMac]);

  const addMember = () => {
    if (!user) return;
    setShowAddMemberModal(true);
  };

  const submitAddMember = async () => {
    if (!newMemberEmail || !newMemberName) return;

    const newMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      status: "Active",
      addedAt: Date.now()
    };
    
    setTeamMembers(prev => [...prev, newMember]);
    addLog(`Team member ${newMemberName} invited as ${newMemberRole}`);
    recordAction('Team Management', `Added team member: ${newMemberEmail} (${newMemberRole})`);
    setShowAddMemberModal(false);
    setNewMemberEmail('');
    setNewMemberName('');
    setNewMemberRole('Member');
  };

  const generateSession = () => {
    const id = Math.floor(100000000 + Math.random() * 900000000).toString();
    const pass = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionId(id);
    setPassword(pass);
  };

  const startHost = async (isReconnect = false) => {
    if (!isSessionOnly && !isReconnect && view === 'dashboard') {
      let targetId = sessionId;
      let targetPass = password;
      if (!targetId || !targetPass) {
        targetId = Math.floor(100000000 + Math.random() * 900000000).toString();
        targetPass = Math.random().toString(36).substring(2, 8).toUpperCase();
        setSessionId(targetId);
        setPassword(targetPass);
      }
      const url = `${window.location.origin}/?session=${targetId}&pass=${targetPass}&role=host`;
      window.open(url, '_blank');
      return;
    }
    if (!sessionId) generateSession();
    recordAction('Host Initialization', isReconnect ? 'Attempting to reconnect as host' : 'User requested to start a new host session');
    try {
      let stream = streamRef.current;
      
      // Request screen access only if not reconnecting or if stream is dead
      if (!isReconnect || !stream || !stream.active) {
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: 'always' } as any, 
          audio: false 
        });
        streamRef.current = stream;
      }
      
      setRole('host');
      if (!isReconnect) addLog('Screen capture started. Waiting for client...');
      else addLog('Re-initializing host session...');

      socketRef.current?.emit('create-session', { sessionId, password });

      if (peerRef.current) {
        peerRef.current.destroy();
      }

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream
      });

      peer.on('signal', signal => {
        socketRef.current?.emit('signal', { sessionId, signal });
      });

      peer.on('connect', () => {
        setIsConnected(true);
        if (isReconnecting) addLog('Reconnection successful!');
        setIsReconnecting(false);
        setReconnectAttempts(0);
        addLog('Client connected to session');
        saveToHistory(sessionId, 'Host');
        recordAction('Session Established', `Host started session ${sessionId}`);
      });

      peer.on('data', data => {
        const payload = JSON.parse(data.toString());
        if (payload.type === 'chat') {
          setMessages(prev => [...prev, payload.message]);
          setLastMessage(payload.message);
          setIsRemoteTyping(false);
          if (!isChatOpen) setShowChatToast(true);
          recordAction('Message Received', `From Client: ${payload.message.text.substring(0, 20)}...`);
        } else if (payload.type === 'typing') {
          setIsRemoteTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsRemoteTyping(false), 3000);
        } else if (payload.type === 'cursor') {
          setRemoteCursor({ x: payload.x, y: payload.y, visible: true });
        } else if (payload.type === 'input') {
          // Visual feedback for remote input in demo
          addLog(`Remote Input: ${payload.inputType}`);
        } else if (payload.type === 'file') {
          setSharedFiles(prev => [...prev, payload.file]);
          addLog(`Received file: ${payload.file.name}`);
          recordAction('File Received', `Name: ${payload.file.name} (${(payload.file.size / 1024).toFixed(1)} KB)`);
        }
      });

      peer.on('close', () => {
        handleDisconnect(true);
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        handleDisconnect(true);
      });

      peerRef.current = peer;
    } catch (err) {
      console.error(err);
      addLog('Error: ' + (err as Error).message);
    }
  };

  const startClient = (isReconnect = false) => {
    if (!isSessionOnly && !isReconnect && view === 'dashboard') {
      if (!inputSessionId || !inputPassword) {
        addLog('Please enter Partner ID and Password');
        return;
      }
      const url = `${window.location.origin}/?session=${inputSessionId}&pass=${inputPassword}&role=client`;
      window.open(url, '_blank');
      return;
    }
    const targetSessionId = isReconnect ? sessionId : inputSessionId;
    const targetPassword = isReconnect ? password : inputPassword;
    
    if (!targetSessionId || !targetPassword) {
      if (!isReconnect) alert('Enter Session ID and Password');
      return;
    }
    
    setIsConnecting(true);
    setRole('client');
    setSessionId(targetSessionId);
    if (!isReconnect) setPassword(targetPassword);
    
    recordAction('Client Initialization', isReconnect ? `Attempting to reconnect to session ${targetSessionId}` : `User attempting to join session ${targetSessionId}`);
    socketRef.current?.emit('join-session', { sessionId: targetSessionId, password: targetPassword });

    if (peerRef.current) {
      peerRef.current.destroy();
    }

    const peer = new Peer({
      initiator: true,
      trickle: false
    });

    peer.on('signal', signal => {
      socketRef.current?.emit('signal', { sessionId: inputSessionId, signal });
    });

    peer.on('stream', stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        addLog('Remote stream received');
      }
    });

    peer.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      if (isReconnecting) addLog('Reconnection successful!');
      setIsReconnecting(false);
      setReconnectAttempts(0);
      addLog('Connected to host');
      saveToHistory(inputSessionId, 'Client');
      recordAction('Session Established', `Client joined session ${inputSessionId}`);
    });

    peer.on('data', data => {
      const payload = JSON.parse(data.toString());
      if (payload.type === 'chat') {
        setMessages(prev => [...prev, payload.message]);
        setLastMessage(payload.message);
        setIsRemoteTyping(false);
        if (!isChatOpen) setShowChatToast(true);
        recordAction('Message Received', `From Host: ${payload.message.text.substring(0, 20)}...`);
      } else if (payload.type === 'typing') {
        setIsRemoteTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsRemoteTyping(false), 3000);
      } else if (payload.type === 'file') {
        setSharedFiles(prev => [...prev, payload.file]);
        addLog(`Received file: ${payload.file.name}`);
        recordAction('File Received', `Name: ${payload.file.name} (${(payload.file.size / 1024).toFixed(1)} KB)`);
      }
    });

    peer.on('close', () => {
      handleDisconnect(true);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      handleDisconnect(true);
    });

    peerRef.current = peer;
  };

  const handleDisconnect = (unexpected = false) => {
    // If we are already in a reconnection delay, don't trigger another one
    if (unexpected && reconnectTimeoutRef.current) return;

    if (!unexpected) {
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      recordAction('Session Terminated', 'User disconnected from session');
      setIsConnected(false);
      setIsConnecting(false);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      setRole('idle');
      setRemoteCursor({ x: 0, y: 0, visible: false });
      addLog('Session disconnected');
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      return;
    }

    recordAction('Session Terminated', 'Session dropped unexpectedly');
    setIsConnected(false);
    setIsConnecting(false);
    
    if (reconnectAttempts < 5) {
      setIsReconnecting(true);
      const nextAttempt = reconnectAttempts + 1;
      setReconnectAttempts(nextAttempt);
      addLog(`Connection lost. Attempting to reconnect (${nextAttempt}/5) in 3s...`);
      
      // Attempt reconnection after a delay
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        // Only proceed if still in reconnecting state (user hasn't canceled)
        if (role === 'host') {
          startHost(true);
        } else if (role === 'client') {
          startClient(true);
        }
      }, 3000);
    } else {
      setIsReconnecting(false);
      setReconnectAttempts(0);
      setRole('idle');
      setRemoteCursor({ x: 0, y: 0, visible: false });
      addLog('Session dropped. Reconnection failed after 5 attempts.');
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    }
  };

  const saveToHistory = async (id: string, role: string) => {
    const normalizedRole = role.toLowerCase();
    const newEntry = { id, date: new Date().toLocaleString(), role: normalizedRole, dataUsage: Math.floor(Math.random() * 1024 * 1024 * 50) };
    const updated = [newEntry, ...sessionHistory.slice(0, 9)];
    setSessionHistory(updated);
    localStorage.setItem('zenith_history', JSON.stringify(updated));
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !peerRef.current) return;
    const msg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: role === 'host' ? 'Host' : 'Client',
      text: chatInput,
      timestamp: Date.now()
    };
    const payload = { type: 'chat', message: msg };
    peerRef.current.send(JSON.stringify(payload));
    setMessages(prev => [...prev, msg]);
    setChatInput('');
    recordAction('Message Sent', msg.text.substring(0, 20) + '...');
  };

  const sendCursorPos = (e: React.MouseEvent) => {
    if (role === 'client' && peerRef.current && isConnected) {
      const rect = videoRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      peerRef.current.send(JSON.stringify({ type: 'cursor', x, y }));
    }
  };

  const handleRemoteInput = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (role === 'client' && peerRef.current && isConnected && isInputCaptured) {
      // If in pointer mode, ignore keyboard events
      if (captureMode === 'pointer' && 'key' in e) return;
      
      e.preventDefault();
      const payload: any = { type: 'input' };
      
      if ('key' in e) {
        payload.inputType = 'keyboard';
        payload.key = e.key;
        payload.event = e.type;
      } else {
        payload.inputType = 'mouse';
        payload.button = e.button;
        payload.event = e.type;
      }
      
      peerRef.current.send(JSON.stringify(payload));
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalDataTransferred = sessionHistory.reduce((acc, curr: any) => acc + (curr.dataUsage || 0), 0);
  
  const calculateSecurityScore = () => {
    let score = 90; // Base score for ZREMOTE
    if (user?.emailVerified) score += 5;
    if (actionLogs.length > 10) score += 5;
    return Math.min(score, 100);
  };

  const stopSession = () => {
    const duration = Math.floor(Math.random() * 45) + 15; // Simulated duration
    const data = (Math.random() * 500 + 100).toFixed(1) + ' MB';
    
    setSessionSummary({
      id: sessionId,
      duration: `${duration}m 12s`,
      data: data,
      avgLatency: `${Math.round(connectionStats.latency)}ms`,
      actions: actionLogs.length
    });
    
    peerRef.current?.destroy();
    handleDisconnect();
    setShowSessionSummary(true);
  };

  const handleFileShare = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !peerRef.current) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string
      };
      const payload = { type: 'file', file: fileData };
      peerRef.current?.send(JSON.stringify(payload));
      setSharedFiles(prev => [...prev, fileData]);
      addLog(`Shared file: ${file.name}`);
      recordAction('File Shared', `Name: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.readAsDataURL(file);
  };

  const downloadFile = (file: any) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    const passParam = params.get('pass');
    const roleParam = params.get('role');

    if (sessionParam && passParam && roleParam) {
      setIsSessionOnly(true);
      setSessionId(sessionParam);
      setPassword(passParam);
      setInputSessionId(sessionParam);
      setInputPassword(passParam);
      setRole(roleParam as Role);
      
      // Auto-start if we have the params and not already connected
      if (!isConnected && !isConnecting) {
        if (roleParam === 'host') {
          startHost();
        } else if (roleParam === 'client') {
          startClient();
        }
      }
    }
  }, [isConnected, isConnecting]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-emerald-500/30 flex flex-col">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      {!isSessionOnly && view === 'website' && (
        <header className="relative border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
              <Zap className="w-5 h-5 text-black fill-current" />
            </div>
            <span className="font-mono font-bold tracking-tighter text-xl uppercase">Zenith<span className="text-emerald-500">Remote</span></span>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {view === 'website' ? (
              [
                { id: 'home', label: 'Home', icon: LayoutDashboard },
                { id: 'architecture', label: 'Tech', icon: Layers },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'resources', label: 'Resources', icon: BookOpen },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    activeTab === item.id 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))
            ) : (
              [
                { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'audit', label: 'Audit', icon: History },
                { id: 'settings', label: 'Settings', icon: Settings2 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    activeTab === item.id 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))
            )}
          </nav>
          <div className="flex items-center gap-4">
            {user && (
              <button 
                onClick={() => setView('dashboard')}
                className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all"
              >
                Go to Dashboard
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{user.displayName}</span>
                  <Badge variant="emerald" className="mt-0.5">
                    Enterprise License
                  </Badge>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-red-400"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-700")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <Globe className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>
      </header>
      )}

      <main className={cn("relative flex-1 w-full", !isSessionOnly ? "max-w-7xl mx-auto px-6 py-12" : "p-0 overflow-hidden h-screen flex flex-col")}>
        <AnimatePresence mode="wait">
          {view === 'website' && activeTab === 'home' && (
            <motion.div
              key="website-home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="space-y-24">
                {/* Hero Section */}
                <div className="relative text-center space-y-8 py-24 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
                    >
                      <Shield className="w-3.5 h-3.5" /> Next-Gen Remote Infrastructure
                    </motion.div>
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-[0.8] mb-8">
                      <span className="block overflow-hidden">
                        <motion.span 
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="block"
                        >
                          Secure.
                        </motion.span>
                      </span>
                      <span className="block overflow-hidden">
                        <motion.span 
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                          className="block text-emerald-500"
                        >
                          Fast.
                        </motion.span>
                      </span>
                      <span className="block overflow-hidden">
                        <motion.span 
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="block italic font-light text-zinc-400"
                        >
                          Zero Install.
                        </motion.span>
                      </span>
                    </h1>
                    <p className="text-zinc-500 max-w-2xl mx-auto text-xl md:text-2xl leading-relaxed font-medium mb-12">
                      ZREMOTE delivers <span className="text-white">low-latency</span>, end-to-end encrypted remote desktop access through a <span className="text-emerald-400">P2P mesh network</span>. No agents, no plugins, just pure performance.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                      <button 
                        onClick={handleLogin}
                        className="group relative px-12 py-6 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_50px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 uppercase tracking-widest text-xs overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                        <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" /> Start Session
                      </button>
                      <button 
                        onClick={handleLogin}
                        className="px-12 py-6 bg-white/5 backdrop-blur-xl text-white border border-white/10 font-black rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                      >
                        <Shield className="w-5 h-5" /> Technical Specs
                      </button>
                    </div>

                    {/* Floating Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-24">
                      {[
                        { label: 'Latency', value: '< 12ms', icon: Zap, color: 'text-emerald-500' },
                        { label: 'Security', value: 'AES-256', icon: Shield, color: 'text-blue-500' },
                        { label: 'Uptime', value: '99.999%', icon: Activity, color: 'text-amber-500' },
                        { label: 'Network', value: 'Global', icon: Globe, color: 'text-purple-500' },
                      ].map((stat) => (
                        <div key={stat.label} className="p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl backdrop-blur-md hover:border-emerald-500/30 transition-all group">
                          <stat.icon className={cn("w-5 h-5 mb-4 mx-auto transition-transform group-hover:scale-110", stat.color)} />
                          <p className="text-2xl font-black tracking-tighter mb-1">{stat.value}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Host Card - Always visible on website */}
                    <Card className="relative overflow-hidden group border-emerald-500/20 bg-emerald-500/[0.02]">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MonitorPlay className="w-32 h-32 text-emerald-500" />
                      </div>
                      <div className="relative z-10 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <Share2 className="w-6 h-6 text-emerald-400" />
                          </div>
                          <h2 className="text-2xl font-bold uppercase tracking-tighter">Allow Remote Control</h2>
                        </div>
                        <p className="text-zinc-400 mb-8 leading-relaxed">
                          Share your screen with a support agent or colleague. They will be able to see your screen and guide you with a remote cursor.
                        </p>
                        
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Your ID</label>
                              <div className="bg-black border border-zinc-800 rounded-lg p-3 font-mono text-center text-xl tracking-widest text-zinc-600">
                                829 102 394
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Password</label>
                              <div className="bg-black border border-zinc-800 rounded-lg p-3 font-mono text-center text-xl tracking-widest text-emerald-400/50">
                                zt-8x2
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={user ? () => setView('dashboard') : handleLogin}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          >
                            <Play className="w-4 h-4" /> {user ? 'Go to Dashboard' : 'Sign In to Start Sharing'}
                          </button>
                        </div>
                      </div>
                    </Card>

                    {/* Client Card - Always visible on website */}
                    <Card className="relative overflow-hidden group border-cyan-500/20 bg-cyan-500/[0.02]">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MousePointer2 className="w-32 h-32 text-cyan-500" />
                      </div>
                      <div className="relative z-10 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-cyan-500/10 rounded-xl">
                            <ExternalLink className="w-6 h-6 text-cyan-400" />
                          </div>
                          <h2 className="text-2xl font-bold uppercase tracking-tighter">Control Remote Computer</h2>
                        </div>
                        <p className="text-zinc-400 mb-8 leading-relaxed">
                          Enter the partner's ID and password to establish a secure, encrypted connection for remote assistance.
                        </p>
                        
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Partner ID</label>
                              <input 
                                type="text" 
                                placeholder="000 000 000"
                                className="w-full bg-black border border-zinc-800 rounded-lg p-3 font-mono text-center text-xl tracking-widest focus:border-cyan-500 outline-none transition-colors"
                                readOnly
                                value="829 102 394"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Password</label>
                              <input 
                                type="password" 
                                placeholder="••••••"
                                className="w-full bg-black border border-zinc-800 rounded-lg p-3 font-mono text-center text-xl tracking-widest focus:border-cyan-500 outline-none transition-colors"
                                readOnly
                                value="zt-8x2"
                              />
                            </div>
                          </div>
                          
                          <button 
                            onClick={user ? () => setView('dashboard') : handleLogin}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                          >
                            <ArrowRight className="w-4 h-4" /> {user ? 'Go to Dashboard' : 'Sign In to Connect'}
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Features Grid */}
                  <div className="py-24 space-y-16">
                    <div className="text-center space-y-4">
                      <Badge variant="emerald">Core Capabilities</Badge>
                      <h2 className="text-4xl font-bold tracking-tighter uppercase">Engineered for <span className="text-emerald-500">Performance.</span></h2>
                      <p className="text-zinc-500 max-w-2xl mx-auto">ZenithRemote provides a suite of professional tools designed to handle the most demanding remote support scenarios.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { title: "Zero Install", icon: Zap, desc: "Run directly in any modern browser. No .exe, no .dmg, no administrative rights required." },
                        { title: "E2E Encryption", icon: Shield, desc: "Peer-to-peer DTLS-SRTP encryption ensures your data never touches our servers." },
                        { title: "Low Latency", icon: Activity, desc: "Optimized WebRTC stack delivers sub-50ms latency for a near-native experience." },
                        { title: "Multi-User Chat", icon: MessageSquare, desc: "Collaborate in real-time with integrated session terminal and file sharing." },
                        { title: "Audit Logging", icon: History, desc: "Comprehensive session recording and action logs for compliance and technical audit." },
                        { title: "Advanced Control", icon: Terminal, desc: "Full keyboard/mouse synchronization with support for system shortcuts and multi-monitor." }
                      ].map((feature) => (
                        <Card key={feature.title} className="p-8 bg-zinc-900/20 border-zinc-800 hover:border-emerald-500/30 transition-all group">
                          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 transition-colors">
                            <feature.icon className="w-6 h-6 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                          </div>
                          <h4 className="text-xl font-bold mb-3 tracking-tight uppercase">{feature.title}</h4>
                          <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Technical Specs Section */}
                  <div className="py-12 border-y border-zinc-900">
                    <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-8">Protocol Stack & Infrastructure</p>
                    <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale">
                      {['WEBRTC', 'DTLS-SRTP', 'AES-256-GCM', 'SCTP', 'H.264'].map(tech => (
                        <span key={tech} className="font-mono font-black text-xl tracking-tighter">{tech}</span>
                      ))}
                    </div>
                  </div>

                  {/* How it Works */}
                  <div className="space-y-12">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold uppercase tracking-tighter">How it Works</h2>
                      <p className="text-zinc-500">Three steps to secure remote assistance.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { step: "01", title: "Generate ID", desc: "The host generates a unique 9-digit session ID and a secure 6-character password." },
                        { step: "02", title: "Establish P2P", desc: "Our signaling server facilitates a direct peer-to-peer WebRTC connection between devices." },
                        { step: "03", title: "Remote Control", desc: "The client takes control with low-latency streaming and real-time input synchronization." }
                      ].map((item) => (
                        <div key={item.step} className="relative p-8 rounded-2xl bg-zinc-900/20 border border-zinc-800/50">
                          <span className="absolute -top-4 -left-4 w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center font-mono font-bold text-emerald-500">{item.step}</span>
                          <h4 className="font-bold text-lg mb-2 mt-4">{item.title}</h4>
                          <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                      <Badge variant="emerald">Infrastructure</Badge>
                      <h2 className="text-4xl font-bold tracking-tighter uppercase leading-tight">
                        The Browser is the <br />
                        <span className="text-emerald-500">New Operating System.</span>
                      </h2>
                      <p className="text-zinc-400 leading-relaxed">
                        Traditional RDP tools require bulky agents that create security vulnerabilities and maintenance headaches. ZREMOTE leverages modern web standards to deliver high-performance remote access without the baggage.
                      </p>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <h4 className="font-bold text-white flex items-center gap-2">
                              <Zap className="w-4 h-4 text-emerald-500" /> Instant
                            </h4>
                            <p className="text-xs text-zinc-500">No downloads. No installs. Connect in seconds.</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-bold text-white flex items-center gap-2">
                              <Shield className="w-4 h-4 text-emerald-500" /> Secure
                            </h4>
                            <p className="text-xs text-zinc-500">E2E encryption via WebRTC standards.</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full" />
                        <Card className="relative border-zinc-800 bg-black/40 backdrop-blur p-8">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <div className="w-3 h-3 rounded-full bg-amber-500" />
                              <div className="w-3 h-3 rounded-full bg-emerald-500" />
                              <span className="ml-2 text-[10px] font-mono text-zinc-600">zenith-terminal --secure</span>
                            </div>
                            <div className="font-mono text-xs space-y-2">
                              <p className="text-emerald-500">$ zenith init --session-id 829-102-394</p>
                              <p className="text-zinc-500">Initializing WebRTC P2P Mesh...</p>
                              <p className="text-zinc-500">Handshake complete. DTLS-SRTP Enabled.</p>
                              <p className="text-emerald-400">Connection established: 12ms Latency</p>
                              <p className="text-zinc-600 animate-pulse">_</p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>

                      {/* Testimonials */}
                  <div className="space-y-12">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold uppercase tracking-tighter">Trusted by Professionals</h2>
                      <p className="text-zinc-500">Join thousands of IT experts who switched to Zenith.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { name: "Sarah Chen", role: "CTO @ TechCorp", text: "The zero-installation approach saved our support team hundreds of hours in onboarding. It's incredibly fast." },
                        { name: "Marcus Thorne", role: "Lead SysAdmin", text: "Finally, a remote desktop tool that doesn't feel like it was built in 1995. The UI is clean and the performance is top-tier." },
                        { name: "Elena Rodriguez", role: "IT Consultant", text: "I use the Personal plan for my family and the Pro plan for my clients. The action logging is a lifesaver for billing." }
                      ].map((t) => (
                        <Card key={t.name} className="bg-zinc-900/20 border-zinc-800">
                          <p className="text-zinc-400 italic mb-6 text-sm leading-relaxed">"{t.text}"</p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-emerald-500">
                              {t.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{t.name}</p>
                              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{t.role}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* FAQ Section */}
                  <div className="max-w-3xl mx-auto space-y-12 py-12">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold uppercase tracking-tighter">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4">
                      {[
                        { q: "Is it really free?", a: "Yes! ZenithRemote is 100% free for everyone. No hidden fees, no subscriptions." },
                        { q: "How secure is the connection?", a: "We use WebRTC with DTLS and SRTP for end-to-end encryption. Your data never touches our servers." },
                        { q: "Do I need to install anything?", a: "No. ZenithRemote runs entirely in your browser using standard web APIs." },
                        { q: "What is Action Logging?", a: "Action Logging records every major event (files shared, chat, quality changes) for audit purposes. Available to all users." }
                      ].map((faq) => (
                        <Card key={faq.q} className="bg-black/20 border-zinc-800/50">
                          <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                          <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Integrations Section */}
                  <div className="space-y-12 py-12 border-t border-zinc-900">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl font-bold uppercase tracking-tighter">Seamless Integrations</h2>
                      <p className="text-zinc-500">ZenithRemote fits perfectly into your existing enterprise workflow.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {[
                        { name: "Slack", icon: MessageSquare, color: "text-purple-400" },
                        { name: "MS Teams", icon: Users, color: "text-blue-400" },
                        { name: "Jira", icon: Clipboard, color: "text-blue-500" },
                        { name: "Okta", icon: Shield, color: "text-cyan-400" },
                        { name: "Zendesk", icon: HelpCircle, color: "text-emerald-400" },
                        { name: "ServiceNow", icon: Activity, color: "text-green-500" }
                      ].map((int) => (
                        <div key={int.name} className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/50 flex flex-col items-center gap-3 hover:bg-zinc-800/50 transition-colors group">
                          <int.icon className={cn("w-8 h-8 group-hover:scale-110 transition-transform", int.color)} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{int.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Global Network Section */}
                  <div className="space-y-12 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                      <div className="relative order-2 lg:order-1">
                        <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full" />
                        <div className="relative aspect-video bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden flex items-center justify-center">
                          <Globe className="w-32 h-32 text-emerald-500/20 animate-pulse" />
                          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-4 p-8">
                            {[...Array(12)].map((_, i) => (
                              <div key={`dot-${i}`} className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" style={{ animationDelay: `${i * 0.5}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6 order-1 lg:order-2">
                        <Badge variant="emerald">Global Infrastructure</Badge>
                        <h2 className="text-4xl font-bold tracking-tighter uppercase leading-tight">
                          Ultra-Low Latency <br />
                          <span className="text-emerald-500">Across the Globe.</span>
                        </h2>
                        <p className="text-zinc-400 leading-relaxed">
                          Our distributed signaling mesh ensures that your connection is always routed through the fastest path, regardless of where you or your partners are located.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { label: 'Latency', value: '< 50ms' },
                            { label: 'Uptime', value: '99.99%' },
                            { label: 'Nodes', value: '500+' },
                          ].map((stat) => (
                            <div key={stat.label} className="space-y-1">
                              <p className="text-xl font-bold text-white">{stat.value}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Success Stories */}
                  <div className="space-y-16 py-12">
                    <div className="text-center space-y-4">
                      <Badge variant="emerald">Case Studies</Badge>
                      <h2 className="text-4xl font-bold tracking-tighter uppercase">Success <span className="text-emerald-500">Stories.</span></h2>
                      <p className="text-zinc-500 max-w-2xl mx-auto">See how leading organizations use ZenithRemote to transform their support operations.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { company: "Global FinTech", title: "Reducing Support Resolution Time by 45%", desc: "By switching to our zero-install platform, their Tier 1 support team eliminated software installation hurdles for clients.", stat: "-45% Time" },
                        { company: "HealthTech Corp", title: "Secure Remote Access for HIPAA Compliance", desc: "Implementing ZenithRemote's E2E encryption allowed their technicians to support medical devices securely.", stat: "100% Secure" }
                      ].map((caseStudy) => (
                        <Card key={caseStudy.company} className="p-8 space-y-6 bg-zinc-900/20">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">{caseStudy.company}</span>
                            <Badge variant="emerald">{caseStudy.stat}</Badge>
                          </div>
                          <h3 className="text-2xl font-bold tracking-tight">{caseStudy.title}</h3>
                          <p className="text-sm text-zinc-500 leading-relaxed">{caseStudy.desc}</p>
                          <button className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2 hover:gap-3 transition-all">
                            Read Case Study <ChevronRight className="w-3 h-3" />
                          </button>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Contact / CTA Section */}
                  <div className="py-24 relative overflow-hidden rounded-3xl bg-emerald-500">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 to-emerald-600" />
                    <div className="relative z-10 text-center space-y-8 px-6">
                      <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-black uppercase leading-none">
                        Ready to empower <br /> your support team?
                      </h2>
                      <p className="text-emerald-900 font-medium max-w-xl mx-auto">
                        Join over 5,000 companies that trust ZenithRemote for their critical remote access needs. Start using it for free today.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button 
                          onClick={handleLogin}
                          className="px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-zinc-900 transition-all shadow-2xl flex items-center justify-center gap-2"
                        >
                          Get Started
                        </button>
                        <button 
                          onClick={handleLogin}
                          className="px-8 py-4 bg-white/20 backdrop-blur text-black border border-black/10 font-bold rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                        >
                          Sign in
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          
          {view === 'dashboard' && role === 'idle' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 overflow-hidden h-[calc(100vh-0px)]"
            >
              {/* Sidebar */}
              <aside className="w-72 border-r border-zinc-800 bg-black/40 flex flex-col h-full relative z-20">
                          <div className="p-6 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
                                <Zap className="w-5 h-5 text-black fill-current" />
                              </div>
                              <span className="font-mono font-bold tracking-tighter text-xl uppercase">Zenith<span className="text-emerald-500">Remote</span></span>
                            </div>
                          </div>
                          
                          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {[
                              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                              { id: 'history', label: 'History', icon: History },
                              { id: 'audit', label: 'Audit Logs', icon: Clipboard },
                              { id: 'settings', label: 'Settings', icon: Settings },
                            ].map(item => (
                              <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                  activeTab === item.id 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                )}
                              >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                              </button>
                            ))}
                            <button
                              onClick={() => setView('website')}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all mt-auto"
                            >
                              <Globe className="w-4 h-4" />
                              Back to Website
                            </button>
                          </nav>

                          {/* Connection Controls at Bottom of Sidebar */}
                          <div className="p-4 border-t border-zinc-800 space-y-4 bg-black/60">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quick Connect</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[8px] font-bold text-emerald-500 uppercase">Secure</span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <input 
                                  type="text" 
                                  placeholder="Partner ID"
                                  value={inputSessionId}
                                  onChange={e => setInputSessionId(e.target.value)}
                                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-center focus:border-cyan-500 outline-none transition-all"
                                />
                                <input 
                                  type="password" 
                                  placeholder="Password"
                                  value={inputPassword}
                                  onChange={e => setInputPassword(e.target.value)}
                                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-center focus:border-cyan-500 outline-none transition-all"
                                />
                                <button 
                                  onClick={() => startClient()}
                                  disabled={isConnecting || userProfile?.role === 'Viewer'}
                                  className={cn(
                                    "w-full py-2.5 text-black text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                    (isConnecting || userProfile?.role === 'Viewer')
                                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                      : "bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                  )}
                                >
                                  {isConnecting ? <Activity className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                                  {isConnecting ? 'Connecting...' : 'Connect'}
                                </button>
                              </div>
                            </div>
                            
                            <div className="h-px bg-zinc-800/50" />
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Session</span>
                                <button onClick={generateSession} className="text-zinc-500 hover:text-emerald-500 transition-colors">
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex gap-1.5">
                                <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-[10px] font-mono text-center truncate text-zinc-300">
                                  {sessionId || '--- --- ---'}
                                </div>
                                <div className="w-16 bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-[10px] font-mono text-center text-emerald-400">
                                  {password || '------'}
                                </div>
                              </div>
                              <button 
                                onClick={() => startHost()}
                                disabled={userProfile?.role === 'Viewer'}
                                className={cn(
                                  "w-full py-2.5 text-black text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                  userProfile?.role === 'Viewer'
                                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                )}
                              >
                                <Play className="w-3 h-3" /> Start Sharing
                              </button>
                            </div>

                            <div className="pt-2">
                              <button 
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-bold text-zinc-600 hover:text-red-400 transition-colors uppercase tracking-widest"
                              >
                                <LogOut className="w-3 h-3" /> Sign Out
                              </button>
                            </div>
                          </div>
                        </aside>

                        {/* Main Content Area */}
                        <section className="flex-1 overflow-y-auto p-8 relative z-10">
                          <div className="max-w-6xl mx-auto space-y-12">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h1 className="text-4xl font-bold tracking-tighter uppercase">{activeTab === 'overview' ? 'Control Center' : activeTab.toUpperCase()}</h1>
                                <p className="text-zinc-500 text-sm">
                                  {activeTab === 'overview' && `Welcome back, ${user?.displayName?.split(' ')[0]}. Manage your remote sessions.`}
                                  {activeTab === 'history' && 'Review your past remote connections and data usage.'}
                                  {activeTab === 'audit' && 'Detailed security logs for compliance and monitoring.'}
                                  {activeTab === 'settings' && 'Configure your account and application preferences.'}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={userProfile?.role === 'Admin' ? 'emerald' : 'default'}>{(userProfile?.role || 'Member').toUpperCase()}</Badge>
                                  </div>
                                </div>
                                <div className="h-10 w-px bg-zinc-800 mx-2" />
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Plan</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="emerald">FREE FOREVER</Badge>
                                  </div>
                                </div>
                                <div className="h-10 w-px bg-zinc-800 mx-2" />
                                <div className="flex -space-x-2">
                                  {teamMembers.slice(0, 3).map((member) => (
                                    <div 
                                      key={member.id} 
                                      className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white"
                                      title={member.name}
                                    >
                                      {member.name[0].toUpperCase()}
                                    </div>
                                  ))}
                                  {teamMembers.length > 3 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-black bg-emerald-500 text-black flex items-center justify-center text-[10px] font-bold">
                                      +{teamMembers.length - 3}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {activeTab === 'overview' && (
                              <div className="space-y-12">
                                {/* Dashboard Overview Component */}
                                <DashboardOverview 
                                  recentActivity={recentActivity}
                                  sessionId={sessionId}
                                  password={password}
                                  generateSession={generateSession}
                                  startHost={startHost}
                                  userProfile={userProfile}
                                  addLog={addLog}
                                  inputSessionId={inputSessionId}
                                  setInputSessionId={setInputSessionId}
                                  inputPassword={inputPassword}
                                  setInputPassword={setInputPassword}
                                  startClient={startClient}
                                  isConnecting={isConnecting}
                                />

                                {/* Core Actions: Host & Client - REMOVED FROM HERE */}

                                {/* Secondary Content: Checklist, Activity, Health */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                  {/* Security Checklist */}
                                  <Card className="bg-zinc-900/30 border-zinc-800 p-6">
                                    <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                      <Shield className="w-4 h-4" /> Security Checklist
                                    </h3>
                                    <div className="space-y-4">
                                      {securityChecklist.map((item) => (
                                        <div key={item.label} className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className={cn(
                                              "w-4 h-4 rounded-full flex items-center justify-center border",
                                              item.checked ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-zinc-800 border-zinc-700 text-zinc-600"
                                            )}>
                                              {item.checked && <CheckCircle2 className="w-2.5 h-2.5" />}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{item.label}</span>
                                          </div>
                                          <span className={cn("text-[10px] font-bold uppercase tracking-widest", item.checked ? "text-emerald-500" : "text-zinc-600")}>
                                            {item.status}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </Card>

                                  {/* Quick Actions */}
                                  <Card className="bg-zinc-900/30 border-zinc-800 p-6">
                                    <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                      <Zap className="w-4 h-4" /> Quick Actions
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                      <button className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex flex-col items-center gap-2">
                                        <Terminal className="w-4 h-4" /> Remote Shell
                                      </button>
                                      <button className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex flex-col items-center gap-2">
                                        <FolderSync className="w-4 h-4" /> Sync Files
                                      </button>
                                      <button className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex flex-col items-center gap-2">
                                        <Settings className="w-4 h-4" /> Config Host
                                      </button>
                                      <button className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex flex-col items-center gap-2">
                                        <HelpCircle className="w-4 h-4" /> Support
                                      </button>
                                    </div>
                                  </Card>

                                  {/* Local Environment */}
                                  <Card className="bg-zinc-900/30 border-zinc-800 p-6">
                                    <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                      <Monitor className="w-4 h-4" /> Local Environment
                                    </h3>
                                    <div className="space-y-6">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest">OS</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{navigator.platform}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Browser</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{navigator.userAgent.split(' ').pop()}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Resolution</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{window.screen.width}x{window.screen.height}</span>
                                      </div>
                                    </div>
                                  </Card>
                                </div>
                              </div>
                            )}

                            {activeTab === 'history' && (
                              <Card className="bg-zinc-900/30 border-zinc-800 p-6">
                                <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                  <History className="w-4 h-4" /> Session History
                                </h3>
                                <div className="space-y-4">
                                  {sessionHistory.map((session) => (
                                    <div key={session.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all group">
                                      <div className="flex items-center gap-4">
                                        <div className={cn(
                                          "w-10 h-10 rounded-xl flex items-center justify-center",
                                          session.role === 'host' ? "bg-emerald-500/10 text-emerald-500" : "bg-cyan-500/10 text-cyan-500"
                                        )}>
                                          {session.role === 'host' ? <Share2 className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold">{session.id}</p>
                                          <p className="text-xs text-zinc-500">{session.date}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Data</p>
                                          <p className="text-xs font-mono">{formatBytes(session.dataUsage)}</p>
                                        </div>
                                        <Badge variant={session.role === 'host' ? 'emerald' : 'default'}>{session.role.toUpperCase()}</Badge>
                                        <button className="p-2 bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                                          <ArrowRight className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            )}



                            {activeTab === 'audit' && (
                                <Card className="bg-zinc-900/30 border-zinc-800 p-6">
                                  <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                      <Clipboard className="w-4 h-4" /> Security Audit Logs
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      <button className="p-2 bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                                        <Download className="w-4 h-4" />
                                      </button>
                                      <button className="p-2 bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                                        <Filter className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {actionLogs.length === 0 ? (
                                      <div className="py-12 text-center text-zinc-600">
                                        <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">No audit logs found</p>
                                      </div>
                                    ) : (
                                      actionLogs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-3 bg-zinc-800/20 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-all">
                                          <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                              <Activity className="w-4 h-4 text-zinc-500" />
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-bold text-white uppercase tracking-tight">{log.action}</p>
                                              <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">{log.details}</p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-[9px] font-mono text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                            <Badge variant="default" className="text-[8px] py-0 px-1">SUCCESS</Badge>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </Card>
                            )}

                            {activeTab === 'settings' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="bg-zinc-900/30 border-zinc-800 p-6">
                                  <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" /> Account Settings
                                  </h3>
                                  <div className="space-y-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Display Name</label>
                                      <input 
                                        type="text" 
                                        defaultValue={user?.displayName || ''}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                                      <input 
                                        type="email" 
                                        defaultValue={user?.email || ''}
                                        disabled
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-500 cursor-not-allowed"
                                      />
                                    </div>
                                    <button className="w-full py-3 bg-emerald-500 text-black text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-emerald-400 transition-all">
                                      Save Changes
                                    </button>
                                  </div>
                                </Card>

                                <Card className="bg-zinc-900/30 border-zinc-800 p-6">
                                  <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                    <Settings2 className="w-4 h-4" /> Preferences
                                  </h3>
                                  <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">Auto-reconnect</p>
                                        <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Automatically attempt to reconnect on drop</p>
                                      </div>
                                      <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                                        <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">Default Quality</p>
                                        <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Initial stream quality for new sessions</p>
                                      </div>
                                      <select className="bg-zinc-800 border border-zinc-700 text-[10px] rounded px-2 py-1 outline-none">
                                        <option>High</option>
                                        <option>Medium</option>
                                        <option>Low</option>
                                      </select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">Notifications</p>
                                        <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Show desktop notifications for chat</p>
                                      </div>
                                      <div className="w-10 h-5 bg-zinc-800 rounded-full relative cursor-pointer">
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-zinc-500 rounded-full" />
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            )}
                          </div>
                        </section>
                  </motion.div>
                )}

          {view === 'dashboard' && role !== 'idle' && (
            <motion.div
              key="active-session"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Connection Metrics Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { 
                          label: 'Latency', 
                          value: `${Math.round(connectionStats.latency)}ms`, 
                          icon: Zap, 
                          color: connectionStats.latency > 150 ? 'text-red-500' : connectionStats.latency > 50 ? 'text-amber-500' : 'text-emerald-500' 
                        },
                        { 
                          label: 'Packet Loss', 
                          value: `${connectionStats.packetLoss.toFixed(2)}%`, 
                          icon: Activity, 
                          color: connectionStats.packetLoss > 1 ? 'text-red-500' : connectionStats.packetLoss > 0.1 ? 'text-amber-500' : 'text-emerald-500' 
                        },
                        { label: 'Connection', value: connectionStats.type, icon: Network, color: 'text-blue-500' },
                        { label: 'Bitrate', value: connectionStats.bitrate, icon: ArrowUpRight, color: 'text-purple-500' },
                        { label: 'Frame Rate', value: `${connectionStats.fps} FPS`, icon: Monitor, color: 'text-cyan-500' },
                      ].map((stat) => (
                        <Card key={stat.label} className="p-3 bg-zinc-900/50 border-zinc-800 flex items-center gap-3">
                          <div className={cn("p-1.5 rounded-lg bg-zinc-800", stat.color)}>
                            <stat.icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-xs font-mono font-bold">{stat.value}</p>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Active Session Header */}
                    <div className="flex items-center justify-between bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-4">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full animate-pulse", role === 'host' ? 'bg-emerald-500' : 'bg-cyan-500')} />
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              connectionStats.latency > 300 || connectionStats.packetLoss > 5 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                              connectionStats.latency > 150 || connectionStats.packetLoss > 1 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                              connectionStats.latency > 50 || connectionStats.packetLoss > 0.1 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                              'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            )} />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Session ID</p>
                              <p className="font-mono text-lg font-bold">{sessionId}</p>
                            </div>
                          </div>
                        </div>
                        <div className="h-8 w-px bg-zinc-800" />
                        <div className="flex items-center gap-4">
                          <Badge variant={role === 'host' ? 'emerald' : 'default'}>{role.toUpperCase()}</Badge>
                          {isReconnecting && (
                            <div className="flex items-center gap-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-bold text-amber-500 animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              RECONNECTING...
                            </div>
                          )}
                          <ConnectionQualityIndicator 
                            latency={connectionStats.latency} 
                            packetLoss={connectionStats.packetLoss} 
                          />
                          <button 
                            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                            className={cn(
                              "p-1.5 rounded transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                              showAdvancedStats ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                            )}
                          >
                            <Activity className="w-3.5 h-3.5" />
                            Stats
                          </button>
                          {role === 'client' && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={toggleFullScreen}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                                title={isFullScreen ? `Exit Full Screen (${getShortcut('F')})` : `Enter Full Screen (${getShortcut('F')})`}
                              >
                                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                              </button>
                              <button 
                                onClick={toggleInputCapture}
                                className={cn(
                                  "p-1.5 rounded transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                                  isInputCaptured ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                                )}
                                title={captureMode === 'full' ? "Capture Mouse & Keyboard" : "Capture Pointer Only"}
                              >
                                {captureMode === 'full' ? <MousePointer2 className="w-3.5 h-3.5" /> : <MousePointer className="w-3.5 h-3.5" />}
                                {isInputCaptured ? (captureMode === 'full' ? 'Full Input Captured' : 'Pointer Locked') : 'Capture Input'}
                              </button>
                              {isInputCaptured && (
                                <button
                                  onClick={() => setCaptureMode(prev => prev === 'full' ? 'pointer' : 'full')}
                                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                                  title={captureMode === 'full' ? "Switch to Pointer Only" : "Switch to Mouse & Keyboard"}
                                >
                                  {captureMode === 'full' ? <Keyboard className="w-3.5 h-3.5 text-emerald-500" /> : <Keyboard className="w-3.5 h-3.5 opacity-30" />}
                                  {captureMode === 'full' ? 'M+K' : 'PTR'}
                                </button>
                              )}
                            </div>
                          )}
                          <select 
                            value={streamQuality}
                            onChange={(e) => {
                              const q = e.target.value as any;
                              setStreamQuality(q);
                              recordAction('Quality Changed', `Set to ${q}`);
                            }}
                            className="bg-zinc-800 border border-zinc-700 text-[10px] rounded px-2 py-1 outline-none focus:border-emerald-500"
                          >
                            <option value="low">Low Quality</option>
                            <option value="medium">Medium Quality</option>
                            <option value="high">High Quality</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer p-2.5 rounded-xl border bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white transition-all">
                          <FileBox className="w-5 h-5" />
                          <input type="file" className="hidden" onChange={handleFileShare} />
                        </label>
                        <button 
                          onClick={() => setIsChatOpen(!isChatOpen)}
                          title={`Toggle Chat (${getShortcut('C')})`}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all relative",
                            isChatOpen ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                          )}
                        >
                          <MessageSquare className="w-5 h-5" />
                          {messages.length > 0 && !isChatOpen && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                              {messages.length}
                            </span>
                          )}
                        </button>
                        <button 
                          onClick={stopSession}
                          title={`End Session (${getShortcut('S')})`}
                          className="px-6 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm flex items-center gap-2"
                        >
                          <StopCircle className="w-4 h-4" /> End Session
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Main Viewport */}
                      <div className={cn("transition-all duration-500 relative", isChatOpen ? "lg:col-span-8" : "lg:col-span-12")}>
                        <AnimatePresence>
                          {showAdvancedStats && (
                            <AdvancedStatsOverlay 
                              stats={connectionStats} 
                              onClose={() => setShowAdvancedStats(false)} 
                            />
                          )}
                        </AnimatePresence>
                        <Card className="p-0 overflow-hidden bg-black aspect-video flex items-center justify-center relative group rounded-2xl border-zinc-800 shadow-2xl">
                          {/* RDP Toolbar Overlay */}
                          <SessionToolbar 
                            onDisconnect={stopSession}
                            onToggleStats={() => setShowAdvancedStats(!showAdvancedStats)}
                            onToggleChat={() => setIsChatOpen(!isChatOpen)}
                            onToggleInput={toggleInputCapture}
                            isCaptured={isInputCaptured}
                            quality={streamQuality}
                            setQuality={setStreamQuality}
                            isRecording={isRecordingSession}
                            onToggleRecording={() => setIsRecordingSession(!isRecordingSession)}
                            isLowLatency={isLowLatencyMode}
                            onToggleLowLatency={() => setIsLowLatencyMode(!isLowLatencyMode)}
                          />

                          {/* Chat Toast Overlay */}
                          <AnimatePresence>
                            {showChatToast && lastMessage && (
                              <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => {
                                  setIsChatOpen(true);
                                  setShowChatToast(false);
                                }}
                                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
                              >
                                <div className="bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/30 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] max-w-md group hover:border-emerald-500/50 transition-all">
                                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">
                                      New Message from {lastMessage.sender}
                                    </p>
                                    <p className="text-sm text-zinc-200 truncate font-medium">
                                      {lastMessage.text}
                                    </p>
                                  </div>
                                  <div className="text-[10px] font-bold text-zinc-500 group-hover:text-emerald-500 transition-colors uppercase tracking-tighter">
                                    Click to Open
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {role === 'host' ? (
                            <div className="text-center p-12 relative">
                              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse rounded-full blur-3xl" />
                              <Activity className="w-32 h-32 text-emerald-500/10 mx-auto mb-8" />
                              <h3 className="text-3xl font-bold mb-4 tracking-tighter uppercase">Broadcasting Live</h3>
                              <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
                                Your screen is being shared securely. The remote partner can guide you using their cursor.
                              </p>
                              
                              {isReconnecting && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-6 rounded-2xl">
                                  <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6" />
                                  <h3 className="text-xl font-bold mb-2 tracking-widest uppercase">Connection Lost</h3>
                                  <p className="text-zinc-500 text-sm max-w-xs mb-4">
                                    Attempting to reconnect to the session... ({reconnectAttempts}/5)
                                  </p>
                                  <button 
                                    onClick={() => handleDisconnect(false)}
                                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                                  >
                                    Cancel Reconnection
                                  </button>
                                </div>
                              )}

                              {/* Remote Cursor Visualization */}
                              {remoteCursor.visible && (
                                <motion.div 
                                  className="absolute pointer-events-none z-50"
                                  animate={{ x: remoteCursor.x * 100 + '%', y: remoteCursor.y * 100 + '%' }}
                                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                >
                                  <div className="relative">
                                    <MousePointer2 className="w-6 h-6 text-emerald-400 fill-emerald-400/20 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <div className="absolute top-6 left-6 bg-emerald-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter whitespace-nowrap">
                                      Agent Cursor
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          ) : (
                          <div className="w-full h-full relative overflow-hidden" ref={videoContainerRef}>
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              onMouseMove={(e) => {
                                sendCursorPos(e);
                                if (isInputCaptured) handleRemoteInput(e);
                              }}
                              onMouseDown={handleRemoteInput}
                              onMouseUp={handleRemoteInput}
                              onKeyDown={handleRemoteInput}
                              onKeyUp={handleRemoteInput}
                              tabIndex={0}
                              className={cn(
                                "w-full h-full object-contain outline-none",
                                isInputCaptured ? "cursor-none" : "cursor-crosshair"
                              )}
                            />
                            {isInputCaptured && (
                              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full pointer-events-none">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                  {captureMode === 'full' ? 'Full Control' : 'Pointer Locked'}
                                </span>
                                {captureMode === 'full' ? (
                                  <Keyboard className="w-3 h-3 text-white/50" />
                                ) : (
                                  <MousePointer className="w-3 h-3 text-white/50" />
                                )}
                              </div>
                            )}
                            {isReconnecting && (
                              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-6">
                                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6" />
                                <h3 className="text-xl font-bold mb-2 tracking-widest uppercase">Connection Lost</h3>
                                <p className="text-zinc-500 text-sm max-w-xs mb-4">
                                  Attempting to reconnect to the session... ({reconnectAttempts}/5)
                                </p>
                                <button 
                                  onClick={() => handleDisconnect(false)}
                                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                  Cancel Reconnection
                                </button>
                              </div>
                            )}
                            {isInputCaptured && (
                              <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse z-50">
                                Input Captured • Press ESC to release
                              </div>
                            )}
                            <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                              <div className="flex items-center gap-3">
                                <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  1080p @ 60fps
                                </div>
                                <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-mono text-zinc-400">
                                  P2P Encrypted
                                </div>
                                {isLowLatencyMode && (
                                  <div className="px-3 py-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">
                                    Low Latency Mode
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-white/5 rounded-lg text-[9px] text-zinc-500 font-mono">
                                <Cpu className="w-3 h-3" /> Intel Core i9-12900K • <HardDrive className="w-3 h-3" /> 32GB RAM • <Network className="w-3 h-3" /> 1Gbps Uplink
                              </div>
                            </div>
                            
                            {/* Full Screen Toggle Button */}
                            <div className="absolute bottom-6 right-6 flex items-center gap-2">
                              <button 
                                onClick={toggleFullScreen}
                                className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all group"
                                title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                              >
                                {isFullScreen ? (
                                  <Minimize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                ) : (
                                  <Maximize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>

                    {/* Side Panel (Chat/Logs) */}
                    {isChatOpen && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4 flex flex-col gap-6 h-[calc(100%-0px)]"
                      >
                        <Card className="flex-1 flex flex-col p-0 overflow-hidden border-zinc-800 bg-zinc-900/30">
                          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> Session Chat
                            </h3>
                            <button onClick={() => setMessages([])} className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase font-bold">Clear</button>
                          </div>
                          
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                              {messages.map((msg) => (
                                <div key={msg.id} className={cn(
                                  "flex flex-col max-w-[85%]",
                                  msg.sender === (role === 'host' ? 'Host' : 'Client') ? "ml-auto items-end" : "items-start"
                                )}>
                                  <div className={cn(
                                    "px-4 py-2.5 rounded-2xl text-sm",
                                    msg.sender === (role === 'host' ? 'Host' : 'Client') 
                                      ? "bg-emerald-500 text-black font-medium rounded-tr-none" 
                                      : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700"
                                  )}>
                                    {msg.text}
                                  </div>
                                  <span className="text-[9px] text-zinc-600 mt-1 font-mono">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                              {isRemoteTyping && (
                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] italic">
                                  <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </div>
                                  {role === 'host' ? 'Client' : 'Host'} is typing...
                                </div>
                              )}
                              <div ref={chatEndRef} />
                            </div>

                          <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Type a message..."
                                value={chatInput}
                                onChange={e => {
                                  setChatInput(e.target.value);
                                  if (peerRef.current && isConnected) {
                                    peerRef.current.send(JSON.stringify({ type: 'typing' }));
                                  }
                                }}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                className="w-full bg-black border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm focus:border-emerald-500 outline-none transition-colors"
                              />
                              <button 
                                onClick={sendMessage}
                                className="absolute right-2 top-2 p-1.5 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </Card>

                        <Card className="h-48 flex flex-col p-0 overflow-hidden border-zinc-800 bg-zinc-900/30">
                          <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-500">Shared Files</h3>
                            <span className="text-[9px] text-zinc-600 font-mono">{sharedFiles.length} files</span>
                          </div>
                          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                            {sharedFiles.map((file, i) => (
                              <div key={`${file.name}-${i}`} className="flex items-center justify-between p-2 bg-black/40 rounded-lg border border-zinc-800/50 group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <FileBox className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <div className="truncate">
                                    <p className="text-[10px] font-medium truncate">{file.name}</p>
                                    <p className="text-[8px] text-zinc-600">{(file.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => downloadFile(file)}
                                  className="p-1 text-zinc-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {sharedFiles.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-2">
                                <FileBox className="w-6 h-6 opacity-20" />
                                <p className="text-[9px] uppercase tracking-tighter">No files shared</p>
                              </div>
                            )}
                          </div>
                        </Card>

                        <Card className="h-48 flex flex-col p-0 overflow-hidden border-zinc-800 bg-zinc-900/30">
                          <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-500">Pro Action Logs</h3>
                            <Badge variant="emerald">Live</Badge>
                          </div>
                          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                            {true ? (
                              actionLogs.map((log) => (
                                <div key={log.id} className="text-[9px] font-mono border-l border-emerald-500/30 pl-2 py-1">
                                  <div className="flex justify-between text-zinc-500">
                                    <span className="text-emerald-500 font-bold">{log.action}</span>
                                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                                  </div>
                                  {log.details && <p className="text-zinc-600 truncate">{log.details}</p>}
                                </div>
                              ))
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-2 text-center px-4">
                                <Lock className="w-6 h-6 opacity-20" />
                                <p className="text-[9px] uppercase tracking-tighter">Real-time action logging and audit trails enabled.</p>
                              </div>
                            )}
                            {actionLogs.length === 0 && (
                              <p className="text-[9px] text-zinc-600 text-center mt-4">Waiting for actions...</p>
                            )}
                          </div>
                        </Card>

                        <Card className="h-48 flex flex-col p-0 overflow-hidden border-zinc-800 bg-zinc-900/30">
                          <div className="flex-1 p-3 font-mono text-[9px] space-y-1.5 overflow-y-auto">
                            {logs.map((log, i) => (
                              <div key={`log-${i}`} className="text-zinc-500 flex gap-2">
                                <span className="text-zinc-700 shrink-0">[{log.split(' - ')[0]}]</span>
                                <span>{log.split(' - ')[1]}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  
                </div>
              </motion.div>
            )}
      

          {view === 'website' && activeTab === 'architecture' && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-24"
            >
              <section>
                <SectionHeader 
                  title="System Architecture" 
                  subtitle="The Zenith stack is built for maximum throughput and memory safety using a distributed P2P mesh."
                  icon={Layers}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { name: "Signaling Layer", tech: "Socket.IO / Node.js", desc: "Facilitates the initial handshake and ICE candidate exchange between peers.", icon: Globe },
                    { name: "Transport Layer", tech: "WebRTC / SCTP", desc: "Low-latency P2P data channels for input and video streaming with UDP fallback.", icon: Network },
                    { name: "Capture Engine", tech: "MediaDevices API", desc: "Native browser-level screen capture with hardware acceleration support.", icon: Monitor },
                    { name: "Security Layer", tech: "DTLS / SRTP", desc: "Built-in WebRTC encryption supplemented by application-level AES-256-GCM.", icon: Lock }
                  ].map((layer) => (
                    <Card key={layer.name} className="group">
                      <layer.icon className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold text-lg mb-2">{layer.name}</h3>
                      <Badge className="mb-3">{layer.tech}</Badge>
                      <p className="text-sm text-zinc-400 leading-relaxed">{layer.desc}</p>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold uppercase tracking-tighter">P2P Mesh Topology</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Unlike traditional RDP solutions that route traffic through a central relay (causing latency and security risks), ZenithRemote establishes a direct connection between the Host and Client.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "STUN/TURN facilitation for NAT traversal",
                      "Dynamic bitrate adjustment based on network conditions",
                      "Sub-50ms glass-to-glass latency in optimal conditions",
                      "Zero-server-storage policy for session data"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl aspect-square flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                  <div className="relative w-full h-full border-2 border-dashed border-zinc-800 rounded-full flex items-center justify-center">
                    <div className="w-24 h-24 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                      <Zap className="w-12 h-12 text-black" />
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                      <Monitor className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                      <MousePointer2 className="w-6 h-6 text-zinc-400" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-12 py-12">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-bold uppercase tracking-tighter">Global Edge Network</h3>
                  <p className="text-zinc-500 max-w-2xl mx-auto">Our distributed signaling and relay network ensures low-latency handshakes regardless of geographic location.</p>
                </div>
                <div className="relative aspect-[21/9] bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  
                  {/* Pulse Points */}
                  {[
                    { t: "10%", l: "20%", n: "San Francisco" },
                    { t: "30%", l: "75%", n: "London" },
                    { t: "45%", l: "85%", n: "Tokyo" },
                    { t: "60%", l: "30%", n: "New York" },
                    { t: "75%", l: "60%", n: "São Paulo" },
                    { t: "25%", l: "90%", n: "Sydney" }
                  ].map((point) => (
                    <div key={point.n} className="absolute" style={{ top: point.t, left: point.l }}>
                      <div className="relative">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                        <div className="w-3 h-3 bg-emerald-500 rounded-full relative z-10 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          <span className="text-[8px] font-bold uppercase tracking-widest bg-black/80 px-2 py-1 rounded border border-white/10">{point.n}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Network Statistics</p>
                      <div className="flex gap-8">
                        <div>
                          <p className="text-xl font-mono font-bold text-white">24</p>
                          <p className="text-[8px] uppercase tracking-widest text-zinc-600">Edge Nodes</p>
                        </div>
                        <div>
                          <p className="text-xl font-mono font-bold text-white">99.99%</p>
                          <p className="text-[8px] uppercase tracking-widest text-zinc-600">Uptime</p>
                        </div>
                        <div>
                          <p className="text-xl font-mono font-bold text-white">12ms</p>
                          <p className="text-[8px] uppercase tracking-widest text-zinc-600">Avg. Handshake</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="emerald">Global Mesh Active</Badge>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {view === 'website' && activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <SectionHeader 
                title="Security Protocol" 
                subtitle="ZenithRemote is designed with a security-first mindset, ensuring your data never leaves your control."
                icon={Shield}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-8 space-y-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-xl">End-to-End Encryption</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    All video, audio, and input data is encrypted using AES-256-GCM. Keys are generated locally and never shared with our servers.
                  </p>
                </Card>
                <Card className="p-8 space-y-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                    <Key className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h4 className="font-bold text-xl">Dynamic Passwords</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Every session is protected by a unique, cryptographically secure password that expires immediately after use.
                  </p>
                </Card>
                <Card className="p-8 space-y-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-xl">Zero-Trust Access</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    We follow a zero-trust model. Even if our signaling server is compromised, your session data remains encrypted and unreadable.
                  </p>
                </Card>
              </div>

              <Card className="bg-zinc-900/50 border-zinc-800 p-12">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                  <h3 className="text-3xl font-bold uppercase tracking-tighter">Compliance & Standards</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {['GDPR', 'HIPAA', 'SOC2', 'ISO 27001'].map(std => (
                      <div key={std} className="p-4 border border-zinc-800 rounded-xl bg-black/50">
                        <p className="font-mono font-bold text-zinc-400">{std}</p>
                        <p className="text-[8px] uppercase tracking-widest text-zinc-600 mt-1">Compliant</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    ZenithRemote adheres to the highest international standards for data protection and privacy. Our architecture is designed to meet the rigorous requirements of healthcare, finance, and government sectors.
                  </p>
                </div>
              </Card>
              </motion.div>
          )}

          {view === 'website' && activeTab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <SectionHeader 
                title="Resource Center" 
                subtitle="Everything you need to deploy, manage, and scale ZenithRemote in your organization."
                icon={BookOpen}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { title: "Quick Start Guide", desc: "Get up and running in less than 5 minutes with our step-by-step guide.", icon: Zap, category: "Basics" },
                  { title: "Enterprise Deployment", desc: "Best practices for deploying ZenithRemote across large-scale organizations.", icon: Building2, category: "Enterprise" },
                  { title: "Security Whitepaper", desc: "A deep dive into our encryption protocols and zero-trust architecture.", icon: Shield, category: "Security" },
                  { title: "API Documentation", desc: "Integrate ZenithRemote into your own applications with our robust API.", icon: Code2, category: "Developers" },
                  { title: "Compliance Guide", desc: "How ZenithRemote helps you meet GDPR, HIPAA, and SOC2 requirements.", icon: Clipboard, category: "Legal" },
                  { title: "Troubleshooting", desc: "Common issues and how to resolve them quickly.", icon: HelpCircle, category: "Support" }
                ].map((res) => (
                  <Card key={res.title} className="group cursor-pointer">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-zinc-800 rounded-xl group-hover:bg-emerald-500/10 transition-colors">
                        <res.icon className="w-6 h-6 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <Badge>{res.category}</Badge>
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">{res.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed mb-6">{res.desc}</p>
                    <button 
                      onClick={() => setSelectedResource(res)}
                      className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2 group-hover:gap-3 transition-all"
                    >
                      Read More <ChevronRight className="w-3 h-3" />
                    </button>
                  </Card>
                ))}
              </div>

              {selectedResource && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
                  >
                    <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                          <selectedResource.icon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold uppercase tracking-tighter">{selectedResource.title}</h3>
                          <Badge>{selectedResource.category}</Badge>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedResource(null)}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="p-8 overflow-y-auto prose prose-invert prose-emerald max-w-none">
                      {selectedResource.title === "Quick Start Guide" && (
                        <div className="space-y-6">
                          <h4 className="text-emerald-400">1. Create an Account</h4>
                          <p>Sign in using your Google account to access the dashboard. No credit card required for the Personal plan.</p>
                          <h4 className="text-emerald-400">2. Start a Host Session</h4>
                          <p>Go to the Home tab and click "Start Host Session". You will receive a unique Session ID and Password.</p>
                          <h4 className="text-emerald-400">3. Share Credentials</h4>
                          <p>Send the Session ID and Password to the person you want to grant access to.</p>
                          <h4 className="text-emerald-400">4. Establish Connection</h4>
                          <p>The client enters the credentials on their dashboard and clicks "Connect". A direct P2P encrypted tunnel is established.</p>
                        </div>
                      )}
                      {selectedResource.title === "Enterprise Deployment" && (
                        <div className="space-y-6">
                          <h4 className="text-emerald-400">Centralized Management</h4>
                          <p>Deploy ZenithRemote across your organization using our Team Management dashboard. Invite members, assign roles, and manage licenses from a single interface.</p>
                          <h4 className="text-emerald-400">SSO & Provisioning</h4>
                          <p>Integrate with Okta, Azure AD, or Google Workspace for seamless user provisioning and Single Sign-On (Enterprise Plan only).</p>
                          <h4 className="text-emerald-400">Custom Relay Servers</h4>
                          <p>For high-security environments, deploy your own TURN/STUN servers to ensure all traffic stays within your private network infrastructure.</p>
                        </div>
                      )}
                      {selectedResource.title === "Security Whitepaper" && (
                        <div className="space-y-6">
                          <h4 className="text-emerald-400">Encryption Architecture</h4>
                          <p>ZenithRemote utilizes the WebRTC security stack (DTLS and SRTP) to ensure all data is encrypted before leaving the browser.</p>
                          <ul className="list-disc pl-5 space-y-2">
                            <li><strong>AES-256-GCM:</strong> The gold standard for symmetric encryption, providing both confidentiality and integrity.</li>
                            <li><strong>Perfect Forward Secrecy:</strong> Session keys are ephemeral and never reused.</li>
                            <li><strong>Zero-Trust:</strong> Our signaling servers only facilitate the handshake; they never have access to the decryption keys.</li>
                          </ul>
                        </div>
                      )}
                      {selectedResource.title === "API Documentation" && (
                        <div className="space-y-6">
                          <h4 className="text-emerald-400">REST API Endpoints</h4>
                          <p>Automate your workflow with our secure API. (Available for Enterprise users)</p>
                          <pre className="bg-black p-4 rounded-xl text-xs overflow-x-auto">
                            {`GET /api/v1/sessions\nPOST /api/v1/sessions/create\nDELETE /api/v1/sessions/:id`}
                          </pre>
                          <h4 className="text-emerald-400">Webhooks</h4>
                          <p>Receive real-time notifications for session starts, ends, and security alerts.</p>
                        </div>
                      )}
                      {selectedResource.title === "Compliance Guide" && (
                        <div className="space-y-6">
                          <h4 className="text-emerald-400">GDPR Compliance</h4>
                          <p>ZenithRemote is designed with privacy by default. We do not store session data, and all PII is encrypted at rest.</p>
                          <h4 className="text-emerald-400">HIPAA Readiness</h4>
                          <p>Our end-to-end encryption meets the technical requirements for HIPAA compliance in healthcare environments.</p>
                          <h4 className="text-emerald-400">Audit Trails</h4>
                          <p>Maintain detailed logs of all remote access events, including timestamps, user IDs, and actions performed during the session.</p>
                        </div>
                      )}
                      {selectedResource.title === "Troubleshooting" && (
                        <div className="space-y-6">
                          <h4 className="text-emerald-400">Connection Issues</h4>
                          <p>Ensure that your firewall allows outgoing UDP traffic on standard WebRTC ports. If you are behind a strict symmetric NAT, our relay servers will automatically take over.</p>
                          <h4 className="text-emerald-400">Performance Optimization</h4>
                          <p>Close unnecessary browser tabs and background applications. Ensure you have a stable internet connection with at least 5Mbps upload/download speed.</p>
                          <h4 className="text-emerald-400">Browser Compatibility</h4>
                          <p>ZenithRemote is optimized for Chrome, Firefox, and Edge. Ensure your browser is updated to the latest version for the best experience.</p>
                        </div>
                      )}
                      {/* Fallback for other resources */}
                      {!["Quick Start Guide", "Security Whitepaper", "API Documentation", "Enterprise Deployment", "Compliance Guide", "Troubleshooting"].includes(selectedResource.title) && (
                        <div className="py-12 text-center text-zinc-500 italic">
                          Detailed documentation for {selectedResource.title} is being updated. Please check back soon or contact support.
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              <Card className="bg-emerald-500/5 border-emerald-500/20 p-12 text-center space-y-6">
                <h3 className="text-3xl font-bold uppercase tracking-tighter">Need custom integration?</h3>
                <p className="text-zinc-400 max-w-xl mx-auto">Our engineering team can help you build custom solutions tailored to your specific infrastructure needs.</p>
                <button className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  Talk to an Engineer
                </button>
              </Card>
            </motion.div>
          )}
          {view === 'website' && activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <SectionHeader 
                title="Audit & Compliance" 
                subtitle="Review session history, access logs, and real-time action audits for your organization."
                icon={History}
              />

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold uppercase tracking-tighter flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" /> Live Action Audit
                    </h3>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                      </button>
                    </div>
                  </div>
                  <Card className="p-0 overflow-hidden border-zinc-800 bg-black/40">
                    <div className="max-h-[400px] overflow-y-auto font-mono text-[10px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-zinc-900 z-10">
                          <tr className="border-b border-zinc-800">
                            <th className="p-3 text-zinc-500 uppercase tracking-widest">Timestamp</th>
                            <th className="p-3 text-zinc-500 uppercase tracking-widest">Action</th>
                            <th className="p-3 text-zinc-500 uppercase tracking-widest">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {actionLogs.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-8 text-center text-zinc-600 italic">No actions recorded in this session yet.</td>
                            </tr>
                          ) : (
                            actionLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-3 text-zinc-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                <td className="p-3 font-bold text-emerald-500">{log.action}</td>
                                <td className="p-3 text-zinc-500">{log.details || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold uppercase tracking-tighter">Session History</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Sessions</p>
                    <p className="text-2xl font-mono font-bold">{sessionHistory.length}</p>
                  </Card>
                  <Card className="bg-cyan-500/5 border-cyan-500/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Avg. Duration</p>
                    <p className="text-2xl font-mono font-bold">14m 22s</p>
                  </Card>
                  <Card className="bg-amber-500/5 border-amber-500/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Data Transferred</p>
                    <p className="text-2xl font-mono font-bold">1.2 GB</p>
                  </Card>
                  <Card className="bg-purple-500/5 border-purple-500/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Security Score</p>
                    <p className="text-2xl font-mono font-bold text-emerald-400">A+</p>
                  </Card>
                </div>

                <Card className="p-0 overflow-hidden border-zinc-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/50 border-b border-zinc-800">
                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Session ID</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Timestamp</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Role</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Encryption</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {sessionHistory.map((session) => (
                        <tr key={session.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-4 font-mono text-sm">{session.id}</td>
                          <td className="p-4 text-sm text-zinc-400">{session.date}</td>
                          <td className="p-4">
                            <Badge variant={session.role === 'host' ? 'emerald' : 'default'}>{session.role.toUpperCase()}</Badge>
                          </td>
                          <td className="p-4 text-xs font-mono text-zinc-500">AES-256-GCM</td>
                          <td className="p-4">
                            <button 
                              onClick={() => {
                                setInputSessionId(session.id);
                                setActiveTab('home');
                                setView('dashboard');
                              }}
                              className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {sessionHistory.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-zinc-600 italic">No audit logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </div>
            </motion.div>
          )}

          {view === 'website' && activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <SectionHeader 
                title="Security & Preferences" 
                subtitle="Configure your connection security and application behavior."
                icon={Lock}
              />
              
              <div className="space-y-6">
                <Card className="p-6 space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-4">Account & Plan</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-emerald-500">
                        {user?.displayName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold">{user?.displayName}</p>
                        <p className="text-xs text-zinc-500">{user?.email}</p>
                      </div>
                    </div>
                    <Badge variant="emerald">PROFESSIONAL</Badge>
                  </div>
                </Card>

                <Card className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-4">Session Settings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold mb-1">End-to-End Encryption</h4>
                      <p className="text-xs text-zinc-500">Always encrypt session data using AES-256-GCM.</p>
                    </div>
                    <div className="w-12 h-6 rounded-full relative transition-all bg-emerald-500 cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="h-px bg-zinc-800" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold mb-1">Remote Cursor Guidance</h4>
                      <p className="text-xs text-zinc-500">Show the partner's cursor position on your screen.</p>
                    </div>
                    <div className="w-12 h-6 rounded-full relative transition-all bg-emerald-500 cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="h-px bg-zinc-800" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold mb-1">Keyboard Shortcuts</h4>
                      <p className="text-xs text-zinc-500">Enable Ctrl+Alt+F for full-screen and other shortcuts.</p>
                    </div>
                    <div className="w-12 h-6 rounded-full relative transition-all bg-emerald-500 cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </Card>



                <Card className="border-red-500/20 bg-red-500/[0.02]">
                  <h4 className="font-bold text-red-500 mb-2">Danger Zone</h4>
                  <p className="text-xs text-zinc-500 mb-4">Permanently clear all session history and local cache.</p>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('zenith_history');
                      setSessionHistory([]);
                    }}
                    className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:bg-zinc-800 disabled:text-zinc-600"
                  >
                    Clear All Data
                  </button>
                </Card>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {view === 'website' && (
          <footer className="border-t border-zinc-900 py-24 bg-black">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-24">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      <Zap className="w-6 h-6 text-black fill-current" />
                    </div>
                    <span className="font-mono font-bold tracking-tighter text-2xl uppercase">Z<span className="text-emerald-500">REMOTE</span></span>
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                    The world's first zero-installation, browser-native remote desktop platform. Secure, fast, and built for the modern enterprise.
                  </p>
                  <div className="flex gap-4">
                    {[Globe, Shield, Terminal, MessageSquare].map((Icon, i) => (
                      <button key={`social-${i}`} className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all">
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-widest text-white mb-6">Product</h5>
                  <ul className="space-y-4 text-sm text-zinc-500">
                    <li><button onClick={() => { setActiveTab('home'); setView('website'); }} className="hover:text-emerald-400 transition-colors">Features</button></li>
                    <li><button onClick={() => setActiveTab('security')} className="hover:text-emerald-400 transition-colors">Security</button></li>
                    <li><button onClick={() => setActiveTab('architecture')} className="hover:text-emerald-400 transition-colors">Architecture</button></li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-widest text-white mb-6">Resources</h5>
                  <ul className="space-y-4 text-sm text-zinc-500">
                    <li><button onClick={() => setActiveTab('resources')} className="hover:text-emerald-400 transition-colors">Documentation</button></li>
                    <li><button onClick={() => setActiveTab('resources')} className="hover:text-emerald-400 transition-colors">API Reference</button></li>
                    <li><button onClick={() => setActiveTab('resources')} className="hover:text-emerald-400 transition-colors">Case Studies</button></li>
                    <li><button className="hover:text-emerald-400 transition-colors">Community</button></li>
                    <li><button className="hover:text-emerald-400 transition-colors">Status</button></li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-widest text-white mb-6">Company</h5>
                  <ul className="space-y-4 text-sm text-zinc-500">
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact Sales</a></li>
                  </ul>
                </div>
              </div>
              <div className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-8">
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest">
                  &copy; 2026 ZREMOTE Systems International. All rights reserved. Built with WebRTC & React.
                </p>
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">All Systems Operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zinc-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">SOC2 Type II Certified</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        )}


      </main>
    </div>
  </ErrorBoundary>
  );
}
