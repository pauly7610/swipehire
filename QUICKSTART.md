# 🚀 SwipeHire Quick Start Guide

## What's New

You now have a **beautiful Sorce-inspired swipe experience** with **RezPass-level resume intelligence**!

### Core Features
✨ **Minimal swipe cards** - Beautiful, gesture-driven job discovery
🤖 **AI auto-application** - One swipe = fully customized application
🎯 **Persona detection** - Experience adapts to your situation
📱 **Mobile-native** - Bottom sheets, haptics, spring animations
📊 **Application tracking** - Dashboard with real-time status

---

## 🏃 Quick Start (3 Steps)

### Step 1: Update Your Routes

Add the new pages to your app. Update `src/App.jsx` or `src/pages.config.js`:

```javascript
import MinimalSwipeJobs from './pages/MinimalSwipeJobs';
import ApplicationDashboard from './components/applications/ApplicationDashboard';
import PersonaOnboarding from './components/onboarding/PersonaOnboarding';

// Add these routes:
{
  path: '/swipe-jobs',
  component: MinimalSwipeJobs,
  name: 'Swipe Jobs'
},
{
  path: '/applications',
  component: ApplicationDashboard,
  name: 'Applications'
},
{
  path: '/onboarding',
  component: PersonaOnboarding,
  name: 'Onboarding'
}
```

### Step 2: Update Navigation

Add links to your navigation (in `Layout.jsx` or wherever your nav is):

```jsx
import { Sparkles, FileText, User } from 'lucide-react';

<nav>
  <Link to="/swipe-jobs">
    <Sparkles className="w-5 h-5" />
    <span>Discover</span>
  </Link>

  <Link to="/applications">
    <FileText className="w-5 h-5" />
    <span>Applications</span>
  </Link>
</nav>
```

### Step 3: Configure Base44 LLM Integration

1. Go to your Base44 dashboard
2. Navigate to **Integrations** → **LLM**
3. Enable the integration and add your API key (OpenAI or Anthropic)
4. Save configuration

**That's it!** The app is ready to use.

---

## 🎮 How to Use

### For Candidates

1. **First-time users:** Visit `/onboarding` to set up your persona
2. **Swipe jobs:** Go to `/swipe-jobs`
   - Swipe right to auto-apply
   - Swipe left to pass
   - Tap card for details
3. **Track applications:** Go to `/applications` to see status

### For Recruiters

The swipe experience also works for recruiters! Just create:
- `MinimalCandidateCard.jsx` (similar to MinimalJobCard)
- `SwipeCandidatesPage.jsx` (similar to MinimalSwipeJobs)

---

## 📱 Test It Out

### Test the Swipe Experience

1. Navigate to `/swipe-jobs`
2. You should see a beautiful job card
3. Try these gestures:
   - **Drag right** → See "APPLY" overlay
   - **Drag left** → See "PASS" overlay
   - **Release** → Card snaps back
   - **Swipe past threshold** → Card flies away, application starts!
   - **Tap card** → Bottom sheet opens with details

### Test Auto-Application

1. Swipe right on a job
2. Watch the magic happen:
   - Progress overlay appears
   - "Customizing your resume..." (2-3s)
   - "Writing cover letter..." (2s)
   - "Submitting application..." (1s)
   - ✅ Success toast!
3. Check `/applications` to see the application record

---

## 🎨 Customization

### Change Colors

Edit `src/lib/design-system.js`:

```javascript
export const colors = {
  primary: {
    DEFAULT: '#FF6B6B', // Change this!
    light: '#FFE5E5',
    dark: '#E85555',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
  },
  // ... more colors
};
```

### Customize Card Layout

Edit `src/components/swipe/MinimalJobCard.jsx`:

```jsx
// Change what shows on the card:
<div className="card-content">
  <h3>{job.title}</h3>
  <p>{job.company?.name}</p>

  {/* Add your own data points: */}
  <p>{job.yourCustomField}</p>
</div>
```

### Adjust Swipe Sensitivity

In `MinimalJobCard.jsx`:

```javascript
// Change swipe threshold
const threshold = 150; // Lower = easier to swipe

// Change drag elastic
dragElastic={0.8} // Higher = more elastic
```

---

## 🔧 Configuration

### Auto-Apply Settings

In `MinimalSwipeJobs.jsx`, configure per-persona:

```javascript
const personaSettings = {
  'quick-finder': {
    reviewBeforeSubmit: false, // Auto-submit
    showUrgency: true,
    dailyGoals: true
  },
  'dream-hunter': {
    reviewBeforeSubmit: true, // Review first
    showUrgency: false,
    detailedInsights: true
  }
};
```

### Resume Customization

In `src/lib/resume-intelligence.js`:

```javascript
// Adjust keyword density
const keywordDensity = 0.025; // 2.5% (ATS sweet spot)

// Change prompt temperature
const response = await base44.integrations.LLM.invoke({
  temperature: 0.4, // Lower = more consistent
  // 0.3 = very consistent
  // 0.7 = more creative
});
```

---

## 📊 Database Setup

### Required Entities

Make sure these entities exist in Base44:

