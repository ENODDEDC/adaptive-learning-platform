# 🎨 Course Card Design - Ramotion Style
## Focused Design for Intelevo LMS

---

## 📐 Card Dimensions

```
Width: 380px (min: 300px, max: 420px)
Height: 320px (fixed)
Border Radius: 24px (rounded-3xl)
Border: 2px solid #E5E7EB
Shadow: 0 1px 3px rgba(0,0,0,0.1)
Hover Shadow: 0 10px 25px rgba(0,0,0,0.15)
```

---

## 🎯 Visual Mockup - Student View

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ╔════════════════════════════════════════════════════╗   ┃
┃ ║  🎓                    Introduction to ML      ⭕75%║   ┃ 
┃ ║                                                    ║   ┃ 176px
┃ ║  CS-401                              [STUDENT]    ║   ┃ Color
┃ ║                                                    ║   ┃ Header
┃ ║  ● Active Course                                  ║   ┃
┃ ╚════════════════════════════════════════════════════╝   ┃
┃ ┌────────────────────────────────────────────────────┐   ┃
┃ │ 🎯 Recommended: Visual Learning Mode        85%   │   ┃ 40px
┃ └────────────────────────────────────────────────────┘   ┃ AI Banner
┃ ┌────────────────────────────────────────────────────┐   ┃
┃ │  ⏱️        ✅        📊        🔥                  │   ┃
┃ │  12h      8/12      85%       5                   │   ┃ 72px
┃ │  Time     Done     Score    Streak                │   ┃ Metrics
┃ └────────────────────────────────────────────────────┘   ┃
┃ ┌────────────────────────────────────────────────────┐   ┃
┃ │ 🔔 Quiz 3: Chapter 5                              │   ┃ 32px
┃ │    Due in 2 days • Not started                    │   ┃ Next Up
┃ └────────────────────────────────────────────────────┘   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
Total: 320px height
```

---

## 🎯 Visual Mockup - Creator View

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ╔════════════════════════════════════════════════════╗   ┃
┃ ║  📚                    Introduction to ML      👥24 ║   ┃ 
┃ ║                                                    ║   ┃ 176px
┃ ║  Your Course                          [CREATOR]   ║   ┃ Color
┃ ║                                                    ║   ┃ Header
┃ ║  ● Active Course                                  ║   ┃
┃ ╚════════════════════════════════════════════════════╝   ┃
┃ ┌────────────────────────────────────────────────────┐   ┃
┃ │ ⚠️  3 assignments need grading                    │   ┃ 40px
┃ └────────────────────────────────────────────────────┘   ┃ Alert
┃ ┌────────────────────────────────────────────────────┐   ┃
┃ │  📈        ⏳        ✅        ⭐                  │   ┃
┃ │  89%       6        18       4.5                  │   ┃ 72px
┃ │ Engage   Pending  Submit   Rating                 │   ┃ Metrics
┃ └────────────────────────────────────────────────────┘   ┃
┃ ┌────────────────────────────────────────────────────┐   ┃
┃ │ 💬 5 new submissions in last 24h                  │   ┃ 32px
┃ │    2 questions in discussions                     │   ┃ Activity
┃ └────────────────────────────────────────────────────┘   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
Total: 320px height
```

---

## 🎨 Section Breakdown

### **1. Color Header** (176px)

**Current Design (Keep):**
- Gradient background with theme color
- Organic shape overlays
- Glass-morphism icon badge
- Role badge (Student/Creator)

**Add:**
- **Progress Ring** (Student) - Top right, 56px diameter
- **Student Count** (Creator) - Top right, badge style

```jsx
// Progress Ring Component
<div className="absolute top-5 right-5">
  <div className="relative w-14 h-14">
    {/* Background Circle */}
    <svg className="w-14 h-14 transform -rotate-90">
      <circle
        cx="28"
        cy="28"
        r="24"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="4"
        fill="none"
      />
      {/* Progress Circle */}
      <circle
        cx="28"
        cy="28"
        r="24"
        stroke="white"
        strokeWidth="4"
        fill="none"
        strokeDasharray={`${progress * 1.51} 151`}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
    {/* Percentage Text */}
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-sm font-bold text-white drop-shadow-lg">
        {progress}%
      </span>
    </div>
  </div>
</div>

// Student Count Badge (Creator)
<div className="absolute top-5 right-5">
  <div className="flex items-center gap-2 px-3 py-2 bg-white/25 backdrop-blur-md rounded-xl border border-white/30">
    <UsersIcon className="w-4 h-4 text-white" />
    <span className="text-sm font-bold text-white">24</span>
  </div>
</div>
```

---

### **2. AI Banner / Alert** (40px)

**Purpose:** Show most important insight/action

**Student - AI Recommendation:**
```jsx
<div className="px-5 py-2.5 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <SparklesIcon className="w-4 h-4 text-purple-600" />
      <span className="text-xs font-semibold text-purple-900">
        Recommended: Visual Learning Mode
      </span>
    </div>
    <span className="text-xs font-bold text-purple-600">85%</span>
  </div>
</div>
```

