import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import sharp from 'sharp';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs/promises';
import PDFDocument from 'pdfkit';
import { Event } from '../../database/entities/event.entity';
import { Guest } from '../../database/entities/guest.entity';
import { Tier } from '../../database/entities/tier.entity';

interface CanvasConfig {
  width: number;
  height: number;
}

interface TextElement {
  id: string;
  type: 'text';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  align?: 'left' | 'center' | 'right';
  rotation?: number;
  opacity?: number;
  letterSpacing?: number;
  lineHeight?: number;
  dynamicField?: string;
}

interface ImageElement {
  id: string;
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  cornerRadius?: number;
  filters?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    grayscale?: number;
  };
}

interface QRCodeElement {
  id: string;
  type: 'qrcode';
  data: string;
  x: number;
  y: number;
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  rotation?: number;
  opacity?: number;
}

interface ShapeElement {
  id: string;
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  opacity?: number;
  points?: number[];
}

type DesignElement = TextElement | ImageElement | QRCodeElement | ShapeElement;

export interface RenderRequest {
  eventId: string;
  guestId?: string;
  format: 'png' | 'pdf' | 'jpg' | 'webp';
  designConfig: {
    canvas: CanvasConfig;
    background?: string;
    elements: DesignElement[];
  };
  variables?: Record<string, string>;
}

