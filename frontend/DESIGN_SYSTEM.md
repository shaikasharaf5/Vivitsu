# FixMyCity Design System

## 🎨 Color Palette

### Primary Colors
- **Blue**: #2563EB (Primary actions, links)
- **Dark Blue**: #1E40AF (Hover states)
- **Light Blue**: #DBEAFE (Backgrounds, highlights)

### Status Colors
- **Success Green**: #10B981
- **Warning Yellow**: #F59E0B
- **Error Red**: #EF4444
- **Info Blue**: #3B82F6

### Issue Status Colors
- REPORTED: #F59E0B (Yellow)
- ASSIGNED: #3B82F6(Blue)
- IN_PROGRESS: #8B5CF6 (Purple)
- COMPLETED: #10B981 (Green)
- RESOLVED: #059669 (Dark Green)
- REJECTED: #EF4444 (Red)

### Category Colors
- ROADS: #EF4444 (Red)
- UTILITIES: #F59E0B (Orange)
- PARKS: #10B981 (Green)
- TRAFFIC: #3B82F6 (Blue)
- SANITATION: #8B5CF6 (Purple)
- HEALTH: #EC4899 (Pink)
- OTHER: #6B7280 (Gray)

## 📏 Spacing Scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

## 🔤 Typography

### Font Family
- Primary: Inter, system-ui, sans-serif

### Font Sizes
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- 3xl: 1.875rem (30px)
- 4xl: 2.25rem (36px)

### Font Weights
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## 🎯 Component Patterns

### Cards
```jsx
// Standard Card
<div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
  {/* Content */}
</div>

// Status Card with Border
<div className="bg-white rounded-xl border-2 border-blue-200 p-6">
  {/* Content */}
</div>
```

### Buttons
```jsx
// Primary Button
<button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 transition-all">
  Button Text
</button>

// Secondary Button
<button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all">
  Button Text
</button>

// Outline Button
<button className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all">
  Button Text
</button>
```

### Status Badges
```jsx
// Issue Status
<span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
  REPORTED
</span>

<span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
  ASSIGNED
</span>

<span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
  RESOLVED
</span>
```

### Form Inputs
```jsx
// Text Input
<input className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />

// Select Dropdown
<select className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
  <option>Select option</option>
</select>

// Textarea
<textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" rows="4" />
```

### Stats Cards
```jsx
<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
  <div className="flex items-center justify-between mb-4">
    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
      <Icon className="h-6 w-6" />
    </div>
    <span className="text-sm font-medium opacity-90">+12.5%</span>
  </div>
  <div className="text-3xl font-bold mb-1">1,234</div>
  <div className="text-blue-100 text-sm">Total Issues</div>
</div>
```

### Navigation Header
```jsx
<header className="bg-white border-b border-gray-200 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-blue-600" />
        <span className="text-xl font-bold text-gray-900">FixMyCity</span>
      </div>
      {/* Nav Items */}
      {/* User Menu */}
    </div>
  </div>
</header>
```

## 📱 Responsive Breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

## 🎭 Animation Classes
```css
.fade-in { animation: fadeIn 0.3s ease-in; }
.slide-up { animation: slideUp 0.3s ease-out; }
.scale-in { animation: scaleIn 0.2s ease-out; }
```

## 🖼️ Layout Patterns

### Dashboard Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Stat cards */}
</div>
```

### Two Column Layout
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div>
    {/* Sidebar */}
  </div>
</div>
```

### Issue Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {issues.map(issue => (
    <IssueCard key={issue.id} issue={issue} />
  ))}
</div>
```

## 🎨 Government/Tech Dashboard Inspiration

### Design Principles
1. **Clean & Professional**: Minimal decoration, focus on data
2. **Hierarchy**: Clear visual hierarchy with typography and spacing
3. **Accessibility**: High contrast, readable fonts, keyboard navigation
4. **Data Visualization**: Charts, graphs, progress bars for metrics
5. **Status Indicators**: Color-coded badges and icons
6. **Card-Based**: Group related content in cards
7. **Responsive**: Mobile-first approach
8. **Consistent**: Reusable components with design tokens

### Key Features
- Split-screen auth pages (branding left, form right)
- Sticky headers with breadcrumbs
- Floating action buttons
- Toast notifications
- Modal dialogs
- Dropdown menus
- Tab navigation
- Search bars with filters
- Data tables with sorting/pagination
- Map integration (Leaflet)
- Image galleries
- Progress indicators
- Empty states
- Loading skeletons