**Creator - Action Alert:**
```jsx
<div className="px-5 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500">
  <div className="flex items-center gap-2">
    <BellAlertIcon className="w-4 h-4 text-amber-600 animate-pulse" />
    <span className="text-xs font-semibold text-amber-900">
      3 assignments need grading
    </span>
  </div>
</div>
```

---

### **3. Metrics Grid** (72px)

**Layout:** 4 columns, equal width

```jsx
<div className="px-5 py-3 grid grid-cols-4 gap-2 bg-gray-50/50">
  {metrics.map((metric) => (
    <div key={metric.id} className="flex flex-col items-center gap-1">
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg bg-${metric.color}-100 flex items-center justify-center`}>
        <metric.icon className={`w-4 h-4 text-${metric.color}-600`} />
      </div>
      
      {/* Value */}
      <div className="text-base font-bold text-gray-900">
        {metric.value}
      </div>
      
      {/* Label */}
      <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
        {metric.label}
      </div>
    </div>
  ))}
</div>
```

**Student Metrics:**
```javascript
const studentMetrics = [
  { 
    id: 1, 
    icon: ClockIcon, 
    value: '12h', 
    label: 'Time', 
    color: 'blue' 
  },
  { 
    id: 2, 
    icon: CheckCircleIcon, 
    value: '8/12', 
    label: 'Done', 
    color: 'green' 
  },
  { 
    id: 3, 
    icon: ChartBarIcon, 
    value: '85%', 
    label: 'Score', 
    color: 'purple' 
  },
  { 
    id: 4, 
    icon: FireIcon, 
    value: '5', 
    label: 'Streak', 
    color: 'orange' 
  }
];
```

**Creator Metrics:**
```javascript
const creatorMetrics = [
  { 
    id: 1, 
    icon: ChartBarIcon, 
    value: '89%', 
    label: 'Engage', 
    color: 'green' 
  },
  { 
    id: 2, 
    icon: ClockIcon, 
    value: '6', 
    label: 'Pending', 
    color: 'amber' 
  },
  { 
    id: 3, 
    icon: CheckCircleIcon, 
    value: '18', 
    label: 'Submit', 
    color: 'blue' 
  },
  { 
    id: 4, 
    icon: StarIcon, 
    value: '4.5', 
    label: 'Rating', 
    color: 'yellow' 
  }
];
```

---

### **4. Activity Footer** (32px)

**Purpose:** Show recent/upcoming activity

**Student - Next Deadline:**
```jsx
<div className="px-5 py-2 bg-white border-t border-gray-200">
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
      <DocumentTextIcon className="w-3.5 h-3.5 text-blue-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-gray-900 truncate">
        Quiz 3: Chapter 5
      </p>
      <p className="text-[10px] text-gray-500">
        Due in 2 days • Not started
      </p>
    </div>
  </div>
</div>
```

**Creator - Recent Activity:**
```jsx
<div className="px-5 py-2 bg-white border-t border-gray-200">
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
      <ChatBubbleLeftIcon className="w-3.5 h-3.5 text-green-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-gray-900 truncate">
        5 new submissions in last 24h
      </p>
      <p className="text-[10px] text-gray-500">
        2 questions in discussions
      </p>
    </div>
  </div>
