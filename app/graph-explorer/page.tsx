'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Shield, Cpu, Database, Globe, Server, Lock, Zap } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'system' | 'algorithm' | 'dependency' | 'risk';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
}

interface GraphEdge {
  source: string;
  target: string;
  color: string;
  width: number;
}

// Generate mock graph data
function generateGraphData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const systemNames = [
    'api-gateway', 'db-cluster-1', 'db-cluster-2', 'cache-redis', 'auth-service',
    'payment-api', 'user-service', 'notification-svc', 'analytics-engine', 'cdn-proxy',
    'backup-archive', 'log-aggregator', 'message-queue', 'search-index', 'file-storage',
    'ssh-bastion', 'vpn-gateway', 'dns-resolver', 'load-balancer', 'monitoring-svc',
    'cert-manager', 'key-vault', 'identity-provider', 'api-v2', 'mobile-backend',
  ];

  const algorithms = [
    { name: 'RSA-2048', color: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
    { name: 'ECC-P256', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
    { name: 'RSA-4096', color: '#6366f1', glow: 'rgba(99,102,241,0.4)' },
    { name: 'AES-256', color: '#22c55e', glow: 'rgba(34,197,94,0.4)' },
    { name: 'Kyber-1024', color: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
    { name: 'Dilithium', color: '#8b5cf6', glow: 'rgba(139,92,246,0.4)' },
  ];

  const riskNodes = [
    { name: 'HNDL Attack', color: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
    { name: 'Quantum Threat', color: '#f43f5e', glow: 'rgba(244,63,94,0.5)' },
    { name: 'Key Exposure', color: '#ff6b6b', glow: 'rgba(255,107,107,0.5)' },
  ];

  const cx = 500, cy = 350;

  // Add system nodes in a circle
  systemNames.forEach((name, i) => {
    const angle = (i / systemNames.length) * Math.PI * 2;
    const r = 200 + Math.random() * 80;
    nodes.push({
      id: `sys-${i}`,
      label: name,
      type: 'system',
      x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 60,
      y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 60,
      vx: 0, vy: 0,
      radius: 12 + Math.random() * 6,
      color: '#3b82f6',
      glowColor: 'rgba(59,130,246,0.3)',
    });
  });

  // Add algorithm nodes closer to center
  algorithms.forEach((algo, i) => {
    const angle = (i / algorithms.length) * Math.PI * 2 + 0.3;
    const r = 80 + Math.random() * 40;
    nodes.push({
      id: `algo-${i}`,
      label: algo.name,
      type: 'algorithm',
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: 0, vy: 0,
      radius: 18,
      color: algo.color,
      glowColor: algo.glow,
    });
  });

  // Add risk nodes
  riskNodes.forEach((risk, i) => {
    const angle = (i / riskNodes.length) * Math.PI * 2 + 1.0;
    nodes.push({
      id: `risk-${i}`,
      label: risk.name,
      type: 'risk',
      x: cx + Math.cos(angle) * 320 + (Math.random() - 0.5) * 40,
      y: cy + Math.sin(angle) * 280 + (Math.random() - 0.5) * 40,
      vx: 0, vy: 0,
      radius: 15,
      color: risk.color,
      glowColor: risk.glow,
    });
  });

  // Connect systems to algorithms
  systemNames.forEach((_, i) => {
    const algoIdx = i % algorithms.length;
    edges.push({
      source: `sys-${i}`,
      target: `algo-${algoIdx}`,
      color: `${algorithms[algoIdx].color}40`,
      width: 1,
    });

    // Some systems connect to multiple algorithms
    if (i % 3 === 0) {
      const secondAlgo = (algoIdx + 1) % algorithms.length;
      edges.push({
        source: `sys-${i}`,
        target: `algo-${secondAlgo}`,
        color: `${algorithms[secondAlgo].color}30`,
        width: 0.8,
      });
    }
  });

  // Connect systems to each other (dependencies)
  for (let i = 0; i < systemNames.length; i++) {
    const connections = 1 + Math.floor(Math.random() * 2);
    for (let c = 0; c < connections; c++) {
      const target = (i + 1 + Math.floor(Math.random() * 4)) % systemNames.length;
      if (target !== i) {
        edges.push({
          source: `sys-${i}`,
          target: `sys-${target}`,
          color: 'rgba(148,163,184,0.15)',
          width: 0.5,
        });
      }
    }
  }

  // Connect risks to vulnerable algorithms
  edges.push({ source: 'risk-0', target: 'algo-0', color: 'rgba(239,68,68,0.3)', width: 2 });
  edges.push({ source: 'risk-0', target: 'algo-1', color: 'rgba(239,68,68,0.2)', width: 1.5 });
  edges.push({ source: 'risk-1', target: 'algo-0', color: 'rgba(244,63,94,0.3)', width: 2 });
  edges.push({ source: 'risk-1', target: 'algo-2', color: 'rgba(244,63,94,0.2)', width: 1.5 });
  edges.push({ source: 'risk-2', target: 'algo-1', color: 'rgba(255,107,107,0.3)', width: 1.5 });

  return { nodes, edges };
}

export default function GraphExplorerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const graphRef = useRef<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const dragNode = useRef<GraphNode | null>(null);
  const tickRef = useRef(0);

  const getNodeById = useCallback((id: string) => {
    return graphRef.current.nodes.find(n => n.id === id) || null;
  }, []);

  useEffect(() => {
    const data = generateGraphData();
    graphRef.current = data;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      // Reposition nodes to fit new size
      const scaleX = rect.width / 1000;
      const scaleY = rect.height / 700;
      data.nodes.forEach(n => {
        n.x = n.x * scaleX;
        n.y = n.y * scaleY;
      });
    };
    resize();

    const ctx = canvas.getContext('2d')!;

    const applyForces = () => {
      const nodes = graphRef.current.nodes;
      const edges = graphRef.current.edges;

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const source = getNodeById(edge.source);
        const target = getNodeById(edge.target);
        if (!source || !target) return;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const idealDist = 120;
        const force = (dist - idealDist) * 0.003;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      });

      // Center gravity
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      nodes.forEach(n => {
        n.vx += (centerX - n.x) * 0.0005;
        n.vy += (centerY - n.y) * 0.0005;
      });

      // Apply velocity with damping
      nodes.forEach(n => {
        if (dragNode.current && dragNode.current.id === n.id) return;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        // Bounds
        n.x = Math.max(n.radius, Math.min(canvas.width - n.radius, n.x));
        n.y = Math.max(n.radius, Math.min(canvas.height - n.radius, n.y));
      });
    };

    const draw = () => {
      tickRef.current++;
      applyForces();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const nodes = graphRef.current.nodes;
      const edges = graphRef.current.edges;

      // Draw edges
      edges.forEach(edge => {
        const source = getNodeById(edge.source);
        const target = getNodeById(edge.target);
        if (!source || !target) return;

        const isHighlighted = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = isHighlighted ? edge.color.replace(/[\d.]+\)$/, '0.6)') : edge.color;
        ctx.lineWidth = isHighlighted ? edge.width * 2 : edge.width;
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const pulse = Math.sin(tickRef.current * 0.03 + nodes.indexOf(node)) * 0.15 + 1;
        const r = node.radius * (isHovered ? 1.3 : 1) * (node.type === 'risk' ? pulse : 1);

        // Glow
        if (isHovered || isSelected || node.type === 'risk') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 2, 0, Math.PI * 2);
          const grd = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, r * 2);
          grd.addColorStop(0, node.glowColor);
          grd.addColorStop(1, 'transparent');
          ctx.fillStyle = grd;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = isSelected ? 2 : 0.5;
        ctx.stroke();

        // Label
        ctx.font = `${isHovered ? 'bold ' : ''}${node.type === 'algorithm' ? '10' : '8'}px ui-monospace, monospace`;
        ctx.fillStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (node.type === 'algorithm' || node.type === 'risk' || isHovered) {
          ctx.fillText(node.label, node.x, node.y + r + 12);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      if (dragNode.current) {
        dragNode.current.x = mousePos.current.x;
        dragNode.current.y = mousePos.current.y;
        dragNode.current.vx = 0;
        dragNode.current.vy = 0;
        return;
      }

      // Find hovered node
      let found: GraphNode | null = null;
      for (const node of graphRef.current.nodes) {
        const dx = mousePos.current.x - node.x;
        const dy = mousePos.current.y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < node.radius + 5) {
          found = node;
          break;
        }
      }
      setHoveredNode(found);
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const node of graphRef.current.nodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < node.radius + 5) {
          dragNode.current = node;
          setSelectedNode(node);
          return;
        }
      }
      setSelectedNode(null);
    };

    const handleMouseUp = () => {
      dragNode.current = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  const legendItems = [
    { color: '#3b82f6', label: 'Systems', icon: <Server className="w-3 h-3" /> },
    { color: '#ef4444', label: 'Vulnerable (RSA-2048)', icon: <Lock className="w-3 h-3" /> },
    { color: '#f59e0b', label: 'At Risk (ECC)', icon: <Shield className="w-3 h-3" /> },
    { color: '#6366f1', label: 'Moderate (RSA-4096)', icon: <Cpu className="w-3 h-3" /> },
    { color: '#22c55e', label: 'Quantum-Safe (AES)', icon: <Zap className="w-3 h-3" /> },
    { color: '#06b6d4', label: 'PQC (Kyber)', icon: <Globe className="w-3 h-3" /> },
    { color: '#f43f5e', label: 'Threat Vectors', icon: <Database className="w-3 h-3" /> },
  ];

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Graph Explorer</h1>
          <p className="text-muted-foreground">Interactive visualization of system architecture, cryptographic algorithms, and dependencies</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}40` }} />
              {item.label}
            </div>
          ))}
          <div className="ml-auto text-[10px] text-slate-500">Click & drag nodes · Click to select</div>
        </div>

        {/* Graph Canvas */}
        <div
          ref={containerRef}
          className="relative rounded-xl overflow-hidden"
          style={{
            height: '600px',
            background: 'radial-gradient(ellipse at center, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)',
          }}
        >
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Node Info Panel */}
          {selectedNode && (
            <div
              className="absolute top-4 right-4 w-64 rounded-xl p-4 space-y-2"
              style={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(99,102,241,0.2)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: selectedNode.color, boxShadow: `0 0 8px ${selectedNode.glowColor}` }} />
                <h4 className="text-sm font-bold text-white font-mono">{selectedNode.label}</h4>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Type</p>
                <p className="text-xs text-slate-300 capitalize">{selectedNode.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Connections</p>
                <p className="text-xs text-slate-300">
                  {graphRef.current.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} edges
                </p>
              </div>
              {selectedNode.type === 'algorithm' && (
                <div className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-xs text-slate-300">
                    {selectedNode.label.includes('RSA-2048') ? '⚠️ Vulnerable to quantum attacks' :
                      selectedNode.label.includes('ECC') ? '🔶 At risk — migration recommended' :
                        selectedNode.label.includes('RSA-4096') ? '🔵 Moderate risk — plan migration' :
                          selectedNode.label.includes('AES') ? '✅ Quantum-safe' :
                            '✅ Post-quantum cryptography'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stats Overlay */}
          <div
            className="absolute bottom-4 left-4 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-500"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            {graphRef.current.nodes.length} nodes · {graphRef.current.edges.length} edges · Force-directed layout
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
