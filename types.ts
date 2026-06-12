
export interface ChartDataRow {
  label: string;
  value: number;
}

export type CanvasType = 'square' | 'vertical' | 'wide' | 'custom';
export type ChartType = 'bar' | 'donut' | 'stacked';

export interface ChartSettings {
  chartType: ChartType;
  title: string;
  showTitle: boolean;
  caption: string;
  showCaption: boolean;
  source: string;
  showSource: boolean;
  data: ChartDataRow[];
  highlightedIndex?: number;
  useHighlightColor: boolean;
  showVisualizer: boolean;
  yAxisDensity: number; // 0: Less, 1: Medium, 2: More
  yAxisLabelMode: 'startEnd' | 'continuous';
  yAxisTitle: string;
  showYAxisTitle: boolean;
  showYAxisLabels: boolean;
  xAxisLabel: string;
  showXAxisLabel: boolean;
  showAngledLabels: boolean;
  showBarValues: boolean;
  canvasType: CanvasType;
  customWidth?: number;
  customHeight?: number;
  backgroundColor: string;
  contentColor: string;
  // Bar specific
  usesDollarUnit?: boolean;
  // Donut specific
  innerRadius?: number;
  outerRadius?: number;
}