</div>
```

---

## 🎨 Complete Component Code

```jsx
const CourseCard = ({ course, userRole }) => {
  const isCreator = userRole === 'creator';
  
  return (
    <Link 
      href={`/courses/${course.id}`}
      className="block w-full max-w-[420px] min-w-[300px] group"
    >
      <div className="relative h-[320px] bg-white border-2 border-gray-200 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-300">
        
        {/* 1. COLOR HEADER - 176px */}
        <div className={`relative h-44 p-5 ${course.colorClass}`}>
          {/* Atmosphere Effects */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl" />
          </div>
          
          {/* Top Row: Icon + Progress/Count */}
          <div className="relative z-10 flex items-start justify-between mb-auto">
            {/* Icon */}
            <div className="w-11 h-11 bg-white/25 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center">
              {isCreator ? (
                <AcademicCapIcon className="w-5 h-5 text-white" />
              ) : (
                <BookOpenIcon className="w-5 h-5 text-white" />
              )}
            </div>
            
            {/* Progress Ring (Student) or Student Count (Creator) */}
            {isCreator ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/25 backdrop-blur-md rounded-xl border border-white/30">
                <UsersIcon className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">{course.studentCount}</span>
              </div>
            ) : (
              <ProgressRing value={course.progress} />
            )}
          </div>
          
          {/* Bottom Row: Title + Badge */}
          <div className="relative z-10 flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                  Active Course
                </span>
              </div>
              <h3 className="text-lg font-bold text-white drop-shadow-lg truncate mb-1">
                {course.title}
              </h3>
              <p className="text-sm text-white/80 drop-shadow truncate">
                {course.code}
              </p>
            </div>
            
            {/* Role Badge */}
            <div className={`px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/30 ${
              isCreator ? 'bg-blue-600/95' : 'bg-green-600/95'
            }`}>
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                {isCreator ? 'Creator' : 'Student'}
              </span>
            </div>
          </div>
        </div>
        
        {/* 2. AI BANNER / ALERT - 40px */}
        {isCreator ? (
          <div className="px-5 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500">
            <div className="flex items-center gap-2">
              <BellAlertIcon className="w-4 h-4 text-amber-600 animate-pulse" />
              <span className="text-xs font-semibold text-amber-900">
                {course.pendingCount} assignments need grading
              </span>
            </div>
          </div>
        ) : (
          <div className="px-5 py-2.5 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-900">
                  Recommended: {course.recommendedMode}
                </span>
              </div>
              <span className="text-xs font-bold text-purple-600">
                {course.matchScore}%
              </span>
            </div>
          </div>
        )}
        
        {/* 3. METRICS GRID - 72px */}
        <div className="px-5 py-3 grid grid-cols-4 gap-2 bg-gray-50/50">
          {(isCreator ? course.creatorMetrics : course.studentMetrics).map((metric) => (
            <div key={metric.id} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-lg bg-${metric.color}-100 flex items-center justify-center`}>
                <metric.icon className={`w-4 h-4 text-${metric.color}-600`} />
              </div>
              <div className="text-base font-bold text-gray-900">
                {metric.value}
              </div>
              <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide text-center">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* 4. ACTIVITY FOOTER - 32px */}
        <div className="px-5 py-2 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isCreator ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {isCreator ? (
                <ChatBubbleLeftIcon className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <DocumentTextIcon className="w-3.5 h-3.5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">
                {course.activityTitle}
              </p>
              <p className="text-[10px] text-gray-500">
                {course.activitySubtitle}
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </Link>
  );
};

// Progress Ring Component
const ProgressRing = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);
  
  const circumference = 2 * Math.PI * 24;
  const progress = (displayValue / 100) * circumference;
  
  return (
    <div className="relative w-14 h-14">
      <svg className="w-14 h-14 transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r="24"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r="24"
          stroke="white"
          strokeWidth="4"
          fill="none"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white drop-shadow-lg">
          {displayValue}%
        </span>
      </div>
    </div>
  );
};
```

---

## 🎨 Color Specifications

```css
/* Student Colors */
--student-primary: #10B981;      /* green-500 */
--student-light: #D1FAE5;        /* green-100 */
--student-badge: #059669;        /* green-600 */

/* Creator Colors */
--creator-primary: #3B82F6;      /* blue-500 */
--creator-light: #DBEAFE;        /* blue-100 */
--creator-badge: #2563EB;        /* blue-600 */

/* AI/Recommendation */
--ai-primary: #8B5CF6;           /* purple-500 */
--ai-light: #F3E8FF;             /* purple-50 */
--ai-border: #A78BFA;            /* purple-400 */

/* Alert/Warning */
--alert-primary: #F59E0B;        /* amber-500 */
--alert-light: #FEF3C7;          /* amber-50 */
--alert-border: #FBBF24;         /* amber-400 */

/* Metric Colors */
--metric-time: #3B82F6;          /* blue */
--metric-completion: #10B981;    /* green */
--metric-score: #8B5CF6;         /* purple */
--metric-streak: #F97316;        /* orange */
--metric-engagement: #10B981;    /* green */
--metric-pending: #F59E0B;       /* amber */
--metric-rating: #EAB308;        /* yellow */
```

---

## ✨ Hover States

```css
.course-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: #D1D5DB;
}

.course-card:active {
  transform: translateY(-2px);
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile (<640px) */
.course-card {
  width: 100%;
  min-width: 280px;
  height: 320px;
}

.metrics-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

/* Tablet (640px - 1024px) */
.course-card {
  width: 100%;
  min-width: 300px;
  max-width: 380px;
  height: 320px;
}

.metrics-grid {
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

/* Desktop (>1024px) */
.course-card {
  width: 100%;
  min-width: 300px;
  max-width: 420px;
  height: 320px;
}

.metrics-grid {
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
```

---

## 🎯 Key Design Decisions

### **Why 320px Height?**
- Fits 2 cards vertically on most screens
- Enough space for all information
- Not overwhelming
- Maintains visual hierarchy

### **Why 4 Metrics?**
- Cognitive load: 4 is optimal for quick scanning
- Fits perfectly in card width
- Each metric tells a story
- Balanced visual weight

### **Why Separate Student/Creator Views?**
- Different goals and needs
- Reduces cognitive load
- Clearer call-to-action
- Better user experience

### **Why AI Banner?**
- Showcases system intelligence
- Immediate value proposition
- Drives engagement with AI features
- Differentiates from competitors

---

## 🚀 Implementation Checklist

- [ ] Create `ProgressRing` component
- [ ] Create `MetricCard` component  
- [ ] Add progress data to course API
- [ ] Add AI recommendation data
- [ ] Add metrics calculation
- [ ] Implement hover animations
- [ ] Test responsive behavior
- [ ] Add accessibility (ARIA labels)
- [ ] Performance optimization
- [ ] User testing

---

**This is the complete course card design. Ready to implement!** 🎨
