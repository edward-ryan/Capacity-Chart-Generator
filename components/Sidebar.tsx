import React, { useRef, useState, useEffect } from 'react';
import { ChartSettings, ChartDataRow } from '../types';
import { EyeIcon } from '../App';

interface SidebarProps {
  settings: ChartSettings;
  onUpdate: (settings: Partial<ChartSettings>) => void;
  onDownload: (format: 'png' | 'svg' | 'zip') => void;
}

interface CollapsibleHeaderProps {
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({ label, isCollapsed, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center justify-between w-full px-3 py-2.5 bg-[#27272a] border-b border-[#2e2e33] group select-none"
  >
    <span className="font-mono text-[9px] text-[#a1a1aa] uppercase tracking-wider">
      {label}
    </span>
    <span className={`material-symbols-outlined !text-[14px] text-[#a1a1aa] group-hover:text-[#e4e4e7] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
      expand_more
    </span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ settings, onUpdate, onDownload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const [collapsed, setCollapsed] = useState({
    design: false,
    axes: true,
    data: false
  });

  const toggleSection = (section: keyof typeof collapsed) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setIsPaletteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddRow = () => {
    if (settings.chartType === 'donut') return;
    const newData = [...settings.data, { label: `Value ${settings.data.length + 1}`, value: 0 }];
    onUpdate({ data: newData });
  };

  const handleRemoveRow = (index: number) => {
    if (settings.chartType === 'donut') return;
    const newData = settings.data.filter((_, i) => i !== index);
    let newHighlight = settings.highlightedIndex;
    if (settings.highlightedIndex === index) {
      newHighlight = -1;
    } else if (settings.highlightedIndex !== undefined && settings.highlightedIndex > index) {
      newHighlight = settings.highlightedIndex - 1;
    }
    onUpdate({ data: newData, highlightedIndex: newHighlight });
  };

  const handleRowChange = (index: number, field: keyof ChartDataRow, value: string | number) => {
    const newData = [...settings.data];
    let finalValue = value;
    if (field === 'value') {
      const parsed = typeof value === 'string' ? parseFloat(value) : value;
      finalValue = isNaN(parsed) ? 0 : Math.max(0, parsed);

      if (settings.chartType === 'donut' || settings.chartType === 'stacked') {
        finalValue = Math.min(100, finalValue as number);

        if (settings.chartType === 'stacked') {
          const currentSum = newData.reduce((sum, item, i) => i === index ? sum : sum + item.value, 0);
          if (currentSum + (finalValue as number) > 100) {
            finalValue = Math.max(0, 100 - currentSum);
          }
        }

        newData[index] = { ...newData[index], [field]: finalValue as number };
        onUpdate({ data: newData });
        return;
      }
    }
    newData[index] = { ...newData[index], [field]: finalValue as any };
    onUpdate({ data: newData });
  };

  const toggleHighlight = (index: number) => {
    onUpdate({ highlightedIndex: settings.highlightedIndex === index ? -1 : index });
  };

  const toggleHighlightColor = () => {
    onUpdate({ useHighlightColor: !settings.useHighlightColor });
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (settings.chartType === 'donut') return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const parsedData: ChartDataRow[] = [];
      lines.forEach((line) => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const label = parts[0].trim();
          const value = parseFloat(parts[1].trim());
          if (!isNaN(value)) parsedData.push({ label, value: Math.max(0, value) });
        }
      });
      if (parsedData.length > 0) {
        if (settings.chartType === 'stacked') {
          let runningSum = 0;
          const cappedData = parsedData.map(item => {
            const remaining = Math.max(0, 100 - runningSum);
            const val = Math.min(item.value, remaining);
            runningSum += val;
            return { ...item, value: val };
          });
          onUpdate({ data: cappedData, highlightedIndex: -1 });
        } else {
          onUpdate({ data: parsedData, highlightedIndex: -1 });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.chartType === 'donut' && json.data && json.data.length > 1) {
          json.data = [json.data[0]];
        }
        if (json.chartType === 'stacked' && json.data) {
          let runningSum = 0;
          json.data = json.data.map((item: any) => {
            const remaining = Math.max(0, 100 - runningSum);
            const val = Math.min(item.value, remaining);
            runningSum += val;
            return { ...item, value: val };
          });
        }
        onUpdate(json);
      } catch (err) {
        alert("Invalid source file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const densityLabels = ["Less", "Medium", "More"];
  const lightPalettes = [
    { bg: '#FFFFFF', fg: '#000000' },
    { bg: '#FFFFFF', fg: '#130831' },
    { bg: '#C1BBD8', fg: '#000000' },
    { bg: '#C1BBD8', fg: '#130831' },
    { bg: '#E9FF70', fg: '#000000' },
  ];
  const darkPalettes = [
    { bg: '#000000', fg: '#FFFFFF' },
    { bg: '#130831', fg: '#FFFFFF' },
    { bg: '#000000', fg: '#C1BBD8' },
    { bg: '#130831', fg: '#C1BBD8' },
    { bg: '#E6194D', fg: '#FFFFFF' },
    { bg: '#0D63F8', fg: '#FFFFFF' },
  ];
  const allPalettes = [...lightPalettes, ...darkPalettes];
  const currentPalette = allPalettes.find(p => p.bg === settings.backgroundColor && p.fg === settings.contentColor) || allPalettes[0];

  return (
    <div className="w-[340px] shrink-0 bg-[#18181b] border-r border-[#2e2e33] flex flex-col h-full z-10 overflow-hidden shadow-2xl">

      {/* Header */}
      <div className="px-5 pt-7 pb-5 border-b border-[#2e2e33]">
        <img src="/Capacity_Logo_White_2000w.svg" alt="Capacity" className="h-5 w-auto" />
        <p className="font-mono text-[10px] text-white tracking-widest uppercase mt-[50px]">Chart Generator</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Chart type description */}
        <div className="font-mono text-[10px] text-[#a1a1aa] leading-relaxed border-b border-[#2e2e33] pb-4">
          {settings.chartType === 'bar' && (
            <p>The <b>varied width bar chart</b> compares multiple categories. To emphasize a bar, star it in the "Chart Data" section to make it wider.</p>
          )}
          {settings.chartType === 'donut' && (
            <p>The <b>donut chart</b> displays a single percentage metric out of 100%.</p>
          )}
          {settings.chartType === 'stacked' && (
            <p>The <b>horizontal bar chart</b> stacks to display the proportion of multiple categories that add up to 100%.</p>
          )}
        </div>

        {/* Design Elements */}
        <div className="bg-[#202023] border border-[#2e2e33] rounded-md">
          <CollapsibleHeader label="Design Elements" isCollapsed={collapsed.design} onToggle={() => toggleSection('design')} />
          {!collapsed.design && (
            <div className="p-3 space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide">Chart Title</label>
                  <EyeIcon active={settings.showTitle} onClick={() => onUpdate({ showTitle: !settings.showTitle })} />
                </div>
                <textarea rows={2} className="w-full p-2.5 bg-zinc-800 border border-[#2e2e33] rounded font-mono text-[11px] text-[#e4e4e7] focus:outline-none focus:ring-1 focus:ring-[#BFB9DA] uppercase resize-none" value={settings.title} onChange={(e) => onUpdate({ title: e.target.value })} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide">Chart Caption</label>
                  <EyeIcon active={settings.showCaption} onClick={() => onUpdate({ showCaption: !settings.showCaption })} />
                </div>
                <textarea rows={2} className="w-full p-2.5 bg-zinc-800 border border-[#2e2e33] rounded font-mono text-[11px] text-[#e4e4e7] focus:outline-none focus:ring-1 focus:ring-[#BFB9DA] resize-none" value={settings.caption} onChange={(e) => onUpdate({ caption: e.target.value })} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide">Source</label>
                  <EyeIcon active={settings.showSource} onClick={() => onUpdate({ showSource: !settings.showSource })} />
                </div>
                <textarea rows={2} className="w-full p-2.5 bg-zinc-800 border border-[#2e2e33] rounded font-mono text-[11px] text-[#e4e4e7] focus:outline-none focus:ring-1 focus:ring-[#BFB9DA] resize-none" value={settings.source} onChange={(e) => onUpdate({ source: e.target.value })} />
              </div>

              {settings.chartType === 'donut' && (
                <div className="space-y-4 pt-3 border-t border-[#2e2e33]">
                  <div>
                    <label className="block font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide mb-1.5">Inner Radius: <span className="text-[#e4e4e7]">{settings.innerRadius}</span></label>
                    <input type="range" min="50" max="600" step="10" className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#BFB9DA' }} value={settings.innerRadius || 300} onChange={(e) => onUpdate({ innerRadius: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide mb-1.5">Outer Radius: <span className="text-[#e4e4e7]">{settings.outerRadius}</span></label>
                    <input type="range" min="100" max="700" step="10" className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#BFB9DA' }} value={settings.outerRadius || 500} onChange={(e) => onUpdate({ outerRadius: parseInt(e.target.value) })} />
                  </div>
                </div>
              )}

              <div className="space-y-2 relative" ref={paletteRef}>
                <label className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide block">Color Palette</label>
                <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="w-full h-10 rounded border border-[#2e2e33] bg-[#202023] flex overflow-hidden items-center group relative hover:border-[#a1a1aa] active:scale-[0.99] transition-all">
                  <div className="w-[70%] h-full" style={{ backgroundColor: currentPalette.bg }} />
                  <div className="w-[30%] h-full border-l border-[#2e2e33]" style={{ backgroundColor: currentPalette.fg }} />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#202023]/80 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`material-symbols-outlined !text-[16px] text-[#a1a1aa] transition-transform duration-200 ${isPaletteOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </div>
                </button>
                {isPaletteOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-[#18181b] border border-[#2e2e33] rounded-xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                    <div className="space-y-2">
                      <span className="font-mono text-[9px] text-[#a1a1aa] uppercase tracking-wider block mb-1">Light Palette</span>
                      <div className="grid grid-cols-2 gap-2">
                        {lightPalettes.map((p, idx) => (
                          <button key={`light-${idx}`} onClick={() => { onUpdate({ backgroundColor: p.bg, contentColor: p.fg }); setIsPaletteOpen(false); }} className={`h-12 rounded border transition-all flex overflow-hidden ${settings.backgroundColor === p.bg && settings.contentColor === p.fg ? 'ring-2 ring-[#BFB9DA] border-transparent scale-[0.98]' : 'border-[#2e2e33] hover:border-[#a1a1aa]'}`}>
                            <div className="w-[70%] h-full" style={{ backgroundColor: p.bg }} />
                            <div className="w-[30%] h-full border-l border-[#2e2e33]" style={{ backgroundColor: p.fg }} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="font-mono text-[9px] text-[#a1a1aa] uppercase tracking-wider block mb-1">Dark Palette</span>
                      <div className="grid grid-cols-2 gap-2">
                        {darkPalettes.map((p, idx) => (
                          <button key={`dark-${idx}`} onClick={() => { onUpdate({ backgroundColor: p.bg, contentColor: p.fg }); setIsPaletteOpen(false); }} className={`h-12 rounded border transition-all flex overflow-hidden ${settings.backgroundColor === p.bg && settings.contentColor === p.fg ? 'ring-2 ring-[#BFB9DA] border-transparent scale-[0.98]' : 'border-[#2e2e33] hover:border-[#a1a1aa]'}`}>
                            <div className="w-[70%] h-full" style={{ backgroundColor: p.bg }} />
                            <div className="w-[30%] h-full border-l border-[#2e2e33]" style={{ backgroundColor: p.fg }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Axes & Labels */}
        {settings.chartType === 'bar' && (
          <div className="bg-[#202023] border border-[#2e2e33] rounded-md overflow-hidden">
            <CollapsibleHeader label="Axes & Labels" isCollapsed={collapsed.axes} onToggle={() => toggleSection('axes')} />
            {!collapsed.axes && (
              <div className="p-3 space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide mb-1.5">Y Axis Density: <span className="text-[#e4e4e7]">{densityLabels[settings.yAxisDensity]}</span></label>
                  <input type="range" min="0" max="2" step="1" className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#BFB9DA' }} value={settings.yAxisDensity} onChange={(e) => onUpdate({ yAxisDensity: parseInt(e.target.value) })} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide">Y Numerical Labels</span>
                    <EyeIcon active={settings.showYAxisLabels} onClick={() => onUpdate({ showYAxisLabels: !settings.showYAxisLabels })} />
                  </div>
                  <div className={`flex bg-black/20 border border-[#2e2e33] rounded-md p-1 gap-1 transition-opacity ${!settings.showYAxisLabels ? 'opacity-50' : ''}`}>
                    <button disabled={!settings.showYAxisLabels} onClick={() => onUpdate({ yAxisLabelMode: 'startEnd' })} className={`flex-1 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors rounded ${!settings.showYAxisLabels ? 'cursor-not-allowed' : ''} ${settings.yAxisLabelMode === 'startEnd' ? 'bg-[#BFB9DA]/20 text-[#BFB9DA]' : 'text-[#a1a1aa] hover:text-[#e4e4e7]'}`}>Start/End</button>
                    <button disabled={!settings.showYAxisLabels} onClick={() => onUpdate({ yAxisLabelMode: 'continuous' })} className={`flex-1 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors rounded ${!settings.showYAxisLabels ? 'cursor-not-allowed' : ''} ${settings.yAxisLabelMode === 'continuous' ? 'bg-[#BFB9DA]/20 text-[#BFB9DA]' : 'text-[#a1a1aa] hover:text-[#e4e4e7]'}`}>Continuous</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide">Y Title</label>
                    <EyeIcon active={settings.showYAxisTitle} onClick={() => onUpdate({ showYAxisTitle: !settings.showYAxisTitle })} />
                  </div>
                  <input type="text" className="w-full p-2.5 bg-zinc-800 border border-[#2e2e33] rounded font-mono text-[11px] text-[#e4e4e7] focus:outline-none focus:ring-1 focus:ring-[#BFB9DA] uppercase" value={settings.yAxisTitle} onChange={(e) => onUpdate({ yAxisTitle: e.target.value })} placeholder="Y AXIS LABEL" />
                </div>
                <div className="flex items-center justify-between border-t border-[#2e2e33] pt-3">
                  <span className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide">Angled X-Labels</span>
                  <EyeIcon active={settings.showAngledLabels} onClick={() => onUpdate({ showAngledLabels: !settings.showAngledLabels })} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide">X Title</label>
                    <EyeIcon active={settings.showXAxisLabel} onClick={() => onUpdate({ showXAxisLabel: !settings.showXAxisLabel })} />
                  </div>
                  <input type="text" className="w-full p-2.5 bg-zinc-800 border border-[#2e2e33] rounded font-mono text-[11px] text-[#e4e4e7] focus:outline-none focus:ring-1 focus:ring-[#BFB9DA] uppercase" value={settings.xAxisLabel} onChange={(e) => onUpdate({ xAxisLabel: e.target.value })} placeholder="X AXIS LABEL" />
                </div>
                <div className="flex items-center justify-between border-t border-[#2e2e33] pt-3">
                  <span className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide">Bar Values</span>
                  <EyeIcon active={settings.showBarValues} onClick={() => onUpdate({ showBarValues: !settings.showBarValues })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wide">Add $ Unit</span>
                  <button
                    role="switch"
                    aria-checked={!!settings.usesDollarUnit}
                    onClick={() => onUpdate({ usesDollarUnit: !settings.usesDollarUnit })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${settings.usesDollarUnit ? 'bg-[#BFB9DA]' : 'bg-zinc-700'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${settings.usesDollarUnit ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chart Data */}
        <div className="bg-[#202023] border border-[#2e2e33] rounded-md overflow-hidden">
          <CollapsibleHeader label="Chart Data" isCollapsed={collapsed.data} onToggle={() => toggleSection('data')} />
          {!collapsed.data && (
            <div className="p-3 animate-in fade-in duration-200">
              {settings.chartType === 'stacked' && settings.data.reduce((sum, item) => sum + item.value, 0) > 100 && (
                <div className="mb-3 p-3 bg-red-900/20 border border-red-900/50 rounded flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
                  <span className="material-symbols-outlined text-red-400 !text-[16px] shrink-0">error</span>
                  <p className="font-mono text-[10px] text-red-400 uppercase tracking-tight leading-tight">
                    The stacked bar chart should only be used for values up to 100%.
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center mb-3 min-h-[24px]">
                <div className="flex-1">
                  {settings.chartType === 'stacked' && settings.data.reduce((sum, item) => sum + item.value, 0) < 100 && (
                    <div className="flex items-center gap-1.5 text-amber-400 animate-in fade-in duration-200">
                      <span className="material-symbols-outlined !text-[14px]">warning</span>
                      <span className="font-mono text-[9px] uppercase tracking-tight">Adds up to less than 100%.</span>
                    </div>
                  )}
                </div>
                <button disabled={settings.chartType === 'donut'} onClick={() => fileInputRef.current?.click()} className={`font-mono text-[9px] bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition-colors uppercase flex items-center gap-1 text-[#e4e4e7] ${settings.chartType === 'donut' ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  <span className="material-symbols-outlined !text-[12px]">upload</span>CSV
                </button>
                <input type="file" ref={fileInputRef} onChange={handleCsvUpload} className="hidden" accept=".csv" />
              </div>
              <div className={`space-y-4 pr-1 ${settings.chartType === 'stacked' ? '' : 'max-h-80 overflow-y-auto'}`}>
                {settings.data.map((row, idx) => {
                  const totalValue = settings.data.reduce((sum, item) => sum + item.value, 0);
                  const isOver100 = settings.chartType === 'stacked' && totalValue > 100;
                  const isUnder100 = settings.chartType === 'stacked' && totalValue < 100;

                  return (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex gap-2 items-center group">
                        {settings.chartType !== 'donut' && (
                          <button onClick={() => toggleHighlight(idx)} className={`p-2 transition-colors rounded ${settings.highlightedIndex === idx ? 'text-[#BFB9DA]' : 'text-zinc-600 hover:text-zinc-400'}`}>
                            <span className="material-symbols-outlined !text-[18px]" style={settings.highlightedIndex === idx ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
                          </button>
                        )}
                        <textarea rows={1} className={`flex-1 p-2 bg-zinc-800 border rounded font-mono text-[11px] text-[#e4e4e7] focus:outline-none focus:ring-1 transition-all resize-none ${isOver100 ? 'border-red-700 focus:ring-red-500' : 'border-[#2e2e33] focus:ring-[#BFB9DA]'}`} value={row.label} onChange={(e) => handleRowChange(idx, 'label', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { /* Allow newline */ } }} />
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="0"
                            max={(settings.chartType === 'donut' || settings.chartType === 'stacked') ? 100 : undefined}
                            className={`w-16 p-2 bg-zinc-800 border rounded font-mono text-[11px] text-[#e4e4e7] focus:outline-none focus:ring-1 transition-all text-right ${isOver100 ? 'border-red-700 focus:ring-red-500' : isUnder100 ? 'border-amber-600 focus:ring-amber-500' : 'border-[#2e2e33] focus:ring-[#BFB9DA]'} ${(settings.chartType === 'donut' || settings.chartType === 'stacked') ? 'pr-5' : ''}`}
                            value={row.value}
                            onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                          />
                          {(settings.chartType === 'donut' || settings.chartType === 'stacked') && (
                            <span className="absolute right-2 font-mono text-[10px] text-[#a1a1aa] pointer-events-none">%</span>
                          )}
                        </div>
                        <button disabled={settings.chartType === 'donut'} onClick={() => handleRemoveRow(idx)} className={`p-2 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ${settings.chartType === 'donut' ? 'invisible' : ''}`}>
                          <span className="material-symbols-outlined !text-[18px]">close</span>
                        </button>
                      </div>
                      {(settings.chartType === 'donut' || settings.highlightedIndex === idx) && (
                        <div className={`flex items-center gap-2 mb-1 animate-in fade-in slide-in-from-top-1 duration-200 ${settings.chartType === 'donut' ? 'ml-0' : 'ml-10'}`}>
                          <input type="checkbox" id={`highlight-check-${idx}`} checked={settings.useHighlightColor} onChange={toggleHighlightColor} className="w-3.5 h-3.5 rounded cursor-pointer" style={{ accentColor: '#BFB9DA' }} />
                          <label htmlFor={`highlight-check-${idx}`} className="font-mono text-[9px] text-[#a1a1aa] uppercase tracking-tight cursor-pointer hover:text-[#e4e4e7] transition-colors">
                            {settings.chartType === 'donut' ? 'Apply highlight color' : 'Apply highlight color to starred'}
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {(settings.chartType === 'bar' || settings.chartType === 'stacked') && (
                <button onClick={handleAddRow} className="w-full mt-4 p-3 border border-dashed border-[#2e2e33] rounded font-mono text-[10px] text-[#a1a1aa] hover:border-[#BFB9DA] hover:text-[#BFB9DA] transition-all uppercase tracking-widest">+ Add Data Point</button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Bottom action bar */}
      <div className="p-4 border-t border-[#2e2e33] bg-[#1c1c1f] space-y-2">
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => onDownload('png')} className="col-span-1 bg-zinc-800 border border-zinc-700 text-[#e4e4e7] p-3 rounded font-mono tracking-widest text-[9px] hover:bg-zinc-700 transition-colors uppercase flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">download</span>
            PNG
          </button>
          <button onClick={() => onDownload('svg')} className="col-span-1 bg-zinc-800 border border-zinc-700 text-[#e4e4e7] p-3 rounded font-mono tracking-widest text-[9px] hover:bg-zinc-700 transition-colors uppercase flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">download</span>
            SVG
          </button>
          <button onClick={() => onDownload('zip')} className="col-span-2 bg-[#BFB9DA]/10 border border-[#BFB9DA]/30 text-[#BFB9DA] p-3 rounded font-mono tracking-widest text-[9px] hover:bg-[#BFB9DA]/20 transition-colors uppercase flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">folder_zip</span>
            Download All (ZIP)
          </button>
        </div>

        <div className="pt-1 border-t border-[#2e2e33]">
          <button
            onClick={() => sourceInputRef.current?.click()}
            className="w-full bg-zinc-800 border border-dashed border-zinc-700 text-[#e4e4e7] p-3 rounded font-mono tracking-widest text-[9px] hover:border-[#a1a1aa] transition-all uppercase flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">upload_file</span>
            Upload Source File (JSON)
          </button>
          <input type="file" ref={sourceInputRef} onChange={handleSourceUpload} className="hidden" accept=".json" />
        </div>
      </div>

    </div>
  );
};
