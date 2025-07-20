import React from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useColorScheme, COLOR_SCHEMES } from '../utils/colors';

interface ColorSchemeSwitcherProps {
  className?: string;
}

const ColorSchemeSwitcher: React.FC<ColorSchemeSwitcherProps> = ({ className }) => {
  const { t } = useTranslation();
  const { currentScheme, changeScheme, setCustomColor, availableSchemes } = useColorScheme();

  const handleSchemeChange = (scheme: keyof typeof COLOR_SCHEMES) => {
    changeScheme(scheme);
  };

  const handleCustomColor = () => {
    // Example: Set to a custom purple color
    setCustomColor(280, 70, 50);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {t('settings.colorScheme')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {availableSchemes.map((scheme) => (
            <Button
              key={scheme}
              variant={currentScheme === scheme ? "default" : "outline"}
              size="sm"
              onClick={() => handleSchemeChange(scheme as keyof typeof COLOR_SCHEMES)}
              className="justify-start"
            >
              <div 
                className="w-4 h-4 rounded-full mr-2"
                style={{
                  backgroundColor: `hsl(${COLOR_SCHEMES[scheme as keyof typeof COLOR_SCHEMES].primary})`
                }}
              />
              {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCustomColor}
          className="w-full"
        >
          <Settings className="w-4 h-4 mr-2" />
          {t('settings.customColor')}
        </Button>
        
        <div className="text-xs text-muted-foreground">
          {t('settings.colorSchemeDescription')}
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorSchemeSwitcher; 