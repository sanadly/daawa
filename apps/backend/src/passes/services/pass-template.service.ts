import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Event } from '../../database/entities/event.entity';
import { Guest } from '../../database/entities/guest.entity';  


// Define the structure for a template's metadata
export interface PassTemplate {
  id: string;
  name: string;
  description: string;
  previewImageUrl: string; // URL to the static preview image
  sourceFilePath: string; // Path to the base image file for composition
  defaultLayout: {
    elements: Array<{
      id: string;
      text: string;
      x: number;
      y: number;
      font: string;
      size: number;
      color: string;
      bold?: boolean;
      italic?: boolean;
      align?: 'left' | 'center' | 'right';
    }>;
    qr_code_position: { x: number; y: number; size: number };
  };
}

// In a real app, this would come from a database or a configuration file.
const templates: PassTemplate[] = [
  {
    id: 'modern-badge',
    name: 'Modern Badge',
    description: 'A sleek and modern design for conferences and corporate events.',
    previewImageUrl: '/assets/templates/sources/modern-badge.png',
    sourceFilePath: path.join(__dirname, '..', 'assets', 'templates', 'sources', 'modern-badge.png'),
    defaultLayout: {
      elements: [
        { id: 'event_name', text: '{eventName}', x: 30, y: 50, font: 'Arial', size: 40, color: '#FFFFFF', bold: true },
        { id: 'guest_name', text: '{guestName}', x: 30, y: 120, font: 'Arial', size: 28, color: '#FFFFFF' },
        { id: 'guest_role', text: '{guestRole}', x: 30, y: 160, font: 'Arial', size: 20, color: '#DDDDDD' },
      ],
      qr_code_position: { x: 350, y: 80, size: 180 },
    },
  },
  {
    id: 'classic-invitation',
    name: 'Classic Invitation',
    description: 'A timeless and elegant design for formal events.',
    previewImageUrl: '/assets/templates/sources/classic-invitation.png',
    sourceFilePath: path.join(__dirname, '..', 'assets', 'templates', 'sources', 'classic-invitation.png'),
    defaultLayout: {
      elements: [
        { id: 'title', text: 'YOU ARE INVITED!', x: 140, y: 50, font: 'Georgia', size: 18, color: '#B14A0E', bold: true },
        { id: 'names', text: '{guestName}', x: 100, y: 180, font: 'Dancing Script', size: 42, color: '#C65C1D' },
        { id: 'address', text: '{address}', x: 120, y: 420, font: 'Arial', size: 18, color: '#333333' }
      ],
      qr_code_position: { x: 350, y: 80, size: 180 },
    },
  },
  {
    id: 'floral-peach',
    name: 'Floral Peach',
    description: 'A beautiful floral design with peach tones.',
    previewImageUrl: '/assets/templates/sources/floral-peach.png',
    sourceFilePath: path.join(__dirname, '..', 'assets', 'templates', 'sources', 'floral-peach.png'),
    defaultLayout: {
      elements: [
        { id: 'event_name', text: '{eventName}', x: 100, y: 150, font: 'Garamond', size: 55, color: '#4a4a4a' },
        { id: 'guest_name', text: '{guestName}', x: 100, y: 250, font: 'Garamond', size: 35, color: '#6b6b6b' },
      ],
      qr_code_position: { x: 225, y: 400, size: 150 },
    },
  },
];

@Injectable()
export class PassTemplateService {
  private readonly logger = new Logger(PassTemplateService.name);
  private backendUrl: string;

  constructor(private configService: ConfigService) {
    // Temporarily hardcode for testing
    this.backendUrl = 'http://localhost:3001';
    console.log('PassTemplateService - Backend URL (hardcoded):', this.backendUrl);
  }

  /**
   * Returns a list of all available pass templates with full preview URLs.
   */
  async getAvailableTemplates(): Promise<PassTemplate[]> {
    // Hardcode the URLs for testing
    return [
      {
        id: 'modern-badge',
        name: 'Modern Badge',
        description: 'A sleek and modern design for conferences and corporate events.',
        previewImageUrl: 'http://localhost:3001/assets/templates/sources/modern-badge.png',
        sourceFilePath: path.join(__dirname, '..', 'assets', 'templates', 'sources', 'modern-badge.png'),
        defaultLayout: {
          elements: [
            { id: 'event_name', text: '{eventName}', x: 30, y: 50, font: 'Arial', size: 40, color: '#FFFFFF', bold: true },
            { id: 'guest_name', text: '{guestName}', x: 30, y: 120, font: 'Arial', size: 28, color: '#FFFFFF' },
            { id: 'guest_role', text: '{guestRole}', x: 30, y: 160, font: 'Arial', size: 20, color: '#DDDDDD' },
          ],
          qr_code_position: { x: 350, y: 80, size: 180 },
        },
      },
      {
        id: 'classic-invitation',
        name: 'Classic Invitation',
        description: 'A timeless and elegant design for formal events.',
        previewImageUrl: 'http://localhost:3001/assets/templates/sources/classic-invitation.png',
        sourceFilePath: path.join(__dirname, '..', 'assets', 'templates', 'sources', 'classic-invitation.png'),
        defaultLayout: {
          elements: [
            { id: 'title', text: 'YOU ARE INVITED!', x: 140, y: 50, font: 'Georgia', size: 18, color: '#B14A0E', bold: true },
            { id: 'names', text: '{guestName}', x: 100, y: 180, font: 'Dancing Script', size: 42, color: '#C65C1D' },
            { id: 'address', text: '{address}', x: 120, y: 420, font: 'Arial', size: 18, color: '#333333' }
          ],
          qr_code_position: { x: 350, y: 80, size: 180 },
        },
      },
      {
        id: 'floral-peach',
        name: 'Floral Peach',
        description: 'A beautiful floral design with peach tones.',
        previewImageUrl: 'http://localhost:3001/assets/templates/sources/floral-peach.png',
        sourceFilePath: path.join(__dirname, '..', 'assets', 'templates', 'sources', 'floral-peach.png'),
        defaultLayout: {
          elements: [
            { id: 'event_name', text: '{eventName}', x: 100, y: 150, font: 'Garamond', size: 55, color: '#4a4a4a' },
            { id: 'guest_name', text: '{guestName}', x: 100, y: 250, font: 'Garamond', size: 35, color: '#6b6b6b' },
          ],
          qr_code_position: { x: 225, y: 400, size: 150 },
        },
      },
    ];
  }

  /**
   * Generates a personalized pass image.
   * This is a placeholder for the full implementation.
   * @param event - The event object with design_config
   * @param guest - The guest for whom the pass is being generated
   * @param qrCodeData - The data to encode in the QR code
   * @returns A buffer containing the generated PNG image
   */
  async generatePass(event: Event, guest: Guest, qrCodeData: string): Promise<Buffer> {
    this.logger.log(`Generating pass for guest ${guest.id} for event ${event.id}`);
    
    const placeholderText = `Pass for ${guest.name}`;
    const svgText = `<svg width="600" height="900"><text x="300" y="450" dominant-baseline="middle" text-anchor="middle" font-size="40">${placeholderText}</text></svg>`;
    
    const placeholderImage = await sharp({ 
        create: {
          width: 600,
          height: 900,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
      .composite([{ input: Buffer.from(svgText) }])
      .png()
      .toBuffer();

    return placeholderImage;
  }
} 