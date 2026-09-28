// ─── Performance Metrics ─────────────────────────────
export interface PerformanceMetrics {
  appStartTime: number;
  jsBundleLoadTime: number;
  firstRenderTime: number;
  timeToInteractive: number;
  memoryUsageMB: number;
  frameDropCount: number;
  averageFPS: number;
}

class PerformanceMonitor {
  private startTime: number = Date.now();
  private milestones: Map<string, number> = new Map();
  private frameTimestamps: number[] = [];
  private isMonitoring = false;
  private rafId: number | null = null;

  /**
   * Mark a performance milestone
   */
  mark(name: string): void {
    const elapsed = Date.now() - this.startTime;
    this.milestones.set(name, elapsed);
    if (__DEV__) {
      console.log(`[Perf] ${name}: ${elapsed}ms`);
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark: string): number {
    const start = this.milestones.get(startMark) || 0;
    const end = this.milestones.get(endMark) || 0;
    const duration = end - start;
    if (__DEV__) {
      console.log(`[Perf] ${name}: ${duration}ms (${startMark} → ${endMark})`);
    }
    return duration;
  }

  /**
   * Start FPS monitoring (dev only)
   */
  startFPSMonitor(): void {
    if (!__DEV__ || this.isMonitoring) return;
    this.isMonitoring = true;
    this.frameTimestamps = [];

    const measureFrame = () => {
      const now = Date.now();
      this.frameTimestamps.push(now);

      // Keep only last 120 frames
      if (this.frameTimestamps.length > 120) {
        this.frameTimestamps.shift();
      }

      this.rafId = requestAnimationFrame(measureFrame);
    };

    this.rafId = requestAnimationFrame(measureFrame);
  }

  /**
   * Stop FPS monitoring
   */
  stopFPSMonitor(): void {
    this.isMonitoring = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    if (this.frameTimestamps.length < 2) return 0;

    const recent = this.frameTimestamps.slice(-60);
    const duration = recent[recent.length - 1] - recent[0];
    if (duration <= 0) return 0;
    return Math.round((recent.length / duration) * 1000);
  }

  /**
   * Get memory usage (approximate, web/Hermes with performance.memory only)
   */
  getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const mem = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      return Math.round(mem.usedJSHeapSize / (1024 * 1024));
    }
    return 0;
  }

  /**
   * Get full performance report
   */
  getReport(): PerformanceMetrics {
    return {
      appStartTime: this.milestones.get('appStart') || 0,
      jsBundleLoadTime: this.milestones.get('jsBundleLoaded') || 0,
      firstRenderTime: this.milestones.get('firstRender') || 0,
      timeToInteractive: this.milestones.get('interactive') || 0,
      memoryUsageMB: this.getMemoryUsage(),
      frameDropCount: this.countFrameDrops(),
      averageFPS: this.getCurrentFPS(),
    };
  }

  /**
   * Count frames that took longer than 16.67ms (60fps threshold)
   */
  private countFrameDrops(): number {
    let drops = 0;
    for (let i = 1; i < this.frameTimestamps.length; i++) {
      const delta = this.frameTimestamps[i] - this.frameTimestamps[i - 1];
      if (delta > 20) drops++; // Allow slight margin
    }
    return drops;
  }

  /**
   * Log full report (dev only)
   */
  logReport(): void {
    if (!__DEV__) return;
    const report = this.getReport();
    console.log('📊 Performance Report');
    console.log(`App Start:      ${report.appStartTime}ms`);
    console.log(`JS Bundle:      ${report.jsBundleLoadTime}ms`);
    console.log(`First Render:   ${report.firstRenderTime}ms`);
    console.log(`Interactive:    ${report.timeToInteractive}ms`);
    console.log(`Memory:         ${report.memoryUsageMB}MB`);
    console.log(`FPS:            ${report.averageFPS}`);
    console.log(`Frame Drops:    ${report.frameDropCount}`);
  }
}

export const perfMonitor = new PerformanceMonitor();
