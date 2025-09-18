import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import '../app/globals.css';

const colorTokens = [
  { name: 'Background', token: '--background', foreground: '--foreground' },
  { name: 'Card', token: '--card', foreground: '--card-foreground' },
  { name: 'Primary', token: '--primary', foreground: '--primary-foreground' },
  { name: 'Secondary', token: '--secondary', foreground: '--secondary-foreground' },
  { name: 'Accent', token: '--accent', foreground: '--accent-foreground' },
  { name: 'Success', token: '--success', foreground: '--success-foreground' },
  { name: 'Warning', token: '--warning', foreground: '--warning-foreground' },
  { name: 'Destructive', token: '--destructive', foreground: '--destructive-foreground' },
  { name: 'Muted', token: '--muted', foreground: '--muted-foreground' },
];

const spacingTokens = [
  { name: 'Spacing 2', className: 'h-3 w-20', token: '8px' },
  { name: 'Spacing 3', className: 'h-3 w-24', token: '12px' },
  { name: 'Spacing 4', className: 'h-3 w-28', token: '16px' },
  { name: 'Spacing 5', className: 'h-3 w-32', token: '20px' },
  { name: 'Spacing 6', className: 'h-3 w-36', token: '24px' },
  { name: 'Spacing 8', className: 'h-3 w-40', token: '32px' },
  { name: 'Spacing 10', className: 'h-3 w-44', token: '40px' },
  { name: 'Spacing 12', className: 'h-3 w-48', token: '48px' },
];

const radiiTokens = [
  { name: 'Radius sm', radius: 'var(--radius-sm)' },
  { name: 'Radius md', radius: 'var(--radius-md)' },
  { name: 'Radius lg', radius: 'var(--radius-lg)' },
];

type TokensStoryProps = {
  sections?: Array<'colors' | 'spacing' | 'radii' | 'typography' | 'shadows'>;
};

const meta: Meta<TokensStoryProps> = {
  title: 'Design System/Tokens',
  parameters: {
    layout: 'fullscreen',
    options: { showPanel: true },
  },
  args: {
    sections: ['colors', 'typography', 'spacing', 'radii', 'shadows'],
  },
};

export default meta;

type Story = StoryObj<TokensStoryProps>;

function ColorSwatch({ name, token, foreground }: (typeof colorTokens)[number]) {
  const surfaceStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(${token}) / 1)` as string,
    color: `rgb(var(${foreground}) / 1)` as string,
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border shadow-sm">
      <div className="border-b border-border px-4 py-3 text-caption font-medium uppercase tracking-wide text-muted-foreground">
        {name}
      </div>
      <div className="flex h-28 flex-col items-center justify-center gap-1 px-4" style={surfaceStyle}>
        <span className="text-body font-medium">{token.replace('--', '')}</span>
        <span className="text-caption opacity-80">{`rgb(var(${token}))`}</span>
      </div>
    </div>
  );
}

function TypographyPreview() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2 rounded-lg border border-border bg-card/70 p-6 shadow-sm">
        <p className="text-caption uppercase text-muted-foreground">Display</p>
        <p className="text-display font-semibold">Compose effortlessly.</p>
        <p className="text-caption text-muted-foreground">28px / 32px</p>
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-card/70 p-6 shadow-sm">
        <div>
          <p className="text-caption uppercase text-muted-foreground">Title</p>
          <p className="text-title font-semibold">Queue insights update</p>
          <p className="text-caption text-muted-foreground">20px / 24px</p>
        </div>
        <div>
          <p className="text-caption uppercase text-muted-foreground">Body</p>
          <p className="text-body text-muted-foreground">
            All base copy respects dynamic type scaling up to 130% while preserving line-height rhythm.
          </p>
        </div>
        <div>
          <p className="text-caption uppercase text-muted-foreground">Caption</p>
          <p className="text-caption text-muted-foreground/80">Last synchronized 2 minutes ago</p>
        </div>
      </div>
    </div>
  );
}

function ShadowsPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-6 text-caption shadow-sm">shadow-sm</div>
      <div className="rounded-lg border border-border bg-card p-6 text-caption shadow-md">shadow-md</div>
      <div className="rounded-lg border border-border bg-card p-6 text-caption shadow-lg">shadow-lg</div>
    </div>
  );
}

function SpacingPreview() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {spacingTokens.map(({ name, className, token }) => (
        <div key={name} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-caption shadow-sm">
          <div className={`bg-primary/20 ${className}`} />
          <div>
            <p className="font-medium text-body text-foreground">{name}</p>
            <p className="text-caption text-muted-foreground">{token}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RadiiPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {radiiTokens.map(({ name, radius }) => (
        <div
          key={name}
          className="flex h-28 items-center justify-center border border-border bg-card text-body shadow-sm"
          style={{ borderRadius: radius }}
        >
          {name}
        </div>
      ))}
    </div>
  );
}

const TokensTemplate: React.FC<TokensStoryProps> = ({ sections = ['colors', 'typography', 'spacing', 'radii', 'shadows'] }) => (
  <div className="min-h-screen bg-background px-6 py-10 text-foreground">
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <header>
        <p className="text-caption uppercase tracking-wide text-muted-foreground">Design Language</p>
        <h1 className="text-display font-semibold">Foundation tokens</h1>
        <p className="mt-2 max-w-2xl text-body text-muted-foreground">
          Tokens power theme-aware components. Flip the global toolbar to inspect light/dark and dynamic type scaling up to 130%.
        </p>
      </header>

      {sections.includes('colors') && (
        <section className="space-y-4">
          <h2 className="text-title font-semibold text-foreground">Color palette</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {colorTokens.map((token) => (
              <ColorSwatch key={token.name} {...token} />
            ))}
          </div>
        </section>
      )}

      {sections.includes('typography') && (
        <section className="space-y-4">
          <h2 className="text-title font-semibold text-foreground">Typography scale</h2>
          <TypographyPreview />
        </section>
      )}

      {sections.includes('spacing') && (
        <section className="space-y-4">
          <h2 className="text-title font-semibold text-foreground">Spacing</h2>
          <SpacingPreview />
        </section>
      )}

      {sections.includes('radii') && (
        <section className="space-y-4">
          <h2 className="text-title font-semibold text-foreground">Radii</h2>
          <RadiiPreview />
        </section>
      )}

      {sections.includes('shadows') && (
        <section className="space-y-4">
          <h2 className="text-title font-semibold text-foreground">Shadows</h2>
          <ShadowsPreview />
        </section>
      )}
    </div>
  </div>
);

export const Foundation: Story = {
  render: (args: TokensStoryProps) => <TokensTemplate {...args} />,
};

