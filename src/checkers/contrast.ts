import { ContrastRatioResult, AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';

/**
 * Color contrast checker implementation
 * Evaluates color contrast ratios according to WCAG guidelines
 */
export class ContrastChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ContrastChecker');
  }

  /**
   * Checks color contrast ratios for all text elements on the page
   * @returns Promise resolving to array of contrast-related accessibility issues
   */
  async check(): Promise<AccessibilityIssue[]> {
    try {
      this.logger.info('Starting color contrast check');
      
      const issues: AccessibilityIssue[] = [];
      const elements = this.getTextElements();
      
      for (const element of elements) {
        const result = this.checkElementContrast(element);
        
        if (!result.isValid) {
          const issue: AccessibilityIssue = {
            id: `contrast-${element.tagName}-${Date.now()}`,
            element: element,
            description: `Insufficient color contrast ratio (${result.ratio.toFixed(2)}:1) for WCAG ${this.getRequiredLevel(result.requiredRatio)} level`,
            help: `Element has a contrast ratio of ${result.ratio.toFixed(2)}:1, which is below the required ${result.requiredRatio}:1 for its font size and weight`,
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
            impact: this.determineImpactLevel(result.ratio, result.requiredRatio),
            tags: ['cat.color', 'wcag2aa', 'wcag143'],
            wcagLevels: ['AA'],
            wcagCriteria: ['1.4.3'],
            fixSuggestions: [
              `Increase contrast between text color (${result.foregroundColor}) and background color (${result.backgroundColor})`,
              `Adjust either foreground or background color to achieve minimum contrast ratio of ${result.requiredRatio}:1`
            ]
          };
          
          issues.push(issue);
        }
      }
      
      this.logger.info(`Color contrast check completed. Found ${issues.length} issues.`);
      return issues;
    } catch (error) {
      this.logger.error('Error during color contrast check:', error);
      throw error;
    }
  }

  /**
   * Gets all text elements that need contrast checking
   */
  private getTextElements(): ElementInfo[] {
    const elements: ElementInfo[] = [];
    
    const textElements = document.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, span, div, a, button, label, input, textarea, li, td, th'
    );
    
    textElements.forEach((el: Element) => {
      const computedStyle = window.getComputedStyle(el);
      const textContent = el.textContent?.trim() || '';
      
      // Skip if element is hidden or has no text content
      if (
        computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        computedStyle.opacity === '0' ||
        textContent === ''
      ) {
        return;
      }
      
      const rect = el.getBoundingClientRect();
      
      elements.push({
        tagName: el.tagName.toLowerCase(),
        id: el.id || undefined,
        className: (el as HTMLElement).className || undefined,
        attributes: this.getElementAttributes(el),
        textContent: textContent,
        position: {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left
        }
      });
    });
    
    return elements;
  }

  /**
   * Checks contrast for a single element
   */
  private checkElementContrast(element: ElementInfo): ContrastRatioResult {
    let domElement: Element | null = null;
    
    if (element.id) {
      domElement = document.getElementById(element.id);
    } else {
      domElement = document.querySelector(
        `${element.tagName}${element.className ? '.' + element.className.replace(/\s+/g, '.') : ''}`
      );
    }
    
    if (!domElement) {
      return {
        ratio: 0,
        isValid: false,
        requiredRatio: 4.5,
        foregroundColor: '',
        backgroundColor: '',
        element: element
      };
    }
    
    const computedStyle = window.getComputedStyle(domElement);
    const fontSize = parseFloat(computedStyle.fontSize);
    const fontWeight = computedStyle.fontWeight;
    
    const isLargeText =
      fontSize >= 18 ||
      (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight, 10) >= 600));
    
    const fgColor = this.parseColor(computedStyle.color);
    const bgColor = this.getBackgroundColor(domElement);
    
    const ratio = this.calculateContrastRatio(fgColor, bgColor);
    const requiredRatio = isLargeText ? 3.0 : 4.5;
    
    return {
      ratio,
      isValid: ratio >= requiredRatio,
      requiredRatio,
      foregroundColor: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      element: element
    };
  }

  /**
   * Gets the background color of an element, considering ancestors
   */
  private getBackgroundColor(element: Element): [number, number, number, number] {
    let currentElement: Element | null = element;
    let bgColor: [number, number, number, number] = [255, 255, 255, 1];
    
    while (currentElement) {
      const computedStyle = window.getComputedStyle(currentElement);
      const bg = computedStyle.backgroundColor;
      
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        bgColor = this.parseColor(bg);
        break;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    return bgColor;
  }

  /**
   * Parses a CSS color value into RGBA components
   */
  private parseColor(color: string): [number, number, number, number] {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex.charAt(0) + hex.charAt(0), 16),
          parseInt(hex.charAt(1) + hex.charAt(1), 16),
          parseInt(hex.charAt(2) + hex.charAt(2), 16),
          1,
        ];
      } else if (hex.length === 6) {
        const r = hex.substring(0, 2);
        const g = hex.substring(2, 4);
        const b = hex.substring(4, 6);
        return [
          parseInt(r, 16),
          parseInt(g, 16),
          parseInt(b, 16),
          1
        ];
      }
    } else if (color.startsWith('rgb(') || color.startsWith('rgba(')) {
      const values = color.match(/[\d.]+/g);
      if (values) {
        const [rStr, gStr, bStr, aStr] = values;
        const r = Number(rStr);
        const g = Number(gStr);
        const b = Number(bStr);
        const a = aStr !== undefined ? Number(aStr) : 1;
        return [r, g, b, a];
      }
    } else if (color.startsWith('hsl(') || color.startsWith('hsla(')) {
      const values = color.match(/[\d.]+/g);
      if (values) {
        const [hStr, sStr, lStr] = values;
        const h = Number(hStr);
        const s = Number(sStr);
        const l = Number(lStr);
        return this.hslToRgb(h, s, l);
      }
    }
    
    return [0, 0, 0, 1];
  }

  /**
   * Converts HSL color to RGB
   */
  private hslToRgb(h: number, s: number, l: number): [number, number, number, number] {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    
    let r: number;
    let g: number;
    let b: number;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 1];
  }

  /**
   * Calculates contrast ratio between two colors
   */
  private calculateContrastRatio(
    color1: [number, number, number, number],
    color2: [number, number, number, number]
  ): number {
    const lum1 = this.relativeLuminance(color1);
    const lum2 = this.relativeLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculates relative luminance of a color
   */
  private relativeLuminance(color: [number, number, number, number]): number {
    const [r, g, b] = color;
    
    const RsRGB = r / 255;
    const GsRGB = g / 255;
    const BsRGB = b / 255;
    
    const R = RsRGB <= 0.03928 ? RsRGB / 12.92 : Math.pow((RsRGB + 0.055) / 1.055, 2.4);
    const G = GsRGB <= 0.03928 ? GsRGB / 12.92 : Math.pow((GsRGB + 0.055) / 1.055, 2.4);
    const B = BsRGB <= 0.03928 ? BsRGB / 12.92 : Math.pow((BsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  /**
   * Determines the required WCAG level based on contrast ratio
   */
  private getRequiredLevel(requiredRatio: number): string {
    if (requiredRatio >= 7.0) {
      return 'AAA';
    } else if (requiredRatio >= 4.5) {
      return 'AA';
    } else {
      return 'A';
    }
  }

  /**
   * Determines impact level based on contrast ratio
   */
  private determineImpactLevel(
    ratio: number,
    requiredRatio: number
  ): 'critical' | 'serious' | 'moderate' | 'minor' {
    const diff = requiredRatio - ratio;
    
    if (diff >= 2.0) {
      return 'critical';
    } else if (diff >= 1.0) {
      return 'serious';
    } else if (diff > 0.1) {
      return 'moderate';
    } else {
      return 'minor';
    }
  }

  /**
   * Gets element attributes as key-value pairs
   */
  private getElementAttributes(element: Element): { [key: string]: string } {
    const attrs: { [key: string]: string } = {};
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes.item(i);
      if (!attr) continue;
      attrs[attr.name] = attr.value;
    }
    
    return attrs;
  }
}
