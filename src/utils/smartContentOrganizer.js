/**
 * Smart Content Organization System
 * Provides intelligent content positioning and layout optimization for PowerPoint slides
 */

export class SmartContentOrganizer {
  constructor() {
    this.standardDimensions = {
      slide: { width: 1280, height: 720 }, // 16:9 aspect ratio
      margins: { top: 60, right: 80, bottom: 60, left: 80 },
      titleArea: { height: 120 },
      contentArea: { minHeight: 400 },
      imageArea: { minWidth: 300, maxWidth: 500 }
    };
    
    this.layoutZones = {
      title: { x: 0, y: 0, width: 100, height: 15 }, // Percentage-based
      subtitle: { x: 0, y: 15, width: 100, height: 10 },
      mainContent: { x: 0, y: 25, width: 65, height: 70 },
      sidebar: { x: 65, y: 25, width: 35, height: 70 },
      footer: { x: 0, y: 95, width: 100, height: 5 }
    };
  }

  /**
   * Analyze slide content and determine optimal organization
   */
  analyzeSlideContent(slideData) {
    const { textElements = [], imageElements = [] } = slideData || {};
    
    return {
      contentDensity: this.calculateContentDensity(textElements, imageElements),
      textRegions: this.identifyTextRegions(textElements),
      imageRegions: this.identifyImageRegions(imageElements),
      visualWeight: this.calculateVisualWeight(textElements, imageElements),
      recommendedLayout: this.determineOptimalLayout(textElements, imageElements),
      positioningStrategy: this.selectPositioningStrategy(textElements, imageElements)
    };
  }

  /**
   * Calculate content density for layout decisions
   */
  calculateContentDensity(textElements, imageElements) {
    const validTextElements = (textElements || []).filter(el => el && el.text);
    const validImageElements = (imageElements || []).filter(el => el);
    
    const totalTextLength = validTextElements.reduce((sum, el) => sum + el.text.length, 0);
    const imageCount = validImageElements.length;
    const textDensity = totalTextLength / 1000; // Normalize to scale
    const imageDensity = imageCount * 0.3; // Weight images
    
    return {
      text: Math.min(textDensity, 1),
      images: Math.min(imageDensity, 1),
      total: Math.min(textDensity + imageDensity, 1),
      category: this.categorizeDensity(textDensity + imageDensity)
    };
  }

  categorizeDensity(density) {
    if (density < 0.3) return 'sparse';
    if (density < 0.7) return 'moderate';
    return 'dense';
  }

  /**
   * Identify and classify text regions
   */
  identifyTextRegions(textElements) {
    return (textElements || []).filter(element => element && element.text).map((element, index) => {
      const classification = this.classifyTextElement(element, index);
      const optimalPosition = this.calculateOptimalTextPosition(element, classification, index);
      
      return {
        ...element,
        classification,
        optimalPosition,
        visualPriority: this.calculateVisualPriority(element, classification),
        readingOrder: this.determineReadingOrder(element, classification, index)
      };
    });
  }

  /**
   * Identify and optimize image regions
   */
  identifyImageRegions(imageElements) {
    return (imageElements || []).filter(element => element).map((element, index) => {
      const optimalPosition = this.calculateOptimalImagePosition(element, index);
      const contextualRole = this.determineImageRole(element, index);
      
      return {
        ...element,
        optimalPosition,
        contextualRole,
        visualWeight: this.calculateImageWeight(element),
        placementPriority: this.calculatePlacementPriority(element, contextualRole)
      };
    });
  }

  /**
   * Calculate visual weight for layout balance
   */
  calculateVisualWeight(textElements, imageElements) {
    const textWeight = (textElements || []).reduce((sum, el) => {
      if (!el || !el.text) return sum;
      const lengthWeight = Math.min(el.text.length / 100, 3);
      const positionWeight = this.getPositionWeight(el.position || {});
      return sum + (lengthWeight * positionWeight);
    }, 0);
    
    const imageWeight = (imageElements || []).reduce((sum, el) => {
      if (!el) return sum;
      const sizeWeight = this.getImageSizeWeight(el.size);
      const positionWeight = this.getPositionWeight(el.position || {});
      return sum + (sizeWeight * positionWeight * 2); // Images have higher visual weight
    }, 0);
    
    return {
      text: textWeight,
      images: imageWeight,
      total: textWeight + imageWeight,
      balance: this.assessBalance(textWeight, imageWeight)
    };
  }

