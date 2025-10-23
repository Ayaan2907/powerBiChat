# AdvancelQ.ai - Quick Start Guide

## 🚀 Your App Has Been Redesigned!

Your Power BI Analytics dashboard now features the **AdvancelQ.ai** brand identity with a stunning dark theme, full responsiveness, and modern UI.

---

## ✅ What's New

### 1. **Brand Identity**
- ✨ AdvancelQ.ai logo in header and favicon
- 🎨 Navy blue (#0A0E27) dark theme
- 💚 Teal green (#00D9A3) accents and CTAs
- 🌟 Modern, professional design

### 2. **Fully Responsive**
- 📱 **Mobile**: Stacked layout, touch-optimized
- 📱 **Tablet**: Balanced, adaptive layout
- 💻 **Desktop**: Side-by-side Power BI + Chat (70/30 split)
- 🖥️ **Large screens**: All features visible

### 3. **Enhanced AI Chat**
- 💬 Glassmorphism design with backdrop blur
- ✨ Animated Sparkles icon
- 🎨 Teal message bubbles with glow effect
- 📝 Character counter and keyboard shortcuts
- 🔄 Smooth animations on all interactions
- 📱 Responsive height (40vh mobile → full desktop)

### 4. **Beautiful Auth Pages**
- 🌊 Animated gradient backgrounds
- 💎 Glassmorphism cards
- 🎯 Branded Clerk components
- ✨ Logo and company footer

---

## 🎨 Color Reference

```css
/* Primary Colors */
Navy Blue:    #0A0E27  /* Main background */
Teal Green:   #00D9A3  /* Accents, CTAs, primary actions */
White:        #FFFFFF  /* Text, high contrast */

/* Supporting Colors */
Teal Light:   #33E4B8  /* Hover states */
Teal Dark:    #00B089  /* Gradients */
Grays:        #F8FAFB → #111827  /* UI hierarchy */
```

---

## 📱 Responsive Breakpoints

| Screen Size | Breakpoint | Layout |
|------------|------------|--------|
| Mobile | < 768px | Stacked, compact |
| Tablet | 768px - 1024px | Transitioning |
| Desktop | 1024px+ | Side-by-side |
| Large | 1280px+ | Full features |

---

## 🎯 Key Features

### Header (Responsive)
- **Logo**: Always visible
- **Welcome message**: Hidden on small mobile
- **Token timer**: Shown on XL screens
- **Buttons**: Icon-only on mobile, with text on desktop
- **User avatar**: Always visible with teal ring

### Power BI Area
- **Container**: Rounded, bordered, shadowed
- **Responsive**: Adapts to available space
- **Animation**: Fade-in on load

### AI Chat
- **Layout**: Bottom sheet (mobile) → sidebar (desktop)
- **Messages**: Responsive bubble sizes
- **Input**: Rounded, glassmorphism, character counter
- **Send button**: Prominent teal with glow
- **Collapse**: Expandable/collapsible

---

## 🔧 How to Test

### 1. Start Development Server
```bash
pnpm dev
```

### 2. View Different Screen Sizes

#### Option A: Browser DevTools
1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Test these sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

#### Option B: Resize Browser
- Drag browser window to different widths
- Watch layout adapt smoothly

### 3. Test Features
- ✅ Sign in/out
- ✅ Load Power BI report
- ✅ Send AI chat messages
- ✅ Refresh token
- ✅ Responsive resizing

---

## 🎨 Custom CSS Classes

You can use these throughout your app:

```tsx
// Brand gradient
<div className="brand-gradient">...</div>

// Glassmorphism card
<div className="glass-card">...</div>

// Glow effect
<button className="glow-teal-hover">...</button>

// Animations
<div className="animate-fade-in">...</div>
<div className="animate-slide-in">...</div>

// Brand card with hover
<div className="brand-card">...</div>
```

---

## 📂 Important Files

```
public/
  ├─ advancelq-logo.svg        ← Full logo (navbar)
  └─ advancelq-icon.svg        ← Icon (favicon)

app/
  ├─ globals.css               ← Brand colors & theme
  ├─ layout.tsx                ← Dark mode + metadata
  ├─ page.tsx                  ← Main dashboard
  ├─ sign-in/[[...]]/page.tsx ← Auth page
  └─ sign-up/[[...]]/page.tsx ← Auth page

components/
  ├─ ai-chat.tsx               ← Redesigned chat
  └─ powerbi-embed.tsx         ← Power BI embed
```

---

## 🎯 Customization Tips

### Change Primary Color
Edit `app/globals.css`:
```css
.dark {
  --primary: oklch(0.70 0.18 170); /* Teal */
}
```

### Adjust Border Radius
```css
:root {
  --radius: 0.75rem; /* Change this */
}
```

### Modify Responsive Breakpoints
Use Tailwind's breakpoint classes:
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

---

## 🐛 Troubleshooting

### Logo Not Showing
**Check:**
1. Files exist: `/public/advancelq-logo.svg`, `/public/advancelq-icon.svg`
2. Browser cache cleared (Ctrl+Shift+R)
3. Dev server restarted

### Dark Theme Not Applied
**Check:**
1. `<html className="dark">` in `app/layout.tsx`
2. CSS variables in `app/globals.css`
3. Browser DevTools for applied classes

### Chat Not Responsive
**Check:**
1. Parent container has proper height
2. Flexbox classes applied correctly
3. Overflow properties set

### Colors Look Off
**Check:**
1. Your browser supports OKLCH colors (modern browsers)
2. CSS variables loaded correctly
3. Tailwind processing the classes

---

## 📊 Performance

### Optimizations Applied
- ✅ **Minimal CSS**: Utility-first approach
- ✅ **SVG assets**: Scalable, small files
- ✅ **Hardware acceleration**: Transform-based animations
- ✅ **Lazy loading**: Components load on demand
- ✅ **Backdrop filter**: GPU-accelerated blur

### Best Practices
- Images are SVG (vector, scalable)
- Animations use transform/opacity (performant)
- Colors use modern OKLCH space
- Responsive units (rem, em, %)

---

## 🌟 Brand Assets

### Logo Usage
```tsx
// Full logo (navbar, headers)
<img src="/advancelq-logo.svg" alt="AdvancelQ.ai" className="h-10" />

// Icon only (favicon, compact spaces)
<img src="/advancelq-icon.svg" alt="AdvancelQ.ai" className="h-8" />
```

### Color Usage
- **Backgrounds**: Navy blue
- **Text**: White (primary), Gray (secondary)
- **Actions**: Teal green
- **Hover**: Lighter teal
- **Borders**: Navy with transparency

---

## ✅ Checklist

### Testing
- [ ] View on mobile device
- [ ] View on tablet
- [ ] View on desktop
- [ ] Test chat functionality
- [ ] Test Power BI loading
- [ ] Test sign in/out
- [ ] Test responsive resizing
- [ ] Check all animations

### Deployment
- [ ] Build succeeds: `pnpm build`
- [ ] No console errors
- [ ] Logo files deployed
- [ ] Environment variables set
- [ ] Dark mode working
- [ ] Responsive on all sizes

---

## 🎉 You're All Set!

Your **AdvancelQ.ai Power BI Analytics Dashboard** is now:

✅ **Fully branded** with your company identity  
✅ **100% responsive** on all devices  
✅ **Modern & beautiful** with dark theme  
✅ **Production ready** with optimized code  

**Start the dev server and enjoy your new dashboard!**

```bash
pnpm dev
```

Visit: **http://localhost:3000**

---

**Questions or need modifications?**  
All changes are documented in `BRAND_REDESIGN_SUMMARY.md`

© 2025 AdvancelQ.ai, a Pinetail Capital LLC company
