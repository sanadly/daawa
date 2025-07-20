import { Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import { Event } from '../../database/entities/event.entity';
import { Guest } from '../../database/entities/guest.entity';
import { Tier } from '../../database/entities/tier.entity';
import { promises as fs } from 'fs';
import * as path from 'path';
import { JwtService } from '../../auth/services/jwt.service';

export interface PassData {
  event: Event;
  guest: Guest;
  tier: Tier;
  qrCodeData: string;
  passId: string;
  isRTL: boolean;
}

export interface PDFPassOptions {
  format?: 'A4' | 'Letter';
  language?: 'en' | 'ar';
  customStyles?: string;
}

interface CacheEntry {
  template: string;
  timestamp: number;
}

@Injectable()
export class PdfPassService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfPassService.name);
  private browser: puppeteer.Browser | null = null;
  private templateCache = new Map<string, CacheEntry>();
  private readonly TEMPLATE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CONCURRENT_PAGES = 5;
  private readonly PAGE_POOL: puppeteer.Page[] = [];
  private readonly PROCESSING_QUEUE: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Guest)
    private guestRepository: Repository<Guest>,
    @InjectRepository(Tier)
    private tierRepository: Repository<Tier>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Initializing PDF service with browser instance');
      
      // Launch browser with optimized settings
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--memory-pressure-off',
          '--max_old_space_size=4096',
        ],
      });

      // Pre-warm the page pool
      await this.warmPagePool();
      
      // Load and cache template
      await this.loadTemplate();
      
      this.logger.log('PDF service initialization completed');
    } catch (error) {
      this.logger.error('Failed to initialize PDF service', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Destroying PDF service');
      
      // Close all pages in pool
      for (const page of this.PAGE_POOL) {
        if (!page.isClosed()) {
          await page.close();
        }
      }
      
      // Close browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      // Clear template cache
      this.templateCache.clear();
      
      this.logger.log('PDF service destroyed');
    } catch (error) {
      this.logger.error('Error during PDF service destruction', error);
    }
  }

  private async warmPagePool(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    this.logger.log(`Warming page pool with ${this.MAX_CONCURRENT_PAGES} pages`);
    
    for (let i = 0; i < this.MAX_CONCURRENT_PAGES; i++) {
      try {
        const page = await this.browser.newPage();
        
        // Optimize page settings
        await page.setViewport({ width: 794, height: 1123 }); // A4 size
        await page.setDefaultTimeout(30000);
        await page.setDefaultNavigationTimeout(30000);
        
        // Disable unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const resourceType = req.resourceType();
          if (['image', 'stylesheet', 'font'].includes(resourceType)) {
            req.continue();
          } else if (['script', 'xhr', 'fetch'].includes(resourceType)) {
            req.abort();
          } else {
            req.continue();
          }
        });
        
        this.PAGE_POOL.push(page);
      } catch (error) {
        this.logger.warn(`Failed to create page ${i + 1}`, error);
    }
    }
    
    this.logger.log(`Page pool warmed with ${this.PAGE_POOL.length} pages`);
    }

  private async getPage(): Promise<puppeteer.Page> {
    if (this.PAGE_POOL.length > 0) {
      const page = this.PAGE_POOL.pop()!;
      
      // Reset page state
      try {
        await page.goto('about:blank');
        return page;
      } catch (error) {
        this.logger.warn('Failed to reset page, creating new one', error);
        if (!page.isClosed()) {
          await page.close();
        }
      }
    }

    // Create new page if pool is empty or page is corrupted
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    
    const page = await this.browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.setDefaultTimeout(30000);

    return page;
  }

  private async returnPage(page: puppeteer.Page): Promise<void> {
    try {
      if (!page.isClosed() && this.PAGE_POOL.length < this.MAX_CONCURRENT_PAGES) {
        this.PAGE_POOL.push(page);
      } else {
        await page.close();
  }
    } catch (error) {
      this.logger.warn('Error returning page to pool', error);
    }
  }

  private async loadTemplate(): Promise<void> {
    try {
      const templatePath = path.join(
        __dirname,
        '../templates',
        'pass-template.hbs',
      );

      this.logger.log('Looking for template at:', templatePath);

      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      this.templateCache.set('default', {
        template: templateContent,
        timestamp: Date.now(),
      });
      
      this.logger.log('Template loaded and cached');
    } catch (error) {
      this.logger.error('Failed to load template', error);
      throw error;
    }
  }

  private getTemplate(): string {
    const cached = this.templateCache.get('default');
    
    if (!cached) {
      throw new Error('Template not loaded');
    }
    
    // Check if template is expired
    if (Date.now() - cached.timestamp > this.TEMPLATE_CACHE_TTL) {
      this.logger.log('Template cache expired, reloading');
      // Async reload without blocking
      this.loadTemplate().catch(error => 
        this.logger.error('Failed to reload template', error)
      );
    }
    
    return cached.template;
  }

  private async compileTemplate(data: PassData): Promise<string> {
    try {
      const template = this.getTemplate();
      
      // Define RTL styles and labels
      const rtlStyles = data.isRTL ? `
        body { direction: rtl; text-align: right; font-family: 'Amiri', 'Noto Sans Arabic', serif; }
        .header { text-align: center; }
        .event-info { text-align: right; }
        .guest-info { text-align: right; }
        .footer { text-align: center; }
      ` : '';
      
      // Libyan Arabic dialect labels
      const labels = data.isRTL ? {
        eventName: 'اسم الفعالية',
        eventDate: 'تاريخ الفعالية',
        eventLocation: 'مكان الفعالية',
        guestName: 'اسم الضيف',
        tierName: 'نوع البطاقة',
        instructions: 'يرجى إظهار هذه البطاقة عند الوصول للفعالية',
        welcomeMessage: 'أهلاً وسهلاً بكم'
      } : {
        eventName: 'Event Name',
        eventDate: 'Event Date',
        eventLocation: 'Event Location',
        guestName: 'Guest Name',
        tierName: 'Ticket Type',
        instructions: 'Please present this pass at the event entrance',
        welcomeMessage: 'Welcome'
      };

             // Format date based on locale
       const eventDate = data.isRTL 
         ? new Date(data.event.start_datetime).toLocaleDateString('ar-LY', {
             year: 'numeric',
             month: 'long',
             day: 'numeric',
             hour: '2-digit',
             minute: '2-digit'
           })
         : new Date(data.event.start_datetime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
             minute: '2-digit'
           });

      // Replace placeholders
      return template
        .replace(/\{\{rtlStyles\}\}/g, rtlStyles)
        .replace(/\{\{eventNameLabel\}\}/g, labels.eventName)
        .replace(/\{\{eventDateLabel\}\}/g, labels.eventDate)
        .replace(/\{\{eventLocationLabel\}\}/g, labels.eventLocation)
        .replace(/\{\{guestNameLabel\}\}/g, labels.guestName)
        .replace(/\{\{tierNameLabel\}\}/g, labels.tierName)
        .replace(/\{\{instructionsLabel\}\}/g, labels.instructions)
        .replace(/\{\{welcomeMessage\}\}/g, labels.welcomeMessage)
        .replace(/\{\{eventName\}\}/g, data.event.name)
        .replace(/\{\{eventDate\}\}/g, eventDate)
                 .replace(/\{\{eventLocation\}\}/g, data.event.venue_name || 'TBA')
         .replace(/\{\{guestName\}\}/g, data.guest.name)
        .replace(/\{\{tierName\}\}/g, data.tier.name)
        .replace(/\{\{qrCode\}\}/g, data.qrCodeData);
    } catch (error) {
      this.logger.error('Template compilation failed', error);
      throw error;
    }
  }

  private async processWithQueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.PROCESSING_QUEUE.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.PROCESSING_QUEUE.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.PROCESSING_QUEUE.length > 0) {
        const task = this.PROCESSING_QUEUE.shift();
        if (task) {
          await task();
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  async generatePass(guestId: string, eventId: string): Promise<Buffer> {
    return this.processWithQueue(async () => {
      const startTime = Date.now();
      let page: puppeteer.Page | null = null;
      
      try {
        this.logger.log(`Starting PDF generation for guest ${guestId}, event ${eventId}`);
        
        // Get pass data with optimized query
        const passData = await this.getPassData(guestId, eventId);
        
        // Get page from pool
        page = await this.getPage();
        
        // Compile template
        const html = await this.compileTemplate(passData);
        
        // Set content and generate PDF
        await page.setContent(html, { 
          waitUntil: ['domcontentloaded'],
          timeout: 30000 
        });
        
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            bottom: '20px',
            left: '20px',
            right: '20px',
          },
          preferCSSPageSize: true,
        });
        
        const duration = Date.now() - startTime;
        this.logger.log(`PDF generated successfully in ${duration}ms for guest ${guestId}`);
        
                 return Buffer.from(pdf);
        
      } catch (error) {
        this.logger.error(`PDF generation failed for guest ${guestId}`, error);
        throw error;
      } finally {
        if (page) {
          await this.returnPage(page);
        }
      }
    });
        }

  private async getPassData(guestId: string, eventId: string): Promise<PassData> {
    // Optimized query with joins to reduce database calls
    const guest = await this.guestRepository.findOne({
      where: { id: guestId },
      relations: ['event', 'tier'],
    });

    if (!guest) {
      throw new Error(`Guest with ID ${guestId} not found`);
    }

    if (guest.event.id !== eventId) {
      throw new Error(`Guest ${guestId} is not registered for event ${eventId}`);
    }

    // Generate secure QR code token
    const qrCodeToken = await this.jwtService.generateQrCodeToken({
      eventId: guest.event.id,
      guestId: guest.id,
      passId: `${guest.id}-${guest.event.id}`,
    });

    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeToken, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

         // Determine if RTL based on event's primary language
     const isRTL = guest.event.primary_language === 'ar';

    return {
      guest,
      event: guest.event,
      tier: guest.tier,
      qrCodeData: qrCodeDataUrl,
      passId: `${guest.id}-${guest.event.id}`,
      isRTL,
    };
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const pagePoolSize = this.PAGE_POOL.length;
      const queueSize = this.PROCESSING_QUEUE.length;
      const templateCached = this.templateCache.has('default');
      const browserConnected = this.browser?.isConnected() || false;
      
      return {
        status: 'healthy',
        details: {
          browser: browserConnected,
          pagePool: pagePoolSize,
          queueSize,
          templateCached,
          maxConcurrentPages: this.MAX_CONCURRENT_PAGES,
        },
      };
         } catch (error) {
       return {
         status: 'unhealthy',
         details: { error: error instanceof Error ? error.message : 'Unknown error' },
       };
    }
  }
} 