  /**
   * Get position weight based on visual importance
   */
  getPositionWeight(position) {
    const { x = 0, y = 0 } = position;
    
    // Top-left quadrant has highest weight (primary reading area)
    if (x < 640 && y < 360) return 1.0;
    // Top-right quadrant
    if (x >= 640 && y < 360) return 0.8;
    // Bottom-left quadrant
    if (x < 640 && y >= 360) return 0.6;
    // Bottom-right quadrant
    return 0.4;
  }

  /**
   * Calculate optimal text positioning
   */
  calculateOptimalTextPosition(textElement, classification, index) {
    const zones = this.layoutZones;
    const slideWidth = this.standardDimensions.slide.width;
    const slideHeight = this.standardDimensions.slide.height;
    
    let targetZone;
    
    switch (classification.type) {
      case 'title':
        targetZone = zones.title;
        break;
      case 'subtitle':
        targetZone = zones.subtitle;
        break;
      case 'heading':
        targetZone = { ...zones.mainContent, height: 15 };
        break;
      default:
        targetZone = zones.mainContent;
    }
    
    return {
      x: (targetZone.x * slideWidth) / 100,
      y: (targetZone.y * slideHeight) / 100 + (index * 40), // Offset for multiple elements
      width: (targetZone.width * slideWidth) / 100,
      height: Math.max(60, (textElement.text || '').length / 3), // Dynamic height based on content
      zone: targetZone,
      justification: this.determineTextJustification(classification)
    };
  }

  /**
   * Calculate optimal image positioning
   */
  calculateOptimalImagePosition(imageElement, index) {
    const zones = this.layoutZones;
    const slideWidth = this.standardDimensions.slide.width;
    const slideHeight = this.standardDimensions.slide.height;
    
    // Images typically go in sidebar or bottom area
    const targetZone = zones.sidebar;
    
    return {
      x: (targetZone.x * slideWidth) / 100,
      y: (targetZone.y * slideHeight) / 100 + (index * 200),
      width: Math.min((targetZone.width * slideWidth) / 100, 400),
      height: 150 + (index * 20), // Varied heights for visual interest
      zone: targetZone,
      alignment: 'center'
    };
  }

  /**
   * Apply intelligent positioning to slide content
   */
  applyIntelligentPositioning(slideData) {
    try {
      const analysis = this.analyzeSlideContent(slideData);
      const { textRegions, imageRegions } = analysis;
      
      // Apply positioning based on content density and layout strategy
      const positionedContent = {
        textElements: this.positionTextElements(textRegions, analysis),
        imageElements: this.positionImageElements(imageRegions, analysis),
        layoutCSS: this.generatePositioningCSS(analysis),
        gridDefinition: this.createGridDefinition(analysis)
      };
      
      return {
        ...slideData,
        ...positionedContent,
        organizationStrategy: analysis.positioningStrategy
      };
    } catch (error) {
      console.warn('Error in intelligent positioning, using fallback:', error);
      
      // Fallback positioning
      return {
        ...slideData,
        textElements: slideData.textElements || [],
        imageElements: slideData.imageElements || [],
        layoutCSS: {
          display: 'grid',
          gridTemplateAreas: '"header" "content"',
          gridTemplateRows: 'auto 1fr',
          gridTemplateColumns: '1fr',
          gap: '16px',
          padding: '20px',
          alignItems: 'center',
          justifyItems: 'center'
        },
        organizationStrategy: 'fallback'
      };
    }
  }

