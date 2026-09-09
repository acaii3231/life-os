import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Network,
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  Download, 
  FolderPlus, 
  ChevronDown, 
  FileText, 
  Palette, 
  ArrowRight, 
  CheckSquare, 
  Copy, 
  X
} from 'lucide-react';
import api from '../services/api';

// Paleta de cores vibrantes estilo MindMeister
const COLOR_PALETTE = [
  { name: 'Esmeralda', hex: '#10b981', border: 'border-emerald-500', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  { name: 'Ciano', hex: '#06b6d4', border: 'border-cyan-500', bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  { name: 'Violeta', hex: '#a855f7', border: 'border-purple-500', bg: 'bg-purple-500/15', text: 'text-purple-400' },
  { name: 'Âmbar', hex: '#f59e0b', border: 'border-amber-500', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  { name: 'Rosa', hex: '#ec4899', border: 'border-pink-500', bg: 'bg-pink-500/15', text: 'text-pink-400' },
  { name: 'Azul Cyber', hex: '#3b82f6', border: 'border-blue-500', bg: 'bg-blue-500/15', text: 'text-blue-400' },
  { name: 'Neutro', hex: '#94a3b8', border: 'border-slate-500', bg: 'bg-slate-500/15', text: 'text-slate-300' },
];

// Emojis rápidos para ideias
const QUICK_EMOJIS = ['🧠', '💡', '🚀', '💰', '🔥', '⚡', '🎯', '📈', '💎', '⭐', '✨', '📝', '🛒', '⚙️', '🤖', '👑'];

// Templates iniciais de mapas
const MAP_TEMPLATES = [
  {
    id: 'blank',
    name: 'Mapa em Branco',
    desc: 'Um núcleo central pronto para suas ideias livres.',
    nodes: [
      { id: 'root', text: 'Ideia Central', x: 0, y: 0, color: '#10b981', icon: '🧠', parentId: null, notes: '' },
      { id: 'n1', text: 'Tópico 1', x: 280, y: -60, color: '#10b981', icon: '💡', parentId: 'root', notes: '' },
      { id: 'n2', text: 'Tópico 2', x: 280, y: 60, color: '#06b6d4', icon: '🚀', parentId: 'root', notes: '' },
      { id: 'n3', text: 'Tópico 3', x: -280, y: 0, color: '#f59e0b', icon: '⚡', parentId: 'root', notes: '' }
    ]
  },
  {
    id: 'business',
    name: 'Estratégia & Negócios',
    desc: 'Vendas, Marketing, Operação e Inovação.',
    nodes: [
      { id: 'root', text: 'Meu Negócio 2026', x: 0, y: 0, color: '#10b981', icon: '👑', parentId: null },
      { id: 'b1', text: 'Marketing & Tráfego', x: 300, y: -120, color: '#10b981', icon: '🚀', parentId: 'b1' },
      { id: 'b1_1', text: 'Anúncios Meta/Google', x: 560, y: -160, color: '#10b981', icon: '📈', parentId: 'b1' },
      { id: 'b1_2', text: 'Conteúdo Orgânico', x: 560, y: -80, color: '#10b981', icon: '✨', parentId: 'b1' },
      { id: 'b2', text: 'Vendas & Conversão', x: 300, y: 120, color: '#f59e0b', icon: '💰', parentId: 'root' },
      { id: 'b2_1', text: 'Funil WhatsApp', x: 560, y: 80, color: '#f59e0b', icon: '⚡', parentId: 'b2' },
      { id: 'b2_2', text: 'Ofertas & Upsell', x: 560, y: 160, color: '#f59e0b', icon: '💎', parentId: 'b2' },
      { id: 'b3', text: 'Operações & Equipe', x: -300, y: -120, color: '#06b6d4', icon: '⚙️', parentId: 'root' },
      { id: 'b4', text: 'Finanças & Lucro', x: -300, y: 120, color: '#a855f7', icon: '📊', parentId: 'root' }
    ]
  },
  {
    id: 'brain',
    name: '🧠 Cérebro & Alta Performance',
    desc: 'Organização mental, rotina, saúde e projetos.',
    nodes: [
      { id: 'root', text: 'MEU CÉREBRO', x: 0, y: 0, color: '#10b981', icon: '🧠', parentId: null },
      { id: 'c1', text: 'Projetos Prioritários', x: 300, y: -140, color: '#10b981', icon: '🚀', parentId: 'root' },
      { id: 'c1_1', text: 'Life OS & Ferramentas', x: 580, y: -140, color: '#10b981', icon: '💻', parentId: 'c1' },
      { id: 'c2', text: 'Finanças & Metas', x: 300, y: 140, color: '#f59e0b', icon: '💎', parentId: 'root' },
      { id: 'c3', text: 'Corpo & Energia', x: -300, y: -140, color: '#06b6d4', icon: '🔥', parentId: 'root' },
      { id: 'c3_1', text: 'Treino Diário', x: -580, y: -180, color: '#06b6d4', icon: '💪', parentId: 'c3' },
      { id: 'c3_2', text: 'Sono Reparador', x: -580, y: -100, color: '#06b6d4', icon: '🌙', parentId: 'c3' },
      { id: 'c4', text: 'Insights & Estudos', x: -300, y: 140, color: '#a855f7', icon: '💡', parentId: 'root' }
    ]
  }
];

export function MindMapPage({ onOpenTaskModal }) {
  // Mapas e seleção
  const [mapsList, setMapsList] = useState([]);
  const [currentMap, setCurrentMap] = useState(null);
  const [nodes, setNodes] = useState([]);
  
  // Estados de navegação no canvas
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Arraste de nós
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragNodeOffset, setDragNodeOffset] = useState({ x: 0, y: 0 });

  // Seleção e edição
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Painel lateral de detalhes / notas
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Modais de gerenciamento
  const [isMapListOpen, setIsMapListOpen] = useState(false);
  const [isNewMapModalOpen, setIsNewMapModalOpen] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');

  // Status de salvamento e feedback
  const [saveStatus, setSaveStatus] = useState('saved'); // saved | saving | unsaved
  const [, setIsLoading] = useState(true);

  // Paleta flutuante ativa (color | emoji)
  const [activePicker, setActivePicker] = useState(null);

  const canvasRef = useRef(null);
  const editInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // 1. Carregar mapas do usuário
  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async (preferredId = null) => {
    setIsLoading(true);
    try {
      const res = await api.mindMaps.list();
      const list = res.maps || [];
      setMapsList(list);

      if (list.length > 0) {
        let active = list[0];
        if (preferredId) {
          const found = list.find(m => String(m.id) === String(preferredId));
          if (found) active = found;
        }
        selectMap(active);
      } else {
        await handleCreateMap('🧠 Meu Cérebro & Ideias', 'brain');
      }
    } catch (err) {
      console.error('Erro ao carregar mapas mentais:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectMap = (map) => {
    setCurrentMap(map);
    const rawNodes = Array.isArray(map.nodes) ? map.nodes : [];
    setNodes(rawNodes);
    setSelectedNodeId(rawNodes.find(n => !n.parentId)?.id || rawNodes[0]?.id || null);
    setSaveStatus('saved');
    centerView();
  };

  // 2. Centralizar visão no canvas
  const centerView = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setPan({ x: rect.width / 2, y: rect.height / 2 });
    setZoom(1);
  }, []);

  // 3. Foco no input ao iniciar edição
  useEffect(() => {
    if (editingNodeId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNodeId]);

  // 4. Agendar salvamento automático (Debounced 1.2s)
  const scheduleAutoSave = (updatedNodes, updatedMap = currentMap) => {
    setSaveStatus('unsaved');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      if (!updatedMap) return;
      setSaveStatus('saving');
      try {
        await api.mindMaps.update(updatedMap.id, {
          nodes: updatedNodes
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Erro no auto-save:', err);
        setSaveStatus('unsaved');
      }
    }, 1200);
  };

  // 5. Salvar Manual
  const handleManualSave = async () => {
    if (!currentMap) return;
    setSaveStatus('saving');
    try {
      await api.mindMaps.update(currentMap.id, {
        nodes: nodes
      });
      setSaveStatus('saved');
    } catch (err) {
      alert('Erro ao salvar mapa mental: ' + err.message);
      setSaveStatus('unsaved');
    }
  };

  // 6. Criar Novo Mapa
  const handleCreateMap = async (title, templateId) => {
    const template = MAP_TEMPLATES.find(t => t.id === templateId) || MAP_TEMPLATES[0];
    const initialNodes = JSON.parse(JSON.stringify(template.nodes));
    if (title && initialNodes[0]) {
      initialNodes[0].text = title;
    }

    try {
      const res = await api.mindMaps.create({
        title: title || 'Novo Mapa Mental',
        nodes: initialNodes,
        description: template.desc
      });
      if (res.map) {
        setIsNewMapModalOpen(false);
        setNewMapTitle('');
        await loadMaps(res.map.id);
      }
    } catch (err) {
      alert('Erro ao criar mapa: ' + err.message);
    }
  };

  // 7. Excluir Mapa Atual
  const handleDeleteCurrentMap = async () => {
    if (!currentMap) return;
    if (mapsList.length <= 1) {
      alert('Você precisa ter pelo menos um mapa mental.');
      return;
    }
    if (!confirm(`Deseja realmente excluir o mapa mental "${currentMap.title}"?`)) return;

    try {
      await api.mindMaps.delete(currentMap.id);
      await loadMaps();
    } catch (err) {
      alert('Erro ao excluir mapa: ' + err.message);
    }
  };

  // 8. Duplicar Mapa Atual
  const handleDuplicateCurrentMap = async () => {
    if (!currentMap) return;
    try {
      const res = await api.mindMaps.create({
        title: `${currentMap.title} (Cópia)`,
        nodes: nodes,
        description: currentMap.description
      });
      if (res.map) {
        await loadMaps(res.map.id);
      }
    } catch (err) {
      alert('Erro ao duplicar mapa: ' + err.message);
    }
  };

  // 9. Renomear Mapa
  const handleRenameMap = async () => {
    if (!currentMap) return;
    const newTitle = prompt('Novo nome do mapa mental:', currentMap.title);
    if (!newTitle || newTitle.trim() === '') return;

    try {
      await api.mindMaps.update(currentMap.id, { title: newTitle.trim() });
      setCurrentMap(prev => ({ ...prev, title: newTitle.trim() }));
      setMapsList(prev => prev.map(m => m.id === currentMap.id ? { ...m, title: newTitle.trim() } : m));
    } catch (err) {
      alert('Erro ao renomear: ' + err.message);
    }
  };

  // ==========================================
  // MANIPULAÇÃO DE NÓS (MindMeister Core)
  // ==========================================

  const handleAddChild = (parentId = selectedNodeId) => {
    if (!parentId) {
      parentId = nodes.find(n => !n.parentId)?.id || nodes[0]?.id;
    }
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const childId = `node_${Date.now()}`;
    const isRoot = !parentNode.parentId;
    const parentX = parentNode.x || 0;
    const parentY = parentNode.y || 0;

    let side = 'right';
    if (isRoot) {
      const currentChildren = nodes.filter(n => n.parentId === parentId);
      side = currentChildren.length % 2 === 0 ? 'right' : 'left';
    } else {
      side = parentX >= 0 ? 'right' : 'left';
    }

    const offsetX = side === 'right' ? 240 : -240;
    const siblingCount = nodes.filter(n => n.parentId === parentId).length;
    const offsetY = (siblingCount - 1) * 60;

    const newNode = {
      id: childId,
      text: 'Nova Ideia',
      x: parentX + offsetX,
      y: parentY + offsetY,
      color: parentNode.color || '#10b981',
      icon: '💡',
      parentId: parentId,
      notes: ''
    };

    const updated = [...nodes, newNode];
    setNodes(updated);
    setSelectedNodeId(childId);
    setEditingNodeId(childId);
    setEditingText('Nova Ideia');
    scheduleAutoSave(updated);
  };

  const handleAddSibling = (targetId = selectedNodeId) => {
    if (!targetId) return;
    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode || !targetNode.parentId) {
      handleAddChild(targetId);
      return;
    }

    const parentNode = nodes.find(n => n.id === targetNode.parentId);
    const siblingId = `node_${Date.now()}`;

    const newNode = {
      id: siblingId,
      text: 'Nova Ideia',
      x: targetNode.x,
      y: targetNode.y + 70,
      color: targetNode.color || parentNode?.color || '#10b981',
      icon: '💡',
      parentId: targetNode.parentId,
      notes: ''
    };

    const updated = [...nodes, newNode];
    setNodes(updated);
    setSelectedNodeId(siblingId);
    setEditingNodeId(siblingId);
    setEditingText('Nova Ideia');
    scheduleAutoSave(updated);
  };

  const handleDeleteNode = (nodeId = selectedNodeId) => {
    if (!nodeId) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (!node.parentId) {
      alert('O nó central não pode ser excluído.');
      return;
    }

    const idsToDelete = new Set([nodeId]);
    const collectChildren = (pid) => {
      nodes.filter(n => n.parentId === pid).forEach(child => {
        idsToDelete.add(child.id);
        collectChildren(child.id);
      });
    };
    collectChildren(nodeId);

    const updated = nodes.filter(n => !idsToDelete.has(n.id));
    setNodes(updated);
    setSelectedNodeId(node.parentId);
    setEditingNodeId(null);
    setIsDetailsOpen(false);
    scheduleAutoSave(updated);
  };

  const handleStartEdit = (node) => {
    setEditingNodeId(node.id);
    setEditingText(node.text);
    setActivePicker(null);
  };

  const handleSaveEdit = () => {
    if (!editingNodeId) return;
    const trimmed = editingText.trim() || 'Ideia sem título';
    const updated = nodes.map(n => n.id === editingNodeId ? { ...n, text: trimmed } : n);
    setNodes(updated);
    setEditingNodeId(null);
    scheduleAutoSave(updated);
  };

  const handleChangeColor = (hex) => {
    if (!selectedNodeId) return;
    const updated = nodes.map(n => {
      if (n.id === selectedNodeId) return { ...n, color: hex };
      return n;
    });
    setNodes(updated);
    setActivePicker(null);
    scheduleAutoSave(updated);
  };

  const handleChangeIcon = (emoji) => {
    if (!selectedNodeId) return;
    const updated = nodes.map(n => n.id === selectedNodeId ? { ...n, icon: emoji } : n);
    setNodes(updated);
    setActivePicker(null);
    scheduleAutoSave(updated);
  };

  const handleUpdateNotes = (notesText) => {
    if (!selectedNodeId) return;
    const updated = nodes.map(n => n.id === selectedNodeId ? { ...n, notes: notesText } : n);
    setNodes(updated);
    scheduleAutoSave(updated);
  };

  const handleAutoLayout = () => {
    const rootNode = nodes.find(n => !n.parentId);
    if (!rootNode) return;

    const newNodes = JSON.parse(JSON.stringify(nodes));
    const root = newNodes.find(n => !n.parentId);
    root.x = 0;
    root.y = 0;

    const level1Children = newNodes.filter(n => n.parentId === root.id);
    const rightChildren = [];
    const leftChildren = [];

    level1Children.forEach((child, i) => {
      if (i % 2 === 0) rightChildren.push(child);
      else leftChildren.push(child);
    });

    const layoutSide = (children, isRight) => {
      const total = children.length;
      const spacingY = 120;
      const startY = -((total - 1) * spacingY) / 2;
      const dir = isRight ? 1 : -1;

      children.forEach((c, idx) => {
        c.x = dir * 280;
        c.y = startY + idx * spacingY;

        const subChildren = newNodes.filter(n => n.parentId === c.id);
        const subTotal = subChildren.length;
        if (subTotal > 0) {
          const subSpacingY = 70;
          const subStartY = c.y - ((subTotal - 1) * subSpacingY) / 2;
          subChildren.forEach((sc, sidx) => {
            sc.x = c.x + dir * 240;
            sc.y = subStartY + sidx * subSpacingY;

            const deepChildren = newNodes.filter(n => n.parentId === sc.id);
            if (deepChildren.length > 0) {
              const deepStartY = sc.y - ((deepChildren.length - 1) * 60) / 2;
              deepChildren.forEach((dc, didx) => {
                dc.x = sc.x + dir * 220;
                dc.y = deepStartY + didx * 60;
              });
            }
          });
        }
      });
    };

    layoutSide(rightChildren, true);
    layoutSide(leftChildren, false);

    setNodes(newNodes);
    scheduleAutoSave(newNodes);
    centerView();
  };

  const handleConvertToTask = async () => {
    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node) return;

    try {
      await api.tasks.create({
        title: `${node.icon ? node.icon + ' ' : ''}${node.text}`,
        description: node.notes ? `Origem: Mapa Mental "${currentMap?.title}"\n\n${node.notes}` : `Origem: Mapa Mental "${currentMap?.title}"`,
        status: 'todo',
        priority: 'medium'
      });
      alert(`✨ Ideia "${node.text}" convertida com sucesso em tarefa no Kanban!`);
      if (onOpenTaskModal) onOpenTaskModal();
    } catch (err) {
      alert('Erro ao converter em tarefa: ' + err.message);
    }
  };

  const handleExportJSON = () => {
    if (!currentMap) return;
    const exportData = {
      title: currentMap.title,
      exportedAt: new Date().toISOString(),
      nodes: nodes
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMap.title.replace(/[^a-zA-Z0-9]/g, '_')}_mapa_mental.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // EVENTOS DE MOUSE E CANVAS
  // ==========================================

  const handleCanvasMouseDown = (e) => {
    if (e.target !== canvasRef.current && !e.target.classList.contains('canvas-bg')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setSelectedNodeId(null);
    setEditingNodeId(null);
    setActivePicker(null);
  };

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setActivePicker(null);
    setDraggingNodeId(node.id);

    setDragNodeOffset({
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y
    });
  };

  // Sincronização de movimento ultra-fluida (Zero Latência com requestAnimationFrame)
  useEffect(() => {
    if (!isPanning && !draggingNodeId) return;

    let rafId = null;

    const onWindowMouseMove = (e) => {
      if (isPanning) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setPan({
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y
          });
        });
        return;
      }

      if (draggingNodeId) {
        const dx = (e.clientX - dragNodeOffset.startX) / zoom;
        const dy = (e.clientY - dragNodeOffset.startY) / zoom;
        const targetX = Math.round(dragNodeOffset.nodeStartX + dx);
        const targetY = Math.round(dragNodeOffset.nodeStartY + dy);

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setNodes(prev => prev.map(n => {
            if (n.id === draggingNodeId) {
              return { ...n, x: targetX, y: targetY };
            }
            return n;
          }));
        });
      }
    };

    const onWindowMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (isPanning) setIsPanning(false);
      if (draggingNodeId) {
        setDraggingNodeId(null);
        setNodes(latest => {
          scheduleAutoSave(latest);
          return latest;
        });
      }
    };

    window.addEventListener('mousemove', onWindowMouseMove, { passive: true });
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isPanning, panStart, draggingNodeId, dragNodeOffset, zoom]);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(2.5, Math.max(0.3, Number((prev * zoomFactor).toFixed(2)))));
  };

  // Atalhos de Teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (e.key === 'Enter' && e.target === editInputRef.current) {
          handleSaveEdit();
        } else if (e.key === 'Escape' && e.target === editInputRef.current) {
          setEditingNodeId(null);
        }
        return;
      }

      if (!selectedNodeId) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        handleAddChild(selectedNodeId);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSibling(selectedNodeId);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteNode(selectedNodeId);
      } else if (e.key === 'F2') {
        e.preventDefault();
        const node = nodes.find(n => n.id === selectedNodeId);
        if (node) handleStartEdit(node);
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setActivePicker(null);
        setIsDetailsOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, editingNodeId, editingText, currentMap]);

  // Renderização de conexões curvas Bézier orgânicas
  const renderConnections = () => {
    const lines = [];
    nodes.forEach(node => {
      if (!node.parentId) return;
      const parent = nodes.find(n => n.id === node.parentId);
      if (!parent) return;

      const isRight = node.x >= parent.x;
      const parentW = !parent.parentId ? 140 : 120;
      const childW = 100;

      const startX = parent.x + (isRight ? parentW / 2 : -parentW / 2);
      const startY = parent.y;
      const endX = node.x + (isRight ? -childW / 2 : childW / 2);
      const endY = node.y;

      const controlDist = Math.abs(endX - startX) * 0.55;
      const cp1x = startX + (isRight ? controlDist : -controlDist);
      const cp1y = startY;
      const cp2x = endX - (isRight ? controlDist : -controlDist);
      const cp2y = endY;

      const pathData = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
      const isBranchSelected = selectedNodeId === node.id || selectedNodeId === parent.id;
      const strokeColor = node.color || parent.color || '#10b981';

      lines.push(
        <g key={`conn_${parent.id}_${node.id}`}>
          {isBranchSelected && (
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth="6"
              strokeOpacity="0.25"
              strokeLinecap="round"
            />
          )}
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={!parent.parentId ? "3.5" : "2.2"}
            strokeOpacity={isBranchSelected ? "1" : "0.75"}
            strokeLinecap="round"
          />
        </g>
      );
    });

    return lines;
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="relative w-full h-[calc(100vh-5.5rem)] flex flex-col bg-dark-950 rounded-2xl border border-white/5 overflow-hidden select-none">
      {/* 1. BARRA SUPERIOR: Gerenciador de Mapas & Ferramentas MindMeister */}
      <div className="h-14 px-4 bg-dark-900/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-glow-emerald flex items-center justify-center">
            <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
              <Network className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMapListOpen(!isMapListOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-950 border border-white/10 hover:border-emerald-500/40 text-white text-xs font-bold transition-all"
            >
              <span className="truncate max-w-[180px] sm:max-w-[260px]">
                {currentMap?.title || 'Selecionar Mapa Mental'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                {nodes.length} nós
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Menu Dropdown de Mapas Salvos */}
            {isMapListOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
                  <span>Meus Mapas Mentais</span>
                  <span className="font-mono text-emerald-400">{mapsList.length}</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                  {mapsList.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        selectMap(m);
                        setIsMapListOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                        currentMap?.id === m.id
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{m.title}</span>
                      {currentMap?.id === m.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1">
                  <button
                    onClick={() => {
                      setIsMapListOpen(false);
                      setIsNewMapModalOpen(true);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Novo Mapa Mental</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsNewMapModalOpen(true)}
            className="p-2 rounded-xl bg-dark-950 border border-white/10 hover:border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-all text-xs font-bold flex items-center gap-1.5"
            title="Criar Novo Mapa"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>

        {/* Lado Central: Ações do Mapa */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handleAutoLayout}
            className="px-3 py-1.5 rounded-xl bg-dark-950 border border-white/10 hover:border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Organizar todos os ramos automaticamente como no MindMeister"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Organizar</span>
          </button>

          <button
            onClick={handleRenameMap}
            className="px-2.5 py-1.5 rounded-xl bg-dark-950 border border-white/10 hover:border-white/20 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all"
            title="Renomear mapa atual"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Renomear</span>
          </button>

          <button
            onClick={handleDuplicateCurrentMap}
            className="p-1.5 rounded-xl bg-dark-950 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all"
            title="Duplicar Mapa"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportJSON}
            className="p-1.5 rounded-xl bg-dark-950 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all"
            title="Baixar Mapa (JSON)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDeleteCurrentMap}
            className="p-1.5 rounded-xl bg-dark-950 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all"
            title="Excluir Mapa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lado Direito: Status de Salvamento e Salvar Agora */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">Salvo na nuvem</span>
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Salvando...</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Alterações pendentes</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-dark-950 text-xs font-extrabold hover:bg-emerald-400 flex items-center gap-1.5 shadow-glow-emerald transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* 2. ÁREA CENTRAL: CANVAS INTERATIVO INFINITO COM CURVAS BEZIER */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing canvas-bg bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: 'none',
            willChange: 'transform'
          }}
          className="absolute left-0 top-0 w-0 h-0 pointer-events-none"
        >
          {/* Camada SVG para as Conexões Curvas Orgânicas Bézier */}
          <svg
            className="overflow-visible pointer-events-none absolute left-0 top-0"
            style={{ width: 1, height: 1 }}
          >
            {renderConnections()}
          </svg>

          {/* Camada de Nós Interativos DOM */}
          {nodes.map(node => {
            const isRoot = !node.parentId;
            const isSelected = selectedNodeId === node.id;
            const isEditing = editingNodeId === node.id;
            const hasNotes = !!node.notes && node.notes.trim().length > 0;
            const childrenCount = nodes.filter(n => n.parentId === node.id).length;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit(node);
                }}
                style={{
                  transform: `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)`,
                  borderColor: node.color || '#10b981',
                  willChange: 'transform'
                }}
                className={`absolute pointer-events-auto group cursor-pointer transition-shadow select-none ${
                  isRoot
                    ? 'px-6 py-3.5 rounded-2xl bg-gradient-to-tr from-dark-900 via-dark-900 to-emerald-950/80 border-2 shadow-glow-emerald text-white text-base font-black tracking-wide flex items-center gap-3'
                    : `px-4 py-2 rounded-xl bg-dark-900/95 border backdrop-blur-md text-xs font-semibold flex items-center gap-2 ${
                        isSelected 
                          ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-dark-950 shadow-2xl scale-105' 
                          : 'hover:border-opacity-100 hover:scale-[1.02]'
                      }`
                }`}
              >
                <span className={isRoot ? 'text-xl' : 'text-sm'}>
                  {node.icon || (isRoot ? '🧠' : '💡')}
                </span>

                {isEditing ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') setEditingNodeId(null);
                    }}
                    className="bg-dark-950 border border-emerald-400 rounded px-2 py-0.5 text-white font-bold outline-none ring-1 ring-emerald-400 min-w-[120px]"
                  />
                ) : (
                  <span className={`text-white whitespace-nowrap ${isRoot ? 'text-sm font-black' : 'text-xs'}`}>
                    {node.text}
                  </span>
                )}

                {hasNotes && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" title="Possui notas detalhadas"></span>
                )}

                {childrenCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono">
                    {childrenCount}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddChild(node.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-dark-950 flex items-center justify-center transition-all absolute -right-2.5 top-1/2 -translate-y-1/2 shadow-lg"
                  title="Adicionar Ideia Filha (Tab)"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            );
          })}
        </div>

        {/* 3. TOOLBAR FLUTUANTE DE AÇÕES DO NÓ SELECIONADO (Estilo MindMeister) */}
        {selectedNode && !isPanning && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-dark-900/95 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-2xl flex items-center gap-1.5 z-30 animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => handleAddChild(selectedNode.id)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/30 transition-all"
              title="Adicionar ramo filho (Atalho: Tab)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Filho (Tab)</span>
            </button>

            <button
              onClick={() => handleAddSibling(selectedNode.id)}
              className="px-2.5 py-1.5 rounded-xl bg-dark-950 hover:bg-white/5 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-white/10 transition-all"
              title="Adicionar ramo irmão (Atalho: Enter)"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>+ Irmão (Enter)</span>
            </button>

            <div className="w-px h-5 bg-white/10 mx-1"></div>

            <button
              onClick={() => handleStartEdit(selectedNode)}
              className="p-2 rounded-xl bg-dark-950 hover:bg-white/5 text-slate-300 hover:text-white transition-all"
              title="Editar texto (F2)"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Seletor de Cores */}
            <div className="relative">
              <button
                onClick={() => setActivePicker(activePicker === 'color' ? null : 'color')}
                className="p-2 rounded-xl bg-dark-950 hover:bg-white/5 text-slate-300 hover:text-white transition-all flex items-center gap-1"
                title="Alterar Cor"
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20"
                  style={{ backgroundColor: selectedNode.color || '#10b981' }}
                ></div>
                <Palette className="w-3 h-3 text-slate-400" />
              </button>

              {activePicker === 'color' && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 p-2 bg-dark-900 border border-white/10 rounded-xl shadow-2xl flex gap-1.5 z-50 animate-in fade-in">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => handleChangeColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className="w-6 h-6 rounded-full hover:scale-110 transition-transform shadow"
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Seletor de Emojis */}
            <div className="relative">
              <button
                onClick={() => setActivePicker(activePicker === 'emoji' ? null : 'emoji')}
                className="p-2 rounded-xl bg-dark-950 hover:bg-white/5 text-slate-300 hover:text-white transition-all text-xs"
                title="Alterar Ícone"
              >
                {selectedNode.icon || '💡'}
              </button>

              {activePicker === 'emoji' && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 p-2 bg-dark-900 border border-white/10 rounded-xl shadow-2xl grid grid-cols-4 gap-1 z-50 animate-in fade-in w-36">
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleChangeIcon(emoji)}
                      className="p-1 text-base hover:bg-white/10 rounded transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsDetailsOpen(true)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                selectedNode.notes 
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' 
                  : 'bg-dark-950 text-slate-300 border-white/10 hover:bg-white/5'
              }`}
              title="Notas e detalhes da ideia"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notas</span>
            </button>

            {/* Virar Tarefa no Kanban */}
            <button
              onClick={handleConvertToTask}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
              title="Transformar esta ideia em uma tarefa no Kanban"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Virar Tarefa</span>
            </button>

            <div className="w-px h-5 bg-white/10 mx-1"></div>

            {selectedNode.parentId && (
              <button
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="p-2 rounded-xl bg-dark-950 hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 transition-all"
                title="Excluir nó e sub-ramos (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 4. CONTROLES DE ZOOM E NAVEGAÇÃO DO CANVAS (Inferior Esquerdo) */}
        <div className="absolute bottom-4 left-4 bg-dark-900/90 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-xl flex items-center gap-1 z-20">
          <button
            onClick={() => setZoom(prev => Math.min(2.5, Number((prev + 0.15).toFixed(2))))}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.max(0.3, Number((prev - 0.15).toFixed(2))))}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <button
            onClick={centerView}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
            title="Centralizar no Núcleo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Centro</span>
          </button>
        </div>

        {/* 5. GUIA RÁPIDO DE ATALHOS (Inferior Direito) */}
        <div className="hidden lg:flex absolute bottom-4 right-4 bg-dark-900/80 backdrop-blur-md border border-white/5 px-3 py-2 rounded-2xl text-[11px] text-slate-400 items-center gap-4 z-20">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-dark-950 border border-white/10 text-white font-mono text-[10px]">Tab</kbd>
            <span>Filho</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-dark-950 border border-white/10 text-white font-mono text-[10px]">Enter</kbd>
            <span>Irmão</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-dark-950 border border-white/10 text-white font-mono text-[10px]">F2</kbd>
            <span>Editar</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-dark-950 border border-white/10 text-white font-mono text-[10px]">Del</kbd>
            <span>Excluir</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-dark-950 border border-white/10 text-white font-mono text-[10px]">Arraste</kbd>
            <span>Mover Nós</span>
          </span>
        </div>
      </div>

      {/* 6. DRAWER LATERAL: NOTAS E DETALHES DA IDEIA */}
      {isDetailsOpen && selectedNode && (
        <div className="absolute right-0 top-14 bottom-0 w-80 sm:w-96 bg-dark-900 border-l border-white/10 shadow-2xl p-5 z-40 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedNode.icon || '💡'}</span>
              <div>
                <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                  {selectedNode.text}
                </h4>
                <span className="text-[10px] text-slate-400">
                  {selectedNode.parentId ? 'Ramo de Ideia' : 'Núcleo Central'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsDetailsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 py-4 flex flex-col space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Título do Tópico
              </label>
              <input
                type="text"
                value={selectedNode.text}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, text: val } : n);
                  setNodes(updated);
                  scheduleAutoSave(updated);
                }}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 font-semibold"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Notas & Brainstorming</span>
                <span className="text-[10px] text-slate-500">Markdown suportado</span>
              </label>
              <textarea
                value={selectedNode.notes || ''}
                onChange={(e) => handleUpdateNotes(e.target.value)}
                placeholder="Escreva detalhes, links, planos de ação ou pensamentos profundos sobre esta ideia..."
                className="flex-1 w-full bg-dark-950 border border-white/10 rounded-xl p-3.5 text-xs text-slate-200 focus:border-emerald-500 resize-none font-sans leading-relaxed"
                rows={8}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-dark-950 border border-white/5 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Ações Rápidas
              </span>
              <button
                onClick={handleConvertToTask}
                className="w-full py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Converter esta Ideia em Tarefa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: CRIAR NOVO MAPA MENTAL */}
      {isNewMapModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Novo Mapa Mental</h3>
              </div>
              <button
                onClick={() => setIsNewMapModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Nome do Mapa
              </label>
              <input
                type="text"
                value={newMapTitle}
                onChange={(e) => setNewMapTitle(e.target.value)}
                placeholder="Ex: Lançamento Q3, Meu Cérebro, Estratégia de Conteúdo..."
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 font-bold"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Escolha um Modelo Inicial
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {MAP_TEMPLATES.map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedTemplate === tpl.id
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-glow-emerald text-white'
                        : 'bg-dark-950 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <span className="block font-bold text-xs mb-1">{tpl.name}</span>
                    <span className="block text-[10px] text-slate-400 leading-tight">{tpl.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsNewMapModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-dark-950 text-slate-300 text-xs font-semibold hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleCreateMap(newMapTitle, selectedTemplate)}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-dark-950 text-xs font-extrabold hover:bg-emerald-400 transition-all shadow-glow-emerald"
              >
                Criar Mapa Mental
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MindMapPage;