@Injectable()
export class AdvancedPassRendererService {
  private readonly logger = new Logger(AdvancedPassRendererService.name);

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Guest)
    private guestRepository: Repository<Guest>,
  ) {}

  async renderPass(request: RenderRequest): Promise<Buffer> {
    try {
      this.logger.log('STARTING RENDER PASS - SIMPLE TEST VERSION');
      
      // Just return a simple white image for now
      const image = sharp({
        create: {
          width: 400,
          height: 600,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      });
      
      const buffer = await image.png().toBuffer();
      this.logger.log(`Created simple test image: ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      this.logger.error('Error in simplified renderPass:', error);
      throw error;
    }
  }

  private async createElementLayer(
    element: DesignElement, 
    dynamicData: Record<string, any>,
    canvas: CanvasConfig
  ): Promise<any | null> {
    try {
      switch (element.type) {
        case 'text':
          return this.createTextLayer(element, dynamicData, canvas);
        case 'image':
          return this.createImageLayer(element);
        case 'qrcode':
          return this.createQRCodeLayer(element, dynamicData);
        case 'shape':
          return this.createShapeLayer(element);
      }
    } catch (error) {
      this.logger.error(`Failed to create layer for element ${element.id}:`, error);
      return null;
    }
  }

  private async createTextLayer(
    element: TextElement, 
    dynamicData: Record<string, any>,
    canvas: CanvasConfig
  ): Promise<any | null> {
    // Replace dynamic fields
    let text = element.text;
    if (element.dynamicField) {
      const fieldPath = element.dynamicField.replace(/{{|}}/g, '').split('.');
      let value = dynamicData;
      for (const key of fieldPath) {
        value = value?.[key];
      }
      text = value?.toString() || text;
    }

    // For now, create a simple text overlay using SVG
    // In a production environment, you'd want to use a more sophisticated text rendering solution
    const color = element.fill.replace('#', '');
    
    const svgText = `
      <svg width="${canvas.width}" height="${canvas.height}">
        <text x="${element.x}" y="${element.y + element.fontSize}" 
              font-family="${element.fontFamily || 'Arial'}" 
              font-size="${element.fontSize}" 
              fill="#${color}"
              text-anchor="${element.align === 'center' ? 'middle' : element.align === 'right' ? 'end' : 'start'}"
              ${element.fontStyle?.includes('bold') ? 'font-weight="bold"' : ''}
              ${element.fontStyle?.includes('italic') ? 'font-style="italic"' : ''}
              opacity="${element.opacity || 1}">
          ${text}
        </text>
      </svg>
    `;

    const textBuffer = Buffer.from(svgText);
    const textImage = sharp(textBuffer).png();

    return {
      input: await textImage.toBuffer(),
      top: 0,
      left: 0,
      blend: 'over'
    };
  }

  private async createImageLayer(element: ImageElement): Promise<any | null> {
    try {
      let imageBuffer: Buffer;
      
      if (element.src.startsWith('http')) {
        const response = await fetch(element.src);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        imageBuffer = await fs.readFile(element.src);
      }

      let image = sharp(imageBuffer)
        .resize(element.width, element.height, { fit: 'cover' });

      // Apply filters
      if (element.filters) {
        if (element.filters.blur) {
          image = image.blur(element.filters.blur);
        }
        if (element.filters.brightness) {
          image = image.modulate({ brightness: element.filters.brightness / 100 });
        }
        if (element.filters.grayscale) {
          image = image.grayscale();
        }
      }

      // Apply rotation
      if (element.rotation) {
        image = image.rotate(element.rotation);
      }

      return {
        input: await image.png().toBuffer(),
        top: element.y,
        left: element.x,
        blend: 'over'
      };
    } catch (error) {
      this.logger.warn(`Failed to create image layer for ${element.id}:`, error);
      return null;
    }
  }

  private async createQRCodeLayer(
    element: QRCodeElement, 
    dynamicData: Record<string, any>
  ): Promise<any | null> {
    // Replace dynamic data in QR code
    let qrData = element.data;
    if (qrData.includes('{{')) {
      const fieldPath = qrData.replace(/{{|}}/g, '').split('.');
      let value = dynamicData;
      for (const key of fieldPath) {
        value = value?.[key];
      }
      qrData = value?.toString() || qrData;
    }

    try {
      const qrCodeBuffer = await QRCode.toBuffer(qrData, {
        width: element.size,
        margin: element.margin || 1,
        color: {
          dark: element.foregroundColor,
          light: element.backgroundColor,
        },
        errorCorrectionLevel: element.errorCorrectionLevel || 'M',
      });

      let qrImage = sharp(qrCodeBuffer);

      // Apply rotation
      if (element.rotation) {
        qrImage = qrImage.rotate(element.rotation);
      }

      return {
        input: await qrImage.png().toBuffer(),
        top: element.y,
        left: element.x,
        blend: 'over'
      };
    } catch (error) {
      this.logger.error('Failed to generate QR code:', error);
      return null;
    }
  }

  private async createShapeLayer(element: ShapeElement): Promise<any | null> {
    const fillColor = this.hexToRgb(element.fill || '#000000');
    
    let svg = '';
    
    switch (element.shapeType) {
      case 'rectangle':
        svg = `
          <svg width="${element.width}" height="${element.height}">
            <rect width="${element.width}" height="${element.height}" 
                  fill="rgb(${fillColor.r},${fillColor.g},${fillColor.b})"
                  stroke="${element.stroke || 'none'}"
                  stroke-width="${element.strokeWidth || 0}"
                  opacity="${element.opacity || 1}" />
          </svg>
        `;
        break;
        
      case 'circle':
        const radius = element.radius || 50;
        svg = `
          <svg width="${radius * 2}" height="${radius * 2}">
            <circle cx="${radius}" cy="${radius}" r="${radius}"
                    fill="rgb(${fillColor.r},${fillColor.g},${fillColor.b})"
                    stroke="${element.stroke || 'none'}"
                    stroke-width="${element.strokeWidth || 0}"
                    opacity="${element.opacity || 1}" />
          </svg>
        `;
        break;
    }

    if (svg) {
      const shapeBuffer = Buffer.from(svg);
      let shapeImage = sharp(shapeBuffer);

      if (element.rotation) {
        shapeImage = shapeImage.rotate(element.rotation);
      }

      return {
        input: await shapeImage.png().toBuffer(),
        top: element.y,
        left: element.x,
        blend: 'over'
      };
    }

    return null;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private async convertToPDF(imageBuffer: Buffer, canvas: CanvasConfig): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [canvas.width, canvas.height],
        margin: 0,
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add image to PDF
      doc.image(imageBuffer, 0, 0, {
        width: canvas.width,
        height: canvas.height,
      });

      doc.end();
    });
  }

  async generateThumbnail(
    designConfig: any, 
    width: number = 300, 
    height: number = 450
  ): Promise<Buffer> {
    // Generate a small preview
    const scaleFactor = Math.min(width / designConfig.canvas.width, height / designConfig.canvas.height);
    const scaledConfig = {
      ...designConfig,
      canvas: {
        width: Math.round(designConfig.canvas.width * scaleFactor),
        height: Math.round(designConfig.canvas.height * scaleFactor),
      },
      elements: designConfig.elements.map((el: any) => ({
        ...el,
        x: Math.round(el.x * scaleFactor),
        y: Math.round(el.y * scaleFactor),
        ...(el.fontSize && { fontSize: Math.round(el.fontSize * scaleFactor) }),
        ...(el.width && { width: Math.round(el.width * scaleFactor) }),
        ...(el.height && { height: Math.round(el.height * scaleFactor) }),
        ...(el.size && { size: Math.round(el.size * scaleFactor) }),
        ...(el.radius && { radius: Math.round(el.radius * scaleFactor) }),
      })),
    };

    return this.renderPass({
      eventId: '',
      format: 'png',
      designConfig: scaledConfig,
    });
  }
} 