  /**
   * Position text elements with intelligent spacing
   */
  positionTextElements(textRegions, analysis) {
    return textRegions.map((region, index) => {
      const spacing = this.calculateIntelligentSpacing(region, index, analysis);
      
      return {
        ...region,
        cssStyle: this.generateTextPositionCSS(region, spacing),
        gridArea: this.determineGridArea(region, index),
        responsiveAdjustments: this.calculateResponsiveAdjustments(region)
      };
    });
  }

  /**
   * Position image elements with optimal layout
   */
  positionImageElements(imageRegions, analysis) {
    return imageRegions.map((region, index) => {
      const spacing = this.calculateImageSpacing(region, index, analysis);
      
      return {
        ...region,
        cssStyle: this.generateImagePositionCSS(region, spacing),
        gridArea: this.determineImageGridArea(region, index),
        aspectRatio: this.calculateOptimalAspectRatio(region)
      };
    });
  }

  /**
   * Generate CSS for intelligent positioning
   */
  generatePositioningCSS(analysis) {
    const { contentDensity, recommendedLayout } = analysis;
    
    let gridTemplateAreas, gridTemplateRows, gridTemplateColumns;
    
    switch (recommendedLayout) {
      case 'title-focused':
        gridTemplateAreas = '"title title" "subtitle subtitle" "content content"';
        gridTemplateRows = 'auto auto 1fr';
        gridTemplateColumns = '1fr';
        break;
        
      case 'content-image':
        gridTemplateAreas = '"header header" "content images"';
        gridTemplateRows = 'auto 1fr';
        gridTemplateColumns = '2fr 1fr';
        break;
        
      case 'two-column':
        gridTemplateAreas = '"header header" "left right"';
        gridTemplateRows = 'auto 1fr';
        gridTemplateColumns = '1fr 1fr';
        break;
        
      default:
        gridTemplateAreas = '"header" "content"';
        gridTemplateRows = 'auto 1fr';
        gridTemplateColumns = '1fr';
    }
    
    return {
      display: 'grid',
      gridTemplateAreas,
      gridTemplateRows,
      gridTemplateColumns,
      gap: this.calculateOptimalGap(contentDensity),
      padding: this.calculateOptimalPadding(contentDensity),
      alignItems: 'center',
      justifyItems: 'center',
      placeItems: 'center',
      alignContent: 'start',
      justifyContent: 'center'
    };
  }

  /**
   * Calculate intelligent spacing between elements
   */
  calculateIntelligentSpacing(region, index, analysis) {
    const basePadding = 16;
    const densityMultiplier = 1 - (analysis.contentDensity.total * 0.3);
    const hierarchyMultiplier = this.getHierarchySpacingMultiplier(region.classification);
    
    return {
      top: basePadding * densityMultiplier * hierarchyMultiplier,
      right: basePadding,
      bottom: basePadding * densityMultiplier,
      left: basePadding
    };
  }

  /**
   * Get spacing multiplier based on content hierarchy
   */
  getHierarchySpacingMultiplier(classification) {
    const multipliers = {
      'title': 2.0,
      'subtitle': 1.5,
      'heading': 1.3,
      'content': 1.0,
      'caption': 0.8
    };
    
    return multipliers[classification?.type] || 1.0;
  }

  /**
   * Determine optimal layout based on content analysis
   */
  determineOptimalLayout(textElements, imageElements) {
    const textCount = textElements.length;
    const imageCount = imageElements.length;
    const totalContentLength = textElements.reduce((sum, el) => sum + (el.text || '').length, 0);
    
    // Title slide detection
    if (textCount <= 2 && imageCount === 0 && totalContentLength < 200) {
      return 'title-focused';
    }
    
    // Image-heavy layout
    if (imageCount > 0 && imageCount >= textCount / 2) {
      return 'content-image';
    }
    
    // Two-column layout for balanced content
    if (textCount >= 3 && totalContentLength > 300) {
      return 'two-column';
    }
    
    // Single column for simple content
    return 'single-column';
  }

