import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChartPreview } from './components/ChartPreview';
import { ChartSettings, CanvasType, ChartType } from './types';

export const EyeIcon = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-7 h-7 flex items-center justify-center transition-all rounded hover:bg-zinc-700 ${active ? 'text-[#e4e4e7]' : 'text-zinc-600'}`}
    title={active ? "Hide" : "Show"}
  >
    <span className="material-symbols-outlined !text-[18px] select-none">
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
  const [isDarkCanvas, setIsDarkCanvas] = useState(true);
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
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#0f0f12] text-[#e4e4e7]">
      <Sidebar
        settings={settings}
        onUpdate={handleUpdateSettings}
        onDownload={handleDownload}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-[#0f0f12]">
        {/* Top Control Bar */}
        <div className="w-full h-14 border-b border-[#2e2e33] bg-[#18181b] flex items-center px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-widest whitespace-nowrap">Chart Type</span>
            <div className="flex bg-black/20 p-1 rounded-md border border-[#2e2e33] items-center gap-0.5">
              <button
                onClick={() => handleSwitchMode('bar')}
                className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase tracking-[0.15em] transition-colors select-none ${
                  settings.chartType === 'bar' ? 'bg-[#BFB9DA]/20 text-[#BFB9DA]' : 'text-[#a1a1aa] hover:text-[#e4e4e7]'
                }`}
              >
                Varied Width Bar
              </button>
              <div className="w-[1px] h-3 bg-[#2e2e33] mx-0.5" />
              <button
                onClick={() => handleSwitchMode('donut')}
                className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase tracking-[0.15em] transition-colors select-none ${
                  settings.chartType === 'donut' ? 'bg-[#BFB9DA]/20 text-[#BFB9DA]' : 'text-[#a1a1aa] hover:text-[#e4e4e7]'
                }`}
              >
                Donut
              </button>
              <div className="w-[1px] h-3 bg-[#2e2e33] mx-0.5" />
              <button
                onClick={() => handleSwitchMode('stacked')}
                className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase tracking-[0.15em] transition-colors select-none ${
                  settings.chartType === 'stacked' ? 'bg-[#BFB9DA]/20 text-[#BFB9DA]' : 'text-[#a1a1aa] hover:text-[#e4e4e7]'
                }`}
              >
                Horizontal Bar
              </button>
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className={`flex-1 w-full h-full flex items-center justify-center p-8 overflow-auto transition-colors duration-300 ${isDarkCanvas ? 'bg-[#27272a]' : 'bg-gray-100'}`}>
          <div className={`transition-all duration-300 ${settings.showVisualizer ? `shadow-2xl ring-1 ${isDarkCanvas ? 'shadow-black ring-white/10' : 'shadow-zinc-400 ring-black/10'}` : ''}`}>
            <ChartPreview settings={settings} />
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full h-14 border-t border-[#2e2e33] bg-[#18181b] flex items-center px-6 shrink-0 z-20">
          <div className="flex items-center gap-8">

            {/* Canvas Preview Toggle */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-widest whitespace-nowrap">Canvas Preview</span>
              <EyeIcon
                active={settings.showVisualizer}
                onClick={() => handleUpdateSettings({ showVisualizer: !settings.showVisualizer })}
              />
            </div>

            <div className="h-4 w-[1px] bg-[#2e2e33]" />

            {/* Dark / Light Canvas Toggle */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-widest whitespace-nowrap">Canvas Mode</span>
              <button
                onClick={() => setIsDarkCanvas(v => !v)}
                className="w-7 h-7 flex items-center justify-center transition-all rounded hover:bg-zinc-700 text-[#e4e4e7]"
                title={isDarkCanvas ? 'Switch to Light Canvas' : 'Switch to Dark Canvas'}
              >
                <span className="material-symbols-outlined !text-[18px] select-none">
                  {isDarkCanvas ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>

            <div className="h-4 w-[1px] bg-[#2e2e33]" />

            {/* Aspect Ratio */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-[#a1a1aa] uppercase tracking-widest whitespace-nowrap">Aspect Ratio</span>

              <div className="flex items-center gap-3">
                <div className="flex gap-0.5 bg-black/20 p-1 rounded-md border border-[#2e2e33]">
                  {(['square', 'vertical', 'wide', 'custom'] as CanvasType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleUpdateSettings({ canvasType: type })}
                      className={`px-3 py-1 rounded font-mono text-[9px] uppercase tracking-tighter transition-colors ${
                        settings.canvasType === type
                          ? 'bg-[#BFB9DA]/20 text-[#BFB9DA]'
                          : 'text-[#a1a1aa] hover:text-[#e4e4e7]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {settings.canvasType === 'custom' && (
                  <div className="flex gap-2 items-center px-3 py-1.5 bg-zinc-900 rounded-md border border-[#2e2e33] animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[8px] text-[#a1a1aa] uppercase tracking-widest">W</span>
                      <input
                        type="number"
                        value={settings.customWidth}
                        onChange={(e) => handleUpdateSettings({ customWidth: Math.max(100, parseInt(e.target.value) || 0) })}
                        className="w-14 bg-transparent font-mono text-[10px] text-center text-[#e4e4e7] focus:outline-none"
                      />
                    </div>
                    <span className="text-[#2e2e33]">×</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[8px] text-[#a1a1aa] uppercase tracking-widest">H</span>
                      <input
                        type="number"
                        value={settings.customHeight}
                        onChange={(e) => handleUpdateSettings({ customHeight: Math.max(100, parseInt(e.target.value) || 0) })}
                        className="w-14 bg-transparent font-mono text-[10px] text-center text-[#e4e4e7] focus:outline-none"
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