```javascript
// Candidate entity
{
  userId: string,
  firstName: string,
  lastName: string,
  currentTitle: string,
  experienceYears: number,
  skills: array,
  resume: json
}

// Job entity
{
  title: string,
  companyId: string,
  description: text,
  requirements: array,
  skills: array,
  salaryMin: number,
  salaryMax: number,
  location: string,
  remote: boolean,
  status: 'published' | 'draft'
}

// Match entity
{
  candidateId: string,
  jobId: string,
  status: 'applied' | 'viewed' | 'interview',
  matchScore: number,
  appliedAt: timestamp,
  viewedByEmployer: boolean,
  customResume: json,
  coverLetter: text
}

// Swipe entity (new)
{
  candidateId: string,
  jobId: string,
  direction: 'like' | 'pass' | 'superlike',
  applied: boolean,
  swipedAt: timestamp
}
```

---

## 🐛 Troubleshooting

### Issue: Cards not loading

**Solution:**
1. Check Base44 connection: `console.log(base44)`
2. Verify Job entities exist: Check Base44 dashboard
3. Check console for errors

### Issue: Auto-apply fails

**Solution:**
1. Verify LLM integration is enabled in Base44
2. Check API key is valid
3. Look at console errors for specific failure point
4. Test with simpler job descriptions first

### Issue: Swipe gestures not working

**Solution:**
1. Make sure Framer Motion is installed: `npm list framer-motion`
2. Check if `drag` prop is present on motion.div
3. Test on mobile device (gestures work better on touch)

### Issue: Bottom sheet won't open

**Solution:**
1. Check `isOpen` state is being set
2. Verify BottomSheet component is rendered
3. Check z-index (should be 1400+)
4. Look for console errors

---

## 🚀 Performance Tips

### Optimize Loading

```javascript
// Prefetch jobs
const prefetchJobs = async () => {
  const jobs = await base44.entities.Job.find({
    limit: 30, // Load 30 at once
    include: ['company'] // Eager load company
  });
  return jobs;
};

// Cache images
const cacheImages = (jobs) => {
  jobs.forEach(job => {
    if (job.company?.logo) {
      const img = new Image();
      img.src = job.company.logo;
    }
  });
};
```

### Optimize Animations

```javascript
// Use transform and opacity only (GPU accelerated)
<motion.div
  style={{ x, y, rotate, opacity }} // ✅ Good
  style={{ left, top }} // ❌ Bad (causes reflow)
/>

// Reduce motion for low-end devices
const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1, rotate: 0 }}
/>
```

---

## 📱 Mobile Testing

### Test on Real Devices

1. **Get your local IP:**
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. **Access from mobile:**
   ```
   http://YOUR_IP:5173
   ```

3. **Test checklist:**
   - [ ] Swipe gestures feel smooth
   - [ ] Haptic feedback works (iOS/Android)
   - [ ] Bottom sheets drag properly
   - [ ] Cards load quickly
   - [ ] Text is readable
   - [ ] Buttons are tap-able

---

## 🎯 Next Steps

### Phase 1: Polish (1 week)
- [ ] Test on real mobile devices
- [ ] Add loading skeletons
- [ ] Improve error handling
- [ ] Add analytics tracking

### Phase 2: Features (2 weeks)
- [ ] Implement persona-specific UIs
- [ ] Add batch apply mode
- [ ] Build notification system
- [ ] Create admin dashboard

### Phase 3: Scale (4 weeks)
- [ ] Optimize database queries
- [ ] Add caching layer
- [ ] Implement webhooks
- [ ] Set up monitoring

---

## 💡 Pro Tips

### For Best Results

1. **Start with good data:** Make sure jobs have detailed descriptions
2. **Complete profiles:** Better candidate profiles = better customization
3. **Test personas:** Try different onboarding answers to see different UX
4. **Monitor metrics:** Track swipe rates, application rates, callback rates
5. **Iterate quickly:** A/B test card designs, copy, features

### For Development

1. **Use React DevTools:** Profile renders, check state
2. **Test animations:** Use Chrome DevTools Performance tab
3. **Mobile-first:** Always test on mobile (it's the primary experience)
4. **Read the logs:** The AI calls log their prompts & responses
5. **Start simple:** Get basic swipe working before adding complexity

---

## 📚 Learn More

- **Implementation Guide:** See `IMPLEMENTATION_GUIDE.md` for detailed docs
- **Design System:** See `src/lib/design-system.js` for all design tokens
- **Components:** All components have inline documentation

---

## 🎉 You're Ready!

Your app now has:
- ✨ **Sorce's beauty** - Minimal, delightful swipe experience
- 🧠 **RezPass's intelligence** - AI-powered resume customization
- 🎯 **Personalization** - Adapts to each user's needs
- 📱 **Mobile-native** - Gestures, haptics, bottom sheets
- ⚡ **Lightning fast** - One swipe = instant application

**Start swiping and land your dream job!** 🚀

---

## 💬 Questions?

Check the `IMPLEMENTATION_GUIDE.md` for comprehensive documentation on:
- All components and their props
- Database schema
- API documentation
- Advanced features
- Troubleshooting guide

**Happy building!** 🎨
