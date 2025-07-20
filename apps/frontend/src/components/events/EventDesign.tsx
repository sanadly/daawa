import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Type, 
  Image, 
  QrCode, 
  Square, 
  Circle, 
  Download,
  Eye,
  Plus,
  Trash2,
  Copy,
  Move,
  RotateCcw,
  Palette,
  Settings
} from 'lucide-react';
import Konva from 'konva';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Circle as KonvaCircle } from 'react-konva';
import api from '@/lib/api';

interface CanvasConfig {
  width: number;
  height: number;
}

interface BaseElement {
  id: string;
  x: number;
  y: number;
  rotation?: number;
  opacity?: number;
}

interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  dynamicField?: string;
}

interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  width: number;
  height: number;
  cornerRadius?: number;
  filters?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    grayscale?: number;
  };
}

interface QRCodeElement extends BaseElement {
  type: 'qrcode';
  data: string;
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle';
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

type DesignElement = TextElement | ImageElement | QRCodeElement | ShapeElement;

interface DesignConfig {
  canvas: CanvasConfig;
  background?: string;
  elements: DesignElement[];
}

interface EventDesignProps {
  eventId: string;
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const STAGE_SCALE = 0.3; // Scale down for display

export default function EventDesign({ eventId }: EventDesignProps) {
  const { t } = useTranslation();
  const stageRef = useRef<Konva.Stage>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [designConfig, setDesignConfig] = useState<DesignConfig>({
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    background: '#ffffff',
    elements: [],
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic field options
  const dynamicFields = [
    { value: '{{guest.name}}', label: 'Guest Name' },
    { value: '{{event.name}}', label: 'Event Name' },
    { value: '{{event.date}}', label: 'Event Date' },
    { value: '{{event.time}}', label: 'Event Time' },
    { value: '{{event.venue}}', label: 'Venue' },
    { value: '{{tier.name}}', label: 'Tier Name' },
    { value: '{{qr.url}}', label: 'QR Code URL' },
  ];

  // Template presets
  const templates = [
    {
      id: 'modern',
      name: 'Modern Badge',
      preview: '/assets/templates/previews/modern-badge.png',
      config: {
        canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
        background: '#1a1a1a',
        elements: [
          {
            id: 'bg-accent',
            type: 'shape' as const,
            shapeType: 'rectangle' as const,
            x: 0,
            y: 0,
            width: CANVAS_WIDTH,
            height: 400,
            fill: '#3b82f6',
          },
          {
            id: 'event-name',
            type: 'text' as const,
            text: '{{event.name}}',
            x: CANVAS_WIDTH / 2,
            y: 150,
            fontSize: 72,
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff',
            align: 'center' as const,
            dynamicField: '{{event.name}}',
          },
          {
            id: 'guest-name',
            type: 'text' as const,
            text: '{{guest.name}}',
            x: CANVAS_WIDTH / 2,
            y: 600,
            fontSize: 96,
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff',
            align: 'center' as const,
            dynamicField: '{{guest.name}}',
          },
          {
            id: 'qr-code',
            type: 'qrcode' as const,
            data: '{{qr.url}}',
            x: CANVAS_WIDTH / 2 - 200,
            y: 1400,
            size: 400,
            foregroundColor: '#000000',
            backgroundColor: '#ffffff',
          },
        ],
      },
    },
    {
      id: 'classic',
      name: 'Classic Invitation',
      preview: '/assets/templates/previews/classic-invitation.png',
      config: {
        canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
        background: '#f8f9fa',
        elements: [
          {
            id: 'border',
            type: 'shape' as const,
            shapeType: 'rectangle' as const,
            x: 50,
            y: 50,
            width: CANVAS_WIDTH - 100,
            height: CANVAS_HEIGHT - 100,
            fill: 'transparent',
            stroke: '#d4af37',
            strokeWidth: 8,
          },
          {
            id: 'event-name',
            type: 'text' as const,
            text: '{{event.name}}',
            x: CANVAS_WIDTH / 2,
            y: 300,
            fontSize: 64,
            fontFamily: 'Times New Roman',
            fontStyle: 'bold',
            fill: '#2c3e50',
            align: 'center' as const,
            dynamicField: '{{event.name}}',
          },
        ],
      },
    },
  ];

  // Get selected element
  const selectedElement = selectedElementId 
    ? designConfig.elements.find(el => el.id === selectedElementId)
    : null;

  // Generate unique ID
  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Update element
  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    setDesignConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  // Add element
  const addElement = (type: DesignElement['type']) => {
    const baseElement = {
      id: generateId(),
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      opacity: 1,
    };

    let newElement: DesignElement;

    switch (type) {
      case 'text':
        newElement = {
          ...baseElement,
          type: 'text',
          text: 'Sample Text',
          fontSize: 48,
          fontFamily: 'Arial',
          fill: '#000000',
          align: 'center',
        } as TextElement;
        break;
      case 'image':
        newElement = {
          ...baseElement,
          type: 'image',
          src: '',
          width: 300,
          height: 200,
        } as ImageElement;
        break;
      case 'qrcode':
        newElement = {
          ...baseElement,
          type: 'qrcode',
          data: 'https://example.com',
          size: 200,
          foregroundColor: '#000000',
          backgroundColor: '#ffffff',
        } as QRCodeElement;
        break;
      case 'shape':
        newElement = {
          ...baseElement,
          type: 'shape',
          shapeType: 'rectangle',
          width: 200,
          height: 100,
          fill: '#3b82f6',
        } as ShapeElement;
        break;
      default:
        return;
    }

    setDesignConfig(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedElementId(newElement.id);
  };

  // Delete element
  const deleteElement = (id: string) => {
    setDesignConfig(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
    }));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Duplicate element
  const duplicateElement = (id: string) => {
    const element = designConfig.elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: generateId(),
        x: element.x + 20,
        y: element.y + 20,
      };
      setDesignConfig(prev => ({
        ...prev,
        elements: [...prev.elements, newElement],
      }));
    }
  };

  // Apply template
  const applyTemplate = (template: typeof templates[0]) => {
    setDesignConfig(template.config);
    setSelectedElementId(null);
  };

  // Generate pass
  const generatePass = async (format: 'png' | 'pdf' = 'png') => {
    setIsGenerating(true);
    try {
      const response = await api.post('/passes/render', {
        eventId,
        format,
        designConfig,
      }, {
        responseType: 'blob',
      });

      // Download the file
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pass.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate pass:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate preview
  const generatePreview = async () => {
    try {
      const response = await api.post('/passes/render/preview', {
        designConfig,
      }, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      // You could display this preview somewhere
      console.log('Preview generated:', url);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel - Tools */}
      <div className="w-80 bg-gray-50 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{t('Design Editor')}</h2>
        </div>

        <Tabs defaultValue="elements" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="elements" className="flex-1 p-4 space-y-4">
            {/* Add Elements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => addElement('text')}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => addElement('image')}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => addElement('qrcode')}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => addElement('shape')}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Shape
                </Button>
              </CardContent>
            </Card>

            {/* Elements List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Layers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {designConfig.elements.map((element, index) => (
                  <div
                    key={element.id}
                    className={`p-2 rounded border cursor-pointer flex items-center justify-between ${
                      selectedElementId === element.id ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => setSelectedElementId(element.id)}
                  >
                    <div className="flex items-center">
                      {element.type === 'text' && <Type className="w-4 h-4 mr-2" />}
                      {element.type === 'image' && <Image className="w-4 h-4 mr-2" />}
                      {element.type === 'qrcode' && <QrCode className="w-4 h-4 mr-2" />}
                      {element.type === 'shape' && <Square className="w-4 h-4 mr-2" />}
                      <span className="text-sm truncate">
                        {element.type === 'text' ? (element as TextElement).text : element.type}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateElement(element.id);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Element Properties */}
            {selectedElement && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Common properties */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={selectedElement.x}
                        onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={selectedElement.y}
                        onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Text-specific properties */}
                  {selectedElement.type === 'text' && (
                    <>
                      <div>
                        <Label className="text-xs">Text</Label>
                        <Textarea
                          value={(selectedElement as TextElement).text}
                          onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Dynamic Field</Label>
                        <Select
                          value={(selectedElement as TextElement).dynamicField || ''}
                          onValueChange={(value) => updateElement(selectedElement.id, { 
                            dynamicField: value,
                            text: value 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {dynamicFields.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Font Size</Label>
                          <Input
                            type="number"
                            value={(selectedElement as TextElement).fontSize}
                            onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Color</Label>
                          <Input
                            type="color"
                            value={(selectedElement as TextElement).fill}
                            onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Alignment</Label>
                        <Select
                          value={(selectedElement as TextElement).align || 'left'}
                          onValueChange={(value) => updateElement(selectedElement.id, { align: value as 'left' | 'center' | 'right' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* QR Code properties */}
                  {selectedElement.type === 'qrcode' && (
                    <>
                      <div>
                        <Label className="text-xs">QR Data</Label>
                        <Input
                          value={(selectedElement as QRCodeElement).data}
                          onChange={(e) => updateElement(selectedElement.id, { data: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Size</Label>
                        <Input
                          type="number"
                          value={(selectedElement as QRCodeElement).size}
                          onChange={(e) => updateElement(selectedElement.id, { size: Number(e.target.value) })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">FG Color</Label>
                          <Input
                            type="color"
                            value={(selectedElement as QRCodeElement).foregroundColor}
                            onChange={(e) => updateElement(selectedElement.id, { foregroundColor: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">BG Color</Label>
                          <Input
                            type="color"
                            value={(selectedElement as QRCodeElement).backgroundColor}
                            onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Shape properties */}
                  {selectedElement.type === 'shape' && (
                    <>
                      <div>
                        <Label className="text-xs">Shape Type</Label>
                        <Select
                          value={(selectedElement as ShapeElement).shapeType}
                          onValueChange={(value) => updateElement(selectedElement.id, { shapeType: value as 'rectangle' | 'circle' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rectangle">Rectangle</SelectItem>
                            <SelectItem value="circle">Circle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Width</Label>
                          <Input
                            type="number"
                            value={(selectedElement as ShapeElement).width || 0}
                            onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height</Label>
                          <Input
                            type="number"
                            value={(selectedElement as ShapeElement).height || 0}
                            onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Fill Color</Label>
                        <Input
                          type="color"
                          value={(selectedElement as ShapeElement).fill || '#000000'}
                          onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="flex-1 p-4 space-y-4">
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-[9/16] bg-gray-100 rounded mb-2 overflow-hidden">
                      <img 
                        src={template.preview} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{template.name}</h3>
                      <Button 
                        size="sm"
                        onClick={() => applyTemplate(template)}
                      >
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Canvas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Background</Label>
                  <Input
                    type="color"
                    value={designConfig.background || '#ffffff'}
                    onChange={(e) => setDesignConfig(prev => ({ ...prev, background: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={designConfig.canvas.width}
                      onChange={(e) => setDesignConfig(prev => ({ 
                        ...prev, 
                        canvas: { ...prev.canvas, width: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={designConfig.canvas.height}
                      onChange={(e) => setDesignConfig(prev => ({ 
                        ...prev, 
                        canvas: { ...prev.canvas, height: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Actions */}
        <div className="p-4 border-t space-y-2">
          <Button 
            className="w-full" 
            onClick={() => generatePreview()}
            variant="outline"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => generatePass('png')}
              disabled={isGenerating}
            >
              <Download className="w-4 h-4 mr-2" />
              PNG
            </Button>
            <Button 
              onClick={() => generatePass('pdf')}
              disabled={isGenerating}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 bg-gray-100 p-8 overflow-auto">
        <div className="flex justify-center">
          <div 
            className="bg-white rounded-lg shadow-lg"
            style={{ 
              width: CANVAS_WIDTH * STAGE_SCALE, 
              height: CANVAS_HEIGHT * STAGE_SCALE 
            }}
          >
            <Stage
              ref={stageRef}
              width={CANVAS_WIDTH * STAGE_SCALE}
              height={CANVAS_HEIGHT * STAGE_SCALE}
              scaleX={STAGE_SCALE}
              scaleY={STAGE_SCALE}
            >
              <Layer>
                {/* Background */}
                <Rect
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  fill={designConfig.background || '#ffffff'}
                />
                
                {/* Elements */}
                {designConfig.elements.map((element) => {
                  const isSelected = selectedElementId === element.id;
                  
                  if (element.type === 'text') {
                    const textEl = element as TextElement;
                    return (
                      <Text
                        key={element.id}
                        x={element.x}
                        y={element.y}
                        text={textEl.text}
                        fontSize={textEl.fontSize}
                        fontFamily={textEl.fontFamily}
                        fill={textEl.fill}
                        align={textEl.align}
                        draggable
                        stroke={isSelected ? '#0066cc' : undefined}
                        strokeWidth={isSelected ? 2 : undefined}
                        onClick={() => setSelectedElementId(element.id)}
                        onDragEnd={(e) => {
                          updateElement(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          });
                        }}
                      />
                    );
                  }
                  
                  if (element.type === 'shape') {
                    const shapeEl = element as ShapeElement;
                    if (shapeEl.shapeType === 'rectangle') {
                      return (
                        <Rect
                          key={element.id}
                          x={element.x}
                          y={element.y}
                          width={shapeEl.width}
                          height={shapeEl.height}
                          fill={shapeEl.fill}
                          stroke={shapeEl.stroke}
                          strokeWidth={shapeEl.strokeWidth}
                          draggable
                          onClick={() => setSelectedElementId(element.id)}
                          onDragEnd={(e) => {
                            updateElement(element.id, {
                              x: e.target.x(),
                              y: e.target.y(),
                            });
                          }}
                        />
                      );
                    } else if (shapeEl.shapeType === 'circle') {
                      return (
                        <KonvaCircle
                          key={element.id}
                          x={element.x + (shapeEl.radius || 50)}
                          y={element.y + (shapeEl.radius || 50)}
                          radius={shapeEl.radius || 50}
                          fill={shapeEl.fill}
                          stroke={shapeEl.stroke}
                          strokeWidth={shapeEl.strokeWidth}
                          draggable
                          onClick={() => setSelectedElementId(element.id)}
                          onDragEnd={(e) => {
                            updateElement(element.id, {
                              x: e.target.x() - (shapeEl.radius || 50),
                              y: e.target.y() - (shapeEl.radius || 50),
                            });
                          }}
                        />
                      );
                    }
                  }
                  
                  return null;
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
} 