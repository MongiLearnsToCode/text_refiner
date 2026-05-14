---
name: Executive Precision
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#44474d'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#4f5f7b'
  primary: '#04162e'
  on-primary: '#ffffff'
  primary-container: '#1a2b44'
  on-primary-container: '#8292b0'
  inverse-primary: '#b6c7e7'
  secondary: '#705c32'
  on-secondary: '#ffffff'
  secondary-container: '#fcdfaa'
  on-secondary-container: '#766237'
  tertiary: '#001634'
  on-tertiary: '#ffffff'
  tertiary-container: '#0f2b50'
  on-tertiary-container: '#7b93be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#b6c7e7'
  on-primary-fixed: '#091c34'
  on-primary-fixed-variant: '#374762'
  secondary-fixed: '#fcdfaa'
  secondary-fixed-dim: '#dec390'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#57441d'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#afc7f5'
  on-tertiary-fixed: '#001b3d'
  on-tertiary-fixed-variant: '#2f476e'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-editor:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-ui:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1280px
  editor-width: 720px
---

## Brand & Style
The design system is engineered for a premium text refinement environment, prioritizing cognitive clarity and professional authority. It adopts a **Corporate / Modern** aesthetic with a heavy lean toward **Minimalism**, ensuring the user's content remains the primary focus while the interface provides a silent, high-end framework.

The emotional response should be one of "Expert Assistance"—an interface that feels like a bespoke tailoring service for prose. It avoids trendy flourishes in favor of precision, utilizing generous whitespace and a restrained color palette to evoke a sense of calm, intellectual rigor, and institutional trust.

## Colors
The palette is anchored in a deep **Executive Navy** (#1A2B44) and **Charcoal Grays**, providing a grounded, professional foundation. **Refined Gold** (#B89F6F) is used sparingly as a focus accent for premium features or "refined" states, while **Executive Blue** (#4A628A) serves as the primary action color.

Backgrounds utilize a curated **Off-White** (#FCFCFC) to significantly reduce eye strain during long editing sessions, offering a softer contrast than pure white. Neutral tones are cool-leaning to maintain a crisp, modern feel.

## Typography
This design system employs a sophisticated dual-font strategy. **Inter** handles the functional UI layer—navigation, buttons, and sidebars—providing a utilitarian, "system" feel that implies reliability. 

For the core value proposition—the text itself—**Source Serif 4** is used. This serif choice emphasizes "literary quality" and "editorial precision." The line height for body text is intentionally generous (1.6x) to facilitate proofreading. Use `label-caps` for section headers in sidebars to maintain an organized, archival look.

## Layout & Spacing
The layout follows a **Fixed Grid** model for the central writing experience to prevent line lengths from becoming unreadable on wide displays. The "Editor Canvas" is restricted to a maximum width of 720px, centered within the application shell.

Sidebars for tools and refinement suggestions use a fluid width with a minimum of 280px. Spacing follows a strict 4px baseline grid. Large, open margins (40px on desktop) are mandatory to maintain the premium, uncluttered feel. Elements are grouped using whitespace rather than lines whenever possible to reduce visual noise.

## Elevation & Depth
Depth is communicated through **Ambient Shadows** and **Tonal Layers**. Instead of heavy borders, use a very soft, diffused shadow (Blur: 12px, Y: 4px, Opacity: 4%) for floating panels or cards. 

Surface tiers are defined by subtle shifts in background color:
- **Level 0 (Base):** #FCFCFC (Main canvas)
- **Level 1 (Navigation/Sidebars):** #F8F9FA (Subtle contrast)
- **Level 2 (Popovers/Modals):** #FFFFFF (Pure white with soft shadow)

Active states for input fields should use a 1px border in Executive Blue, while inactive states should use a low-contrast 1px border in a light silver-gray.

## Shapes
The shape language is conservative and precise. A **Soft** (4-6px) corner radius is applied to buttons, input fields, and cards. This slight rounding takes the "edge" off the professional atmosphere without making it feel overly casual or "app-like." 

Interactive elements like chips for grammar suggestions should use a slightly higher radius (8px) to distinguish them from structural layout components, but true pill shapes should be avoided to maintain the architectural integrity of the design.

## Components

### Buttons
Primary buttons use the Executive Navy background with white text. Secondary buttons use a transparent background with a 1px Executive Blue border. Tertiary buttons are text-only with 500 weight. Use subtle transitions (200ms ease) on hover states.

### Input Fields
Fields should have a minimum height of 40px. Use `body-ui` typography for labels and placeholder text. The focus state is a 1px Executive Blue border with a 2px soft blue outer glow (30% opacity).

### Suggestion Cards (Refinement)
These cards are the most critical component. They use a pure white background, a 1px light gray border, and a 4px corner radius. A subtle gold vertical accent bar on the left indicates a "Premium Refinement" suggestion.

### Progress & Status
Use a slim (2px) progress bar for "Analyzing" states. The color should be a subtle silver that fills with Executive Blue. 

### Iconography
Use thin-stroke (1.5pt) line icons. Icons should be monochrome (Charcoal Gray) and only take on the primary color when active or hovered.