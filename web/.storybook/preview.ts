import React from 'react';
import type { Preview } from '@storybook/react';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: 'rgb(255 255 255 / 1)' },
        { name: 'dark', value: 'rgb(15 23 42 / 1)' },
      ],
    },
    a11y: {
      element: '#storybook-root',
      config: {
        rules: [
          {
            id: 'color-contrast',
            reviewOnFail: true,
          },
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    dynamicType: {
      name: 'Dynamic Type',
      description: 'Font scaling percentage',
      defaultValue: 100,
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 100, title: '100%' },
          { value: 110, title: '110%' },
          { value: 120, title: '120%' },
          { value: 130, title: '130%' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? 'light';
      const dynamicScale = Number(context.globals.dynamicType ?? 100);
      const style: React.CSSProperties = {
        ['--dynamic-type-scale' as string]: dynamicScale / 100,
      };

      const themeClass = theme === 'dark' ? 'dark' : '';

      return (
        <div className={themeClass} data-mode={theme} style={style}>
          <div className="min-h-screen bg-background text-foreground">
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;
