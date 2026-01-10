# Frontend Design Skill

Create distinctive, production-grade frontend interfaces with high design quality. Use this guide when building web components, pages, or applications. Generate creative, polished code that avoids generic AI aesthetics.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work—the key is intentionality, not intensity.

## Implementation Standards

Code must be:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Aesthetics Guidelines

### Typography

Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt for distinctive choices that elevate aesthetics. Pair a distinctive display font with a refined body font.

### Color & Theme

Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

### Motion

Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.

### Spatial Composition

Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.

### Backgrounds & Visual Details

Create atmosphere and depth rather than defaulting to solid colors. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

### Artwork & Cover Previews

When rendering real-world covers (podcast artwork, album art, etc.), prioritize **fidelity** over strict aspect-ratio crops:

- Use a container that centers the image: `flex items-center justify-center` with a subtle border/background.
- Prefer `max-w-full h-auto object-contain` for the `<img>` so the full cover is visible on small screens.
- Avoid forcing `aspect-video` + `object-cover` for covers coming from external feeds; this can crop important parts of the artwork on mobile.
- Test cover previews in narrow viewports (320–400px) to ensure they don't introduce horizontal scroll and the composition still feels editorial.

## Brutalist Form Components (FaviconForge Pattern)

For projects with a brutalist aesthetic, standard UI libraries (like shadcn/ui) provide rounded corners, soft shadows, and subtle borders that conflict with the design system. Create **wrapper components** that enforce brutalist styling while preserving functionality.

### The Wrapper Pattern

Create brutalist components that extend base UI components:

```tsx
import * as React from 'react'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

type InputBrutalistProps = React.ComponentProps<typeof Input>

export function InputBrutalist({ className, ...props }: InputBrutalistProps) {
  return (
    <Input
      {...props}
      className={cn(
        '!bg-white border-4 border-black rounded-none font-bold text-black placeholder:text-gray-600 focus-visible:border-black focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300 focus-visible:outline-offset-0 focus-visible:ring-0 transition-none',
        className
      )}
    />
  )
}
```

### Critical Brutalist Styling Rules

1. **Force Background Colors**: Use `!bg-white` (with `!important`) to override inherited backgrounds from parent containers
   - Without this, inputs may inherit yellow/black backgrounds from brutalist page sections

2. **Thick Borders**: Use `border-4` or `border-8` instead of default `border` (1px)
   - Brutalist aesthetic requires bold, visible borders

3. **No Rounded Corners**: Always use `rounded-none` to override default `rounded-md`
   - Sharp corners are non-negotiable in brutalist design

4. **Double Border Focus State**: Maintain the black border and add a yellow outline
   - `focus-visible:border-black` - keeps the original border
   - `focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300 focus-visible:outline-offset-0` - adds yellow outline layer
   - This creates a brutalist "double border" effect: black (inner) + yellow (outer)

5. **Disable Ring Effects**: Use `focus-visible:ring-0` to remove default shadcn/ui ring styles
   - Brutalist design uses hard borders, not soft glows

6. **No Transitions**: Use `transition-none` to eliminate smooth color/border transitions
   - Brutalist interactions should be immediate and bold, not gradual

### Example Components

**InputBrutalist:**
```tsx
export function InputBrutalist({ className, ...props }: InputBrutalistProps) {
  return (
    <Input
      {...props}
      className={cn(
        '!bg-white border-4 border-black rounded-none font-bold text-black placeholder:text-gray-600 focus-visible:border-black focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300 focus-visible:outline-offset-0 focus-visible:ring-0 transition-none',
        className
      )}
    />
  )
}
```

**TextareaBrutalist:**
```tsx
export function TextareaBrutalist({ className, ...props }: TextareaBrutalistProps) {
  return (
    <Textarea
      {...props}
      className={cn(
        '!bg-white border-4 border-black rounded-none font-bold text-black placeholder:text-gray-600 focus-visible:border-black focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300 focus-visible:outline-offset-0 focus-visible:ring-0 transition-none',
        className
      )}
    />
  )
}
```

**BrutalistButton:**
```tsx
export function BrutalistButton({ className, ...props }: BrutalistButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        'bg-black text-yellow-300 font-black uppercase border-4 border-black rounded-none hover:bg-yellow-300 hover:text-black transition-colors',
        className
      )}
    />
  )
}
```

### When to Create Wrapper Components

- **DO create wrappers** when the base component has styling that conflicts with your design system (rounded corners, soft shadows, subtle borders)
- **DO create wrappers** when you need consistent brutalist styling across multiple forms
- **DON'T create wrappers** for one-off styling - use inline `className` instead
- **DON'T create wrappers** if the base component already matches your aesthetic

### Lessons Learned

1. **Border Disappearing on Focus**: Always specify `focus-visible:border-{color}` to maintain the border color, otherwise it may be overridden by the base component's focus styles

2. **Background Inheritance**: Yellow/black section backgrounds can "bleed through" into form inputs - use `!bg-white` to force the correct background

3. **Outline vs Border**: Use `outline` for the focus state accent instead of changing `border-color`, so you maintain both the structural border and the visual focus indicator

4. **Accessibility**: The yellow outline on focus provides clear visual feedback while maintaining WCAG AA contrast ratios (14.5:1 for yellow on black)

## Anti-Patterns (NEVER Use)

- Generic font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character
- Converging on common choices (Space Grotesk, etc.) across generations

## Execution Principle

Match implementation complexity to the aesthetic vision:

- **Maximalist designs** → Elaborate code with extensive animations and effects
- **Minimalist designs** → Restraint, precision, careful attention to spacing, typography, and subtle details

Elegance comes from executing the vision well. Vary between light and dark themes, different fonts, different aesthetics. No design should be the same.