  /**
   * Select positioning strategy based on content
   */
  selectPositioningStrategy(textElements, imageElements) {
    // Calculate content density directly to avoid circular dependency
    const validTextElements = (textElements || []).filter(el => el && el.text);
    const validImageElements = (imageElements || []).filter(el => el);
    
    const totalTextLength = validTextElements.reduce((sum, el) => sum + el.text.length, 0);
    const imageCount = validImageElements.length;
    const textDensity = totalTextLength / 1000;
    const imageDensity = imageCount * 0.3;
    const totalDensity = textDensity + imageDensity;
    const densityCategory = this.categorizeDensity(totalDensity);
    
    if (densityCategory === 'dense') {
      return 'compact-grid';
    } else if (densityCategory === 'sparse') {
      return 'spacious-flow';
    } else {
      return 'balanced-layout';
    }
  }

  // Helper methods
  classifyTextElement(element, index) {
    // Simplified classification - can be enhanced
    if (!element || !element.text) return { type: 'content', priority: 4 };
    
    if (index === 0) return { type: 'title', priority: 1 };
    if (index === 1 && element.text.length < 100) return { type: 'subtitle', priority: 2 };
    if (element.text.length < 50) return { type: 'heading', priority: 3 };
    return { type: 'content', priority: 4 };
  }

  calculateVisualPriority(element, classification) {
    return classification?.priority || 5;
  }

  determineReadingOrder(element, classification, index) {
    return index + 1;
  }

  determineImageRole(element, index) {
    if (index === 0) return 'primary';
    return 'supporting';
  }

  calculateImageWeight(element) {
    return element.size ? (element.size.width * element.size.height) / 10000 : 1;
  }

  calculatePlacementPriority(element, role) {
    return role === 'primary' ? 1 : 2;
  }

  getImageSizeWeight(size) {
    if (!size) return 1;
    return Math.min((size.width * size.height) / 100000, 3);
  }

  assessBalance(textWeight, imageWeight) {
    const ratio = imageWeight / (textWeight + imageWeight + 0.1);
    if (ratio < 0.2) return 'text-heavy';
    if (ratio > 0.7) return 'image-heavy';
    return 'balanced';
  }

  determineTextJustification(classification) {
    return classification?.type === 'title' ? 'center' : 'left';
  }

  generateTextPositionCSS(region, spacing) {
    return {
      padding: `${spacing.top}px ${spacing.right}px ${spacing.bottom}px ${spacing.left}px`,
      textAlign: region.optimalPosition?.justification || 'center',
      gridArea: region.gridArea || 'content',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '100%'
    };
  }

  generateImagePositionCSS(region, spacing) {
    return {
      padding: `${spacing.top}px ${spacing.right}px ${spacing.bottom}px ${spacing.left}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gridArea: region.gridArea || 'images',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      objectPosition: 'center'
    };
  }

  determineGridArea(region, index) {
    const areaMap = {
      'title': 'title',
      'subtitle': 'subtitle', 
      'heading': 'header',
      'content': 'content'
    };
    return areaMap[region?.classification?.type] || 'content';
  }

  determineImageGridArea(region, index) {
    return 'images';
  }

  calculateOptimalAspectRatio(region) {
    return '16/9'; // Default to presentation aspect ratio
  }

  calculateResponsiveAdjustments(region) {
    return {
      mobile: { fontSize: '0.9em', padding: '0.5rem' },
      tablet: { fontSize: '1em', padding: '1rem' },
      desktop: { fontSize: '1.1em', padding: '1.5rem' }
    };
  }

  calculateImageSpacing(region, index, analysis) {
    return this.calculateIntelligentSpacing(region, index, analysis);
  }

  createGridDefinition(analysis) {
    return {
      areas: analysis.recommendedLayout,
      responsive: true,
      fallback: 'single-column'
    };
  }

  calculateOptimalGap(contentDensity) {
    const baseGap = 24;
    return `${baseGap * (1 - contentDensity.total * 0.3)}px`;
  }

  calculateOptimalPadding(contentDensity) {
    const basePadding = 32;
    return `${basePadding * (1 - contentDensity.total * 0.2)}px`;
  }
}

export default SmartContentOrganizer;