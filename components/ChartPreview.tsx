import React, { useEffect, useRef } from 'react';
import { ChartSettings, CanvasType } from '../types';

declare const p5: any;
declare const JSZip: any;

interface ChartPreviewProps {
  settings: ChartSettings;
}

const getCanvasDimensions = (settings: ChartSettings) => {
  switch (settings.canvasType) {
    case 'vertical': return { width: 1500, height: 2666 };
    case 'wide': return { width: 2666, height: 1500 };
    case 'custom': return { 
      width: settings.customWidth || 1500, 
      height: settings.customHeight || 1500 
    };
    case 'square': 
    default: return { width: 1500, height: 1500 };
  }
};

export const ChartPreview: React.FC<ChartPreviewProps> = ({ settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);
  const settingsRef = useRef<ChartSettings>(settings);
  const svgCacheRef = useRef<string>('');

  const { width: canvasW, height: canvasH } = getCanvasDimensions(settings);
  const MAX_PREVIEW_HEIGHT = 700;
  const MAX_PREVIEW_WIDTH = 800;
  const scale = Math.min(MAX_PREVIEW_WIDTH / canvasW, MAX_PREVIEW_HEIGHT / canvasH);
  const displayWidth = canvasW * scale;
  const displayHeight = canvasH * scale;

  useEffect(() => {
    settingsRef.current = settings;
    if (p5InstanceRef.current) {
      const { width, height } = getCanvasDimensions(settings);
      if (p5InstanceRef.current.width !== width || p5InstanceRef.current.height !== height) {
        p5InstanceRef.current.resizeCanvas(width, height);
      }
      p5InstanceRef.current.redraw();
    }
  }, [settings]);

  const drawChart = (p: any, cur: ChartSettings) => {
    if (!p || !p._renderer) return;
    if (cur.chartType === 'donut') {
      drawDonutChart(p, cur);
    } else if (cur.chartType === 'stacked') {
      drawStackedBarChart(p, cur);
    } else {
      drawBarChart(p, cur);
    }
  };

  const drawDonutChart = (p: any, cur: ChartSettings) => {
    try {
      const curW = p.width;
      const curH = p.height;
      p.background(cur.backgroundColor || 255);
      const fg = cur.contentColor || '#000000';
      const isDark = (color: string) => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luma < 0.6;
      };
      const isDarkPalette = isDark(cur.backgroundColor);
      const highlightColor = isDarkPalette ? '#EBFA64' : '#1360F9';

      drawMetaElements(p, cur, curW, curH, fg);

      const centerX = curW / 2;
      const centerY = curH / 2;
      const innerR = cur.innerRadius || 300;
      const outerR = cur.outerRadius || 500;

      const item = cur.data[0] || { label: 'Segment A', value: 0 };
      const value = item.value;
      const label = item.label;

      // Draw background ring (dashed/lines)
      p.stroke(fg);
      p.strokeWeight(2);
      p.noFill();
      const stepAngle = p.radians(3.6); // 100 lines for full circle
      for (let a = 0; a < p.TWO_PI; a += stepAngle) {
        const x1 = centerX + p.cos(a) * innerR;
        const y1 = centerY + p.sin(a) * innerR;
        const x2 = centerX + p.cos(a) * outerR;
        const y2 = centerY + p.sin(a) * outerR;
        p.line(x1, y1, x2, y2);
      }

      // Draw foreground segment
      const angleSize = (value / 100) * p.TWO_PI;
      const startAngle = -p.HALF_PI;
      const endAngle = startAngle + angleSize;

      p.noStroke();
      p.fill(cur.useHighlightColor ? highlightColor : fg);
      p.beginShape();
      for (let a = startAngle; a < endAngle; a += 0.01) {
        p.vertex(centerX + p.cos(a) * outerR, centerY + p.sin(a) * outerR);
      }
      p.vertex(centerX + p.cos(endAngle) * outerR, centerY + p.sin(endAngle) * outerR);
      for (let a = endAngle; a > startAngle; a -= 0.01) {
        p.vertex(centerX + p.cos(a) * innerR, centerY + p.sin(a) * innerR);
      }
      p.vertex(centerX + p.cos(startAngle) * innerR, centerY + p.sin(startAngle) * innerR);
      p.endShape(p.CLOSE);

      // Draw Inner Circle Stroke
      p.noFill();
      p.stroke(fg);
      p.strokeWeight(2);
      p.ellipse(centerX, centerY, innerR * 2, innerR * 2);

      // Draw Center Text
      p.noStroke();
      p.fill(fg);
      p.textAlign(p.CENTER, p.CENTER);
      
      // Value text
      p.textFont('Basel Classic');
      p.textStyle(p.NORMAL);
      p.textSize(180);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(value.toString() + "%", centerX, centerY - 20);

      // Label text
      p.textFont('Basel Grotesk');
      p.textSize(40);
      p.textStyle(p.NORMAL);
      p.textAlign(p.CENTER, p.TOP);
      const labelY = centerY + 80;
      // Use a fixed width of 350px as requested. 
      // centerX - 175 is the left edge of the 350px box.
      p.text(label, centerX - 175, labelY, 350, 200);

    } catch (e) {
      console.error("Donut Draw Error:", e);
    }
  };

  const drawStackedBarChart = (p: any, cur: ChartSettings) => {
    if (!p || !p._renderer) return;
    try {
      const curW = p.width;
      const curH = p.height;
      p.background(cur.backgroundColor || 255);
      const fg = cur.contentColor || '#000000';
      const brandMargin = 100;
      const isDark = (color: string) => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luma < 0.6;
      };
      const isDarkPalette = isDark(cur.backgroundColor);
      const highlightColor = isDarkPalette ? '#EBFA64' : '#1360F9';

      const topCursorY = drawMetaElements(p, cur, curW, curH, fg);

      const chartAreaWidthBase = curW - 2 * brandMargin;
      const barHeight = 300;
      const labelHeight = 150; 
      
      // Vertically center the bar
      const barY = (curH / 2) - (barHeight / 2);
      
      // Sort data from greatest to smallest
      const sortedData = [...cur.data]
        .map((item, index) => ({ ...item, originalIndex: index }))
        .sort((a, b) => b.value - a.value);

      const totalValue = sortedData.reduce((sum, item) => sum + item.value, 0);
      const gapWidth = chartAreaWidthBase * 0.02;
      const totalGaps = (sortedData.length - 1) * gapWidth;
      
      // Calculate potential label overflow to adjust width
      p.textSize(42); p.textFont('Basel Classic'); p.textStyle(p.BOLD);
      const percWidths = sortedData.map(item => p.textWidth(`${item.value}%`));
      p.textSize(32); p.textFont('Basel Grotesk'); p.textStyle(p.NORMAL);
      const labelTextWidths = sortedData.map(item => p.textWidth(item.label));
      const itemMaxTextWidths = sortedData.map((_, i) => Math.max(percWidths[i], labelTextWidths[i]) + 25); // 13 offset + buffer
      
      // Estimate available width and check for right-side cutoff
      // The most critical is the last item
      let availableWidth = chartAreaWidthBase - totalGaps;
      const lastItemIdx = sortedData.length - 1;
      if (lastItemIdx >= 0) {
        const lastItemValue = sortedData[lastItemIdx].value;
        const lastItemStartRelative = ((totalValue - lastItemValue) / totalValue) * availableWidth + (lastItemIdx * gapWidth);
        const lastItemRightEdge = brandMargin + lastItemStartRelative + itemMaxTextWidths[lastItemIdx];
        const rightLimit = curW - brandMargin;
        if (lastItemRightEdge > rightLimit) {
          const overflow = lastItemRightEdge - rightLimit;
          availableWidth -= overflow;
        }
      }
      
      let currentX = brandMargin;
      
      sortedData.forEach((item, i) => {
        const isHigh = item.originalIndex === cur.highlightedIndex;
        const segmentWidth = (item.value / totalValue) * availableWidth;
        const useHighColor = isHigh && cur.useHighlightColor;
        const curColor = useHighColor ? highlightColor : fg;
        
        const isStackedVertical = cur.chartType === 'stacked' && cur.canvasType === 'vertical';
        const percentageSize = isStackedVertical ? 42 * 1.2 : 42;
        const categorySize = isStackedVertical ? 32 * 1.2 : 32;
        
        // Draw block
        p.noStroke();
        p.fill(curColor);
        p.rect(currentX, barY, segmentWidth, barHeight);
        
        const isLast = i === sortedData.length - 1;
        
        if (isLast) {
          // Final category label horizontal on the right side
          const textX = currentX + segmentWidth + 20;
          const lineSpacing = 8;
          
          // Position relative to the bottom of the bar
          const baselineY = barY + barHeight;
          
          p.noStroke();
          p.fill(curColor);
          p.textAlign(p.LEFT, p.BOTTOM);
          
          // Category Label (sits above the line)
          p.textFont('Basel Grotesk');
          p.textStyle(p.NORMAL);
          p.textSize(categorySize);
          p.text(item.label, textX, baselineY - 5);
          
          // Percentage (above category)
          p.textFont('Basel Classic');
          p.textStyle(p.BOLD);
          p.textSize(percentageSize);
          p.text(`${item.value}%`, textX, baselineY - categorySize - lineSpacing - 5);
          
          // Horizontal line at the bottom (continuation of bar bottom)
          p.stroke(curColor);
          p.strokeWeight(2);
          
          // Measure widths precisely for the line
          p.textFont('Basel Classic');
          p.textSize(percentageSize);
          const pW = p.textWidth(`${item.value}%`);
          p.textFont('Basel Grotesk');
          p.textSize(categorySize);
          const cW = p.textWidth(item.label);
          const textWidth = Math.max(pW, cW);
          
          p.line(currentX + segmentWidth, baselineY, textX + textWidth, baselineY);
          
        } else {
          // Alternate labels: even below, odd above
          const isAbove = i % 2 !== 0;
          const textX = currentX + 13; // 8 + 5 = 13 padding
          
          p.stroke(curColor);
          p.strokeWeight(2);
          
          if (isAbove) {
            // Labels above: Percentage on top, Category below it.
            // "Top of the label text" is the top of the Percentage label.
            const lineSpacing = 10;
            
            // We want the line to start at the TOP of the percentage text.
            const percentageTopY = barY - 150; 
            const percentageBaselineY = percentageTopY + percentageSize;
            const categoryBaselineY = percentageBaselineY + lineSpacing + categorySize;
            
            const lineYEnd = barY;
            const lineYStart = percentageTopY; 
            
            p.line(currentX, lineYStart, currentX, lineYEnd);
            
            p.noStroke();
            p.fill(curColor);
            p.textAlign(p.LEFT, p.BASELINE);
            
            p.textFont('Basel Classic');
            p.textStyle(p.BOLD);
            p.textSize(percentageSize);
            p.text(`${item.value}%`, textX, percentageBaselineY);
            
            p.textFont('Basel Grotesk');
            p.textStyle(p.NORMAL);
            p.textSize(categorySize);
            p.text(item.label, textX, categoryBaselineY);
          } else {
            // Labels below: Percentage on top, Category below it.
            // "Bottom of the label text" is the baseline of the Category label.
            const lineSpacing = 10;
            
            const categoryBaselineY = barY + barHeight + 120;
            const percentageBaselineY = categoryBaselineY - categorySize - lineSpacing;
            
            const lineYStart = barY + barHeight;
            const lineYEnd = categoryBaselineY;
            
            p.line(currentX, lineYStart, currentX, lineYEnd);
            
            p.noStroke();
            p.fill(curColor);
            p.textAlign(p.LEFT, p.BASELINE);
            
            p.textFont('Basel Classic');
            p.textStyle(p.BOLD);
            p.textSize(percentageSize);
            p.text(`${item.value}%`, textX, percentageBaselineY);
            
            p.textFont('Basel Grotesk');
            p.textStyle(p.NORMAL);
            p.textSize(categorySize);
            p.text(item.label, textX, categoryBaselineY);
          }
        }
        
        currentX += segmentWidth + gapWidth;
      });
      
    } catch (e) {
      console.error("Stacked Bar Draw Error:", e);
    }
  };

  const drawMetaElements = (p: any, cur: ChartSettings, curW: number, curH: number, fg: string) => {
    const brandMargin = 100;
    const isStackedVertical = cur.chartType === 'stacked' && cur.canvasType === 'vertical';
    const titleSize = isStackedVertical ? 60 * 1.2 : 60;
    const captionSize = isStackedVertical ? 40 * 1.2 : 40;
    const sourceSize = isStackedVertical ? 26 * 1.2 : 26;

    let topCursorY = brandMargin;

    if (cur.chartType === 'stacked' || (cur.chartType === 'donut' && cur.canvasType === 'vertical')) {
      // Calculate total height of title + caption block
      let metaHeight = 0;
      const titleLines = (cur.showTitle && cur.title) ? cur.title.split('\n') : [];
      const captionLines = (cur.showCaption && cur.caption) ? cur.caption.split('\n') : [];
      
      if (titleLines.length > 0) {
        metaHeight += titleLines.length * titleSize * 1.1;
        if (captionLines.length > 0) metaHeight += 15;
      }
      if (captionLines.length > 0) {
        metaHeight += captionLines.length * captionSize * 1.1;
      }
      
      if (cur.chartType === 'stacked') {
        // Top of chart area is barY - 150 (labels above)
        // We want 100px padding between that and the bottom of the meta block
        const barY = (curH / 2) - 120; // barHeight is 240
        topCursorY = barY - 150 - 100 - metaHeight;
      } else {
        // Donut Vertical - bring closer (max 5% spacing)
        const outerR = cur.outerRadius || 500;
        const donutTopY = curH / 2 - outerR;
        const maxGap = curH * 0.05;
        topCursorY = Math.max(brandMargin, donutTopY - maxGap - metaHeight);
      }
    }

    if (cur.showTitle && cur.title) {
      p.fill(fg);
      p.noStroke();
      p.textFont('Basel Classic');
      p.textStyle(p.BOLD);
      p.textSize(titleSize);
      p.textAlign(p.LEFT, p.TOP);
      p.textLeading(titleSize * 0.95);
      const titleLines = cur.title.split('\n');
      titleLines.forEach((line: string) => {
        p.text(line.toUpperCase(), brandMargin, topCursorY);
        topCursorY += titleSize * 1.1;
      });
      topCursorY += (cur.showCaption && cur.caption) ? 15 : 48;
    }

    if (cur.showCaption && cur.caption) {
      p.fill(fg);
      p.noStroke();
      p.textFont('Basel Grotesk');
      p.textStyle(p.NORMAL);
      p.textSize(captionSize);
      p.textAlign(p.LEFT, p.TOP);
      p.textLeading(captionSize * 0.95);
      const captionLines = cur.caption.split('\n');
      captionLines.forEach((line: string) => {
        p.text(line, brandMargin, topCursorY);
        topCursorY += captionSize * 1.1;
      });
      topCursorY += 48;
    }

    if (cur.showSource && cur.source) {
      p.fill(fg);
      p.noStroke();
      p.textFont('Basel Grotesk Mono');
      p.textStyle(p.NORMAL);
      p.textSize(sourceSize);

      if (cur.chartType === 'stacked' || (cur.chartType === 'donut' && cur.canvasType === 'vertical')) {
        let sourceCursorY = 0;
        if (cur.chartType === 'stacked') {
          // Bottom of chart area is barY + barHeight + 120 (labels below)
          // We want 100px padding between that and the top of the source block
          const barY = (curH / 2) - 120;
          const barHeight = 240;
          const bottomLabelOffset = 120;
          const padding = 100;
          sourceCursorY = barY + barHeight + bottomLabelOffset + padding;
        } else {
          // Donut Vertical - bring closer (max 5% spacing)
          const outerR = cur.outerRadius || 500;
          const donutBottomY = curH / 2 + outerR;
          const maxGap = curH * 0.05;
          sourceCursorY = Math.min(curH - brandMargin, donutBottomY + maxGap);
        }
        
        p.textAlign(p.RIGHT, p.TOP);
        const sourceLines = cur.source.split('\n');
        sourceLines.forEach((line: string) => {
          p.text(line.toUpperCase(), curW - brandMargin, sourceCursorY);
          sourceCursorY += sourceSize * 1.2;
        });
      } else {
        p.textAlign(p.RIGHT, p.BOTTOM);
        const sourceLines = cur.source.split('\n');
        let sourceCursorY = curH - brandMargin;
        for (let i = sourceLines.length - 1; i >= 0; i--) {
          p.text(sourceLines[i].toUpperCase(), curW - brandMargin, sourceCursorY);
          sourceCursorY -= sourceSize * 1.2;
        }
      }
    }
    return topCursorY;
  };

  const drawBarChart = (p: any, cur: ChartSettings) => {
    if (!p || !p._renderer) return;
    try {
      const curW = p.width;
      const curH = p.height;
      p.background(cur.backgroundColor || 255);
      const brandMargin = 100;    
      const labelGap = 25;          
      const labelBottomTipY = curH - 200; 
      const titleSize = 60;
      const captionSize = 40; 
      const sourceSize = 26;
      const labelSize = 40; 
      const xAxisTitleSize = 30; 
      const yLabelSize = 30;        
      const barValueSize = 45; 
      const textOffsetFromAxis = 60; 
      const axisWeight = 2;
      const labelLeading = labelSize * 0.95;
      const fg = cur.contentColor || '#000000';
      const isDark = (color: string) => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luma < 0.6;
      };
      const isDarkPalette = isDark(cur.backgroundColor);
      const highlightColor = isDarkPalette ? '#EBFA64' : '#1360F9';

      const wrapText = (text: string, limit: number): string[] => {
        if (!text) return [""];
        if (text.length <= limit) return [text];
        let splitIdx = text.lastIndexOf(' ', limit);
        if (splitIdx === -1) splitIdx = limit;
        const line1 = text.substring(0, splitIdx).trim();
        const line2 = text.substring(splitIdx).trim();
        return [line1, line2];
      };

      const calculateNiceStep = (maxValue: number, density: number) => {
        const targetTicks = density === 0 ? 3 : density === 1 ? 6 : 10;
        const rawStep = maxValue / targetTicks;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const normalizedStep = rawStep / magnitude;
        let step;
        if (normalizedStep < 1.5) step = 1;
        else if (normalizedStep < 2.5) step = 2;
        else if (normalizedStep < 4) step = 2.5;
        else if (normalizedStep < 7.5) step = 5;
        else step = 10;
        return step * magnitude;
      };

      const rawMax = Math.max(...(cur.data || []).map(d => d.value), 0.001);
      const yStep = calculateNiceStep(rawMax, cur.yAxisDensity);
      const rawNumSteps = Math.ceil(rawMax / yStep);
      const finalNumSteps = rawNumSteps % 2 === 0 ? rawNumSteps : rawNumSteps + 1;
      const roundedMax = finalNumSteps * yStep;

      p.textSize(yLabelSize);
      p.textFont('Basel Grotesk Mono');
      let maxLabelWidth = 0;
      if (cur.showYAxisLabels) {
        for (let i = 0; i <= finalNumSteps; i++) {
          if (i % 2 === 0) {
            const val = i * yStep;
            const tw = p.textWidth(val.toString());
            if (tw > maxLabelWidth) maxLabelWidth = tw;
          }
        }
      }
      
      const labelRightEdgeX = brandMargin + maxLabelWidth;
      const chartLeftStart = labelRightEdgeX + labelGap;
      
      drawMetaElements(p, cur, curW, curH, fg);

      let topCursorY = brandMargin;
      if (cur.showTitle && cur.title) {
        topCursorY += cur.title.split('\n').length * titleSize * 1.1 + 48;
      }
      if (cur.showCaption && cur.caption) {
        topCursorY += cur.caption.split('\n').length * captionSize * 1.1 + 48;
      }

      const barCeilingY = Math.max(150, topCursorY);
      p.textSize(labelSize);
      p.textStyle(p.NORMAL);
      let maxXTextWidth = 0;
      const processedLabels = (cur.data || []).map(item => {
        const lines = wrapText(item.label, 30); 
        lines.forEach(line => {
          const tw = p.textWidth(line);
          if (tw > maxXTextWidth) maxXTextWidth = tw;
        });
        return lines;
      });

      const lineEndBuffer = 15;
      const uniformLineLen = maxXTextWidth + textOffsetFromAxis + lineEndBuffer;
      let axisY = (cur.showAngledLabels && !cur.showXAxisLabel) ? (labelBottomTipY - 2 - (uniformLineLen * p.sin(p.QUARTER_PI))) : (labelBottomTipY - 100);
      const availableHeight = axisY - barCeilingY;
      const diagHorizontal = (cur.showAngledLabels && !cur.showXAxisLabel) ? (uniformLineLen * p.cos(p.QUARTER_PI)) : 0;
      const chartRightLimit = curW - brandMargin - diagHorizontal;
      const availableWidth = chartRightLimit - chartLeftStart;
      const n = (cur.data || []).length;
      const highIdx = cur.highlightedIndex ?? -1;
      const hasHighlight = highIdx >= 0 && highIdx < n;
      const chartAreaUnits = (hasHighlight ? (5 * n - 1) : (5 * n - 4));
      const totalUnits = 3 + chartAreaUnits;
      const unit = availableWidth / Math.max(1, totalUnits);
      const standardBarW = unit;
      const highBarW = unit * 4;
      const gapW = unit * 4;
      const yAxisIndicatorW = unit;
      const yAxisGapW = unit * 2; 

      if (cur.showYAxisTitle && cur.yAxisTitle) {
        p.push();
        p.fill(fg); p.noStroke();
        p.textFont('Basel Grotesk Mono');
        p.textSize(yLabelSize); p.textAlign(p.CENTER, p.BOTTOM);
        const centerY = (axisY + barCeilingY) / 2;
        p.translate(labelRightEdgeX - maxLabelWidth - unit, centerY);
        p.rotate(-p.HALF_PI);
        p.text(cur.yAxisTitle.toUpperCase(), 0, 0);
        p.pop();
      }

      p.textSize(yLabelSize); p.textFont('Basel Grotesk Mono'); p.textStyle(p.NORMAL); p.textAlign(p.RIGHT, p.CENTER);
      for (let i = 0; i <= finalNumSteps; i++) {
        const val = i * yStep;
        const yPos = axisY - (val / roundedMax) * availableHeight;
        p.stroke(fg); p.strokeWeight(axisWeight);
        p.line(chartLeftStart, yPos, chartLeftStart + yAxisIndicatorW, yPos);
        if (cur.showYAxisLabels) {
          const shouldShowLabel = (cur.yAxisLabelMode === 'startEnd') ? (i === 0 || i === finalNumSteps) : (i % 2 === 0);
          if (shouldShowLabel) { p.noStroke(); p.fill(fg); p.text(val.toString(), labelRightEdgeX, yPos - 1); }
        }
      }

      p.stroke(fg); p.strokeWeight(axisWeight);
      p.line(chartLeftStart, axisY, chartRightLimit + 36, axisY);

      if (n > 0) {
        let currentX = chartLeftStart + yAxisIndicatorW + yAxisGapW; 
        cur.data.forEach((item, i) => {
          const isHigh = i === highIdx;
          const barW = isHigh ? highBarW : standardBarW;
          const h = (item.value / roundedMax) * availableHeight;
          const useHighColor = isHigh && cur.useHighlightColor;
          p.noStroke(); p.fill(useHighColor ? highlightColor : fg);
          p.rect(currentX, axisY - h, barW, h);
          if (cur.showBarValues) {
            p.push(); p.fill(useHighColor ? highlightColor : fg); p.noStroke(); p.textFont('Basel Grotesk Mono'); p.textSize(barValueSize); p.textAlign(p.CENTER, p.BOTTOM);
            p.text(item.value.toString(), currentX + barW / 2, axisY - h - 15); p.pop();
          }
          if (cur.showAngledLabels && !cur.showXAxisLabel) {
            const startX = currentX; const startY = axisY + 2; 
            p.push(); p.stroke(useHighColor ? highlightColor : fg); p.strokeWeight(1);
            const angle = p.QUARTER_PI;
            const endX = startX + uniformLineLen * p.cos(angle); const endY = startY + uniformLineLen * p.sin(angle);
            p.line(startX, startY, endX, endY); p.noStroke(); p.fill(useHighColor ? highlightColor : fg);
            p.translate(startX, startY); p.rotate(angle); p.textFont('Basel Grotesk'); p.textSize(labelSize); p.textStyle(isHigh ? p.BOLD : p.NORMAL); p.textAlign(p.RIGHT, p.BOTTOM);
            const lines = processedLabels[i];
            if (lines.length === 2) { p.text(lines[1], uniformLineLen - 5, -8); p.text(lines[0], uniformLineLen - 5, -8 - labelLeading); } else { p.text(lines[0], uniformLineLen - 5, -8); }
            p.pop();
          }
          currentX += barW + gapW;
        });
        if (cur.showXAxisLabel && cur.xAxisLabel) { p.noStroke(); p.fill(fg); p.textFont('Basel Grotesk Mono'); p.textSize(xAxisTitleSize); p.textAlign(p.LEFT, p.TOP); p.text(cur.xAxisLabel.toUpperCase(), chartLeftStart, axisY + 40); }
      }
    } catch (e) { console.error("Draw Loop Error:", e); }
  };

  // Spins up a hidden p5 SVG-renderer instance, draws the chart once, and
  // resolves with the serialized SVG XML string (or '' on failure).
  const generateSvgString = (): Promise<string> => {
    return new Promise((resolve) => {
      const { width, height } = getCanvasDimensions(settingsRef.current);
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden;';
      document.body.appendChild(hiddenDiv);

      const cleanup = (inst: any) => { try { inst.remove(); } catch (_) {} if (hiddenDiv.parentNode) document.body.removeChild(hiddenDiv); };

      try {
        if (!p5 || !(p5 as any).prototype?.SVG) {
          console.error('[SVG] p5.js-svg not loaded — p5.SVG constant missing');
          if (hiddenDiv.parentNode) document.body.removeChild(hiddenDiv);
          resolve('');
          return;
        }

        new p5((p: any) => {
          p.setup = () => {
            p.createCanvas(width, height, p.SVG);
            p.noLoop();

            // Verify we actually got an SVG renderer, not a fallback canvas.
            const svgEl = p._renderer?.svg;
            if (!svgEl || svgEl.tagName?.toLowerCase() !== 'svg') {
              console.error('[SVG] p5-svg failed: renderer has no <svg> element — got', svgEl?.tagName ?? p._renderer?.elt?.tagName ?? 'nothing');
              cleanup(p);
              resolve('');
              return;
            }

            drawChart(p, settingsRef.current);
            // SVG drawing ops are synchronous — serialize immediately.
            try {
              let s = new XMLSerializer().serializeToString(svgEl);
              if (!s.includes('xmlns="http://www.w3.org/2000/svg"'))
                s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
              cleanup(p);
              resolve(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${s}`);
            } catch (e) {
              console.error('[SVG] serialize error:', e);
              cleanup(p);
              resolve('');
            }
          };
        }, hiddenDiv);
      } catch (e) {
        console.error('[SVG] p5 constructor threw:', e);
        if (hiddenDiv.parentNode) document.body.removeChild(hiddenDiv);
        resolve('');
      }
    });
  };

  // Trigger a file download for a given SVG XML string.
  const triggerSvgDownload = (svgXml: string, filename: string) => {
    console.log('[SVG] triggerSvgDownload: length=', svgXml.length);
    const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Delay revocation so the browser has time to initiate the download.
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    if (p5InstanceRef.current) { p5InstanceRef.current.remove(); p5InstanceRef.current = null; }

    const initP5 = () => {
      if (typeof p5 === 'undefined' || !containerRef.current) return;
      const sketch = (p: any) => {
        p.setup = () => { const { width, height } = getCanvasDimensions(settingsRef.current); p.createCanvas(width, height); p.pixelDensity(1); p.noLoop(); };
        p.draw = () => { drawChart(p, settingsRef.current); };
      };
      try { p5InstanceRef.current = new p5(sketch, containerRef.current); } catch (e) { console.error("p5 Init Error:", e); }
    };

    Promise.all([
      document.fonts.load('normal 16px "Basel Grotesk"'),
      document.fonts.load('normal 16px "Basel Grotesk Mono"'),
      document.fonts.load('bold 16px "Basel Grotesk Mono"'),
      document.fonts.load('500 16px "Basel Classic"'),
    ]).then(initP5).catch(initP5);

    return () => { if (p5InstanceRef.current) { p5InstanceRef.current.remove(); p5InstanceRef.current = null; } };
  }, [settings.canvasType, settings.chartType]);

  // Pre-warm the SVG cache whenever settings change so the download fires
  // synchronously (inside the user-gesture window) when the button is clicked.
  useEffect(() => {
    svgCacheRef.current = '';
    let cancelled = false;
    generateSvgString().then(s => {
      if (!cancelled) svgCacheRef.current = s;
    });
    return () => { cancelled = true; };
  }, [settings]);

  useEffect(() => {
    const handleDownload = async (e: any) => {
      const format = e.detail?.format || 'png';
      const filename = `brand-chart-${Date.now()}`;
      console.log('[download] format=', format);

      if (format === 'zip') {
        const zip = new JSZip();
        const sourceJson = JSON.stringify(settingsRef.current, null, 2);
        zip.file(`${filename}-source.json`, sourceJson);

        if (p5InstanceRef.current) {
          const pngBlob = await new Promise<Blob | null>(res => p5InstanceRef.current.canvas.toBlob(res, 'image/png'));
          if (pngBlob) zip.file(`${filename}.png`, pngBlob);
        }

        const svgContent = await generateSvgString();
        if (svgContent) zip.file(`${filename}.svg`, svgContent);

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url; link.download = `${filename}-bundle.zip`;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); setTimeout(() => URL.revokeObjectURL(url), 2000);
      } else if (format === 'svg') {
        // Use cached SVG if ready (synchronous path — inside user gesture window).
        // Fall back to generating on demand if the cache isn't warm yet.
        const cached = svgCacheRef.current;
        console.log('[SVG download] cache length=', cached.length);
        if (cached) {
          triggerSvgDownload(cached, filename);
        } else {
          console.warn('[SVG download] cache empty, generating on demand');
          generateSvgString().then(s => {
            if (s) triggerSvgDownload(s, filename);
            else console.error('[SVG download] generateSvgString returned empty');
          });
        }
      } else {
        if (p5InstanceRef.current) p5InstanceRef.current.saveCanvas(filename, 'png');
      }
    };
    window.addEventListener('download-chart', handleDownload);
    return () => window.removeEventListener('download-chart', handleDownload);
  }, []);

  return (
    <div className={`origin-top-left bg-white transition-all duration-300 ${settings.showVisualizer ? 'shadow-2xl scale-[1.005]' : ''}`} style={{ width: `${displayWidth}px`, height: `${displayHeight}px`, overflow: 'hidden' }}>
      <div ref={containerRef} />
      <style>{`canvas { width: ${displayWidth}px !important; height: ${displayHeight}px !important; display: block; outline: none; }`}</style>
    </div>
  );
};