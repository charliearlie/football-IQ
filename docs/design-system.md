Football Quiz Design System Guide
Core Design Principles

1. Vibrant & Engaging

Use high-contrast colors that pop, especially in dark mode
Neon green (primary) is our signature color for CTAs and success states
Electric blue (accent) for interactive elements and highlights
Gold (chart-3) for premium/special features
PRIMARY BUTTONS MUST USE GRADIENTS - Never flat colors for CTAs

2. Game-First UI

Card-based layouts with subtle gradients and shadows
Smooth transitions (200ms default) for all interactions
Focus states with 2px primary color outlines
Rounded corners (8px default via --radius)
Hover effects that include transform and shadow changes

3. Typography Hierarchy

Use text-foreground for primary text
Use muted-foreground for secondary information
Apply text-gradient class for special headings
Keep body text readable with proper contrast ratios

Color Usage Guidelines
Primary Actions & Success
jsx// PRIMARY BUTTONS - Always use gradient!
<Button className="btn-gradient-primary">
Play Now
</Button>

// Or manually with shadcn/ui
<Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[0_8px_24px_rgba(0,255,135,0.3)] hover:-translate-y-0.5 transition-all duration-300">
Play Now
</Button>
Secondary/Premium Features
jsx// Premium badges, secondary buttons
<Badge className="bg-secondary text-secondary-foreground">
Premium
</Badge>

// Outline buttons for secondary actions
<Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
View Leaderboard
</Button>
Interactive Elements
jsx// Links, hover states, focus rings
<Card className="border-border hover:border-primary transition-colors">
// Content
</Card>
Error/Wrong Answers
jsx// Error messages, incorrect answers
<Alert className="border-destructive/50 text-destructive">
Wrong answer!
</Alert>
Button Hierarchy

1. Primary CTA (Gradient - REQUIRED)
   jsx// Main actions: Play, Submit Answer, Continue
   <Button className="btn-gradient-primary">
   Play Now
   </Button>
2. Secondary Actions (Outline)
   jsx// Secondary actions: View stats, settings
   <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
   View Stats
   </Button>
3. Premium/Special (Gold Gradient)
   jsx// Premium features, achievements
   <Button className="bg-gradient-to-r from-chart-3 to-yellow-500 text-primary-foreground hover:shadow-[0_8px_24px_rgba(255,215,0,0.3)] hover:-translate-y-0.5 transition-all duration-300">
   Go Premium
   </Button>
4. Ghost/Tertiary
jsx// Less important actions
<Button variant="ghost" className="text-muted-foreground hover:text-foreground">
Skip
</Button>
Component Styling Patterns
Game Cards
jsx<Card className="bg-card gradient-card-dark border-border hover:border-primary hover:glow-primary transition-all duration-300">
<CardHeader>
<div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center mb-3">
{/_ Icon _/}
</div>
<CardTitle>Career Path</CardTitle>
<CardDescription className="text-muted-foreground">
Guess the player from their career
</CardDescription>
</CardHeader>
<CardContent>
<Button className="btn-gradient-primary w-full">
Play Now
</Button>
</CardContent>
</Card>
Input Fields
jsx<Input 
  className="bg-input border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
  placeholder="Enter player name..."
/>
Score/Points Display
jsx<div className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-3 rounded-lg font-bold text-2xl">
{points} pts
</div>
Timer Component
jsx<div className="bg-card border border-border rounded-lg p-4">
  <div className="text-muted-foreground text-sm">Time Remaining</div>
  <div className="text-3xl font-bold text-primary animate-pulse-slow">
    {timeRemaining}
  </div>
</div>
Animated Elements
jsx// For timers, point counters
<div className="text-primary text-2xl font-bold animate-pulse-slow">
  {points}
</div>

// For floating badges/achievements

<div className="animate-float">
  <Badge className="bg-gradient-to-r from-chart-3 to-yellow-500">
    New Record!
  </Badge>
</div>

// Success animation

<div className="animate-bounce">
  <CheckCircle className="w-16 h-16 text-primary" />
</div>
Dark Mode Considerations

Dark mode uses a deep blue-tinted background (oklch(0.1 0.01 250))
Cards are slightly lighter than the background for depth
Primary green becomes more neon/vibrant in dark mode
All interactive elements should have higher contrast
Gradients become more vibrant in dark mode

Mobile-First Approach

Touch targets minimum 44x44px
Use gap-4 or larger for spacing between interactive elements
Full-width buttons on mobile
Bottom sheets for mobile navigation
Swipe gestures for card reveals

Special Effects
Gradient Utilities

.gradient-primary - Green to blue gradient for headers/backgrounds
.btn-gradient-primary - Button-specific gradient with hover effects
.gradient-gold - Gold gradient for premium/special content
.text-gradient - Apply gradient to text

Glow Effects

.glow-primary - Green glow for success states
.glow-accent - Blue glow for active elements

Layout Patterns
Game Grid
jsx<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{games.map(game => (
<Card key={game.id} className="hover:border-primary transition-all">
{/_ Game card content _/}
</Card>
))}

</div>
Match Card Layout
jsx<div className="bg-card rounded-xl p-6 border border-border">
  <div className="flex items-center justify-between mb-6">
    <div className="text-center flex-1">
      <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-3xl">
        🔴
      </div>
      <h3 className="font-bold">Arsenal</h3>
    </div>
    
    <div className="px-8">
      <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-3 rounded-lg">
        <span className="text-3xl font-bold">5 - 0</span>
      </div>
    </div>
    
    <div className="text-center flex-1">
      <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-3xl">
        🔵
      </div>
      <h3 className="font-bold">Chelsea</h3>
    </div>
  </div>
</div>
Animation Guidelines

Use transition-all duration-300 for hover states
Apply animate-pulse-slow for drawing attention
Use animate-float for achievement popups
Button hover: -translate-y-0.5 for lift effect
Card hover: -translate-y-1 for larger components
Framer Motion for complex animations (reveals, page transitions)

Accessibility

Always maintain WCAG AA contrast ratios
Focus states are clearly visible with 2px outlines
Use semantic HTML and ARIA labels
Provide keyboard navigation for all interactions
Ensure touch targets are minimum 44x44px
Include screen reader announcements for game state changes

Do's and Don'ts
DO:

✅ Use gradient buttons for all primary CTAs
✅ Add hover animations to interactive elements
✅ Use the glow effects for success states
✅ Maintain consistent spacing with Tailwind utilities
✅ Use card-based layouts for game content

DON'T:

❌ Use flat colors for primary buttons
❌ Skip hover states on interactive elements
❌ Use pure black/white - use the color scale
❌ Make touch targets smaller than 44px
❌ Forget transition animations

This design system creates an engaging, modern football quiz experience that feels premium and game-like while maintaining excellent usability across all devices.
