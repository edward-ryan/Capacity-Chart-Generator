import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChartPreview } from './components/ChartPreview';
import { ChartSettings, CanvasType, ChartType } from './types';

// Shared EyeIcon component using Material Symbols for consistent, recognizable UI
export const EyeIcon = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className={`w-8 h-8 flex items-center justify-center transition-all rounded hover:bg-gray-100 ${active ? 'text-black' : 'text-gray-300'}`}
    title={active ? "Hide" : "Show"}
  >
    <span className="material-symbols-outlined !text-[20px] select-none">
      {active ? 'visibility' : 'visibility_off'}
    </span>
  </button>
);

const BAR_DEFAULTS: Partial<ChartSettings> = {
  chartType: 'bar',
  showTitle: true,
  showCaption: true,
  showSource: true,
  data: [
    { label: 'Value 1', value: 45 },
    { label: 'Value 2', value: 72 },
    { label: 'Value 3', value: 60 },
    { label: 'Value 4', value: 95 },
  ],
  highlightedIndex: 3,
  useHighlightColor: false,
};

const DONUT_DEFAULTS: Partial<ChartSettings> = {
  chartType: 'donut',
  showTitle: false,
  showCaption: false,
  showSource: false,
  data: [
    { label: 'Segment A', value: 75 },
  ],
  highlightedIndex: 0,
  useHighlightColor: false,
  innerRadius: 300,
  outerRadius: 500,
};

const STACKED_DEFAULTS: Partial<ChartSettings> = {
  chartType: 'stacked',
  showTitle: true,
  showCaption: false,
  showSource: true,
  data: [
    { label: 'Curious', value: 35 },
    { label: 'Optimistic', value: 20 },
    { label: 'Skeptical', value: 7 },
    { label: 'Concerned', value: 14 },
    { label: 'Excited', value: 12 },
    { label: 'Overwhelmed', value: 8 },
    { label: 'Uninterested', value: 4 },
  ],
  highlightedIndex: 3,
  useHighlightColor: true,
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<ChartSettings>({
    chartType: 'bar',
    title: 'NEW BRAND REPORT',
    showTitle: true,
    caption: 'Strategic Overview and Market Performance',
    showCaption: true,
    source: 'Source: Capacity Brand Analytics 2024',
    showSource: true,
    data: [
      { label: 'Value 1', value: 45 },
      { label: 'Value 2', value: 72 },
      { label: 'Value 3', value: 60 },
      { label: 'Value 4', value: 95 },
    ],
    highlightedIndex: 3,
    useHighlightColor: false,
    showVisualizer: true,
    yAxisDensity: 1,
    yAxisLabelMode: 'startEnd',
    yAxisTitle: 'REVENUE (M)',
    showYAxisTitle: false,
    showYAxisLabels: true,
    xAxisLabel: 'FISCAL QUARTERS',
    showXAxisLabel: false,
    showAngledLabels: true,
    showBarValues: true,
    canvasType: 'square',
    customWidth: 1920,
    customHeight: 1080,
    backgroundColor: '#FFFFFF',
    contentColor: '#000000',
    innerRadius: 300,
    outerRadius: 500,
  });

  const handleUpdateSettings = (newSettings: Partial<ChartSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSwitchMode = (mode: ChartType) => {
    if (mode === settings.chartType) return;
    let defaults = BAR_DEFAULTS;
    if (mode === 'donut') defaults = DONUT_DEFAULTS;
    if (mode === 'stacked') defaults = STACKED_DEFAULTS;
    setSettings(prev => ({ ...prev, ...defaults }));
  };

  const handleDownload = (format: 'png' | 'svg' | 'zip') => {
    const event = new CustomEvent('download-chart', { detail: { format } });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f4f4f4] text-[#1a1a1a]">
      <Sidebar 
        settings={settings} 
        onUpdate={handleUpdateSettings} 
        onDownload={handleDownload}
      />

      <main 
        className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${settings.showVisualizer ? 'bg-[#f4f4f4]' : 'bg-white'}`}
      >
        {/* Top Control Bar */}
        <div className="w-full h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center px-8 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Chart Type</span>
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 items-center">
              <button
                onClick={() => handleSwitchMode('bar')}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-[0.2em] transition-all shadow-sm select-none ${
                  settings.chartType === 'bar' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                }`}
              >
                Varied Width Bar
              </button>
              <div className="w-[1px] h-3 bg-gray-300 mx-1" />
              <button
                onClick={() => handleSwitchMode('donut')}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-[0.2em] transition-all shadow-sm select-none ${
                  settings.chartType === 'donut' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                }`}
              >
                Donut
              </button>
              <div className="w-[1px] h-3 bg-gray-300 mx-1" />
              <button
                onClick={() => handleSwitchMode('stacked')}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-[0.2em] transition-all shadow-sm select-none ${
                  settings.chartType === 'stacked' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                }`}
              >
                Horizontal Bar
              </button>
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="flex-1 w-full h-full flex items-center justify-center p-8 overflow-auto">
          <div className={`transition-all duration-300 ${settings.showVisualizer ? 'shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100' : ''}`}>
            <ChartPreview settings={settings} />
          </div>
        </div>

        {/* Horizontal Control Bar at the bottom */}
        <div className="w-full h-16 border-t border-gray-100 bg-white/80 backdrop-blur-md flex items-center px-8 shrink-0 z-20">
          <div className="flex items-center gap-12">
            
            {/* Canvas Preview Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Canvas Preview</span>
              <EyeIcon 
                active={settings.showVisualizer} 
                onClick={() => handleUpdateSettings({ showVisualizer: !settings.showVisualizer })} 
              />
            </div>

            {/* Vertical Divider */}
            <div className="h-4 w-[1px] bg-gray-200" />

            {/* Aspect Ratio Section */}
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Aspect Ratio</span>
              
              <div className="flex items-center gap-3">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                  {(['square', 'vertical', 'wide', 'custom'] as CanvasType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleUpdateSettings({ canvasType: type })}
                      className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-tighter transition-all ${
                        settings.canvasType === type 
                          ? 'bg-black text-white' 
                          : 'text-gray-400 hover:text-black'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Custom Dimensions (Inline) */}
                {settings.canvasType === 'custom' && (
                  <div className="flex gap-2 items-center px-3 py-1 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">W</span>
                      <input 
                        type="number"
                        value={settings.customWidth}
                        onChange={(e) => handleUpdateSettings({ customWidth: Math.max(100, parseInt(e.target.value) || 0) })}
                        className="w-14 bg-transparent text-[10px] font-mono text-center focus:outline-none"
                      />
                    </div>
                    <span className="text-gray-300">×</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">H</span>
                      <input 
                        type="number"
                        value={settings.customHeight}
                        onChange={(e) => handleUpdateSettings({ customHeight: Math.max(100, parseInt(e.target.value) || 0) })}
                        className="w-14 bg-transparent text-[10px] font-mono text-center focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;