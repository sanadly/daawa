import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useColorScheme } from '../utils/colors';

const ColorDemo: React.FC = () => {
  const { t } = useTranslation();
  const { currentScheme, changeScheme } = useColorScheme();

  const schemes = [
    { name: 'green', label: 'Green', description: 'Professional & Trustworthy' },
    { name: 'blue', label: 'Blue', description: 'Reliable & Corporate' },
    { name: 'purple', label: 'Purple', description: 'Creative & Modern' },
    { name: 'orange', label: 'Orange', description: 'Energetic & Friendly' },
    { name: 'teal', label: 'Teal', description: 'Calm & Professional' },
    { name: 'indigo', label: 'Indigo', description: 'Premium & Sophisticated' },
  ] as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Color Scheme Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Click any button below to instantly change the entire app's color scheme. 
            Notice how all buttons, cards, and UI elements update automatically.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {schemes.map((scheme) => (
              <Button
                key={scheme.name}
                variant={currentScheme === scheme.name ? "default" : "outline"}
                onClick={() => changeScheme(scheme.name)}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <div 
                  className="w-8 h-8 rounded-full border-2 border-current"
                  style={{
                    backgroundColor: `hsl(${scheme.name === 'green' ? '158 48% 29%' : 
                                         scheme.name === 'blue' ? '217 91% 60%' :
                                         scheme.name === 'purple' ? '262 83% 58%' :
                                         scheme.name === 'orange' ? '25 95% 53%' :
                                         scheme.name === 'teal' ? '173 58% 39%' :
                                         '238 83% 67%'})`
                  }}
                />
                <div className="text-center">
                  <div className="font-medium">{scheme.label}</div>
                  <div className="text-xs text-muted-foreground">{scheme.description}</div>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Current Scheme: {currentScheme.toUpperCase()}</h4>
            <p className="text-sm text-muted-foreground">
              All colors throughout the app are now using the {currentScheme} color scheme. 
              This includes buttons, cards, sidebar, and all UI elements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorDemo; 