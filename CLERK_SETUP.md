# Clerk Authentication Setup Guide

SwipeHire now uses [Clerk](https://clerk.com) for authentication with Google and LinkedIn OAuth support.

## Quick Setup

### 1. Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com) and sign up for a free account
2. Create a new application in the Clerk dashboard
3. Name it "SwipeHire" or similar

### 2. Enable OAuth Providers

In your Clerk dashboard:

1. Navigate to **"User & Authentication" → "Social Connections"**
2. Enable **Google**:
   - Click "Add connection"
   - Select "Google"
   - Follow the setup wizard (Clerk provides dev credentials for testing)

3. Enable **LinkedIn**:
   - Click "Add connection"
   - Select "LinkedIn"
   - **For production**: You'll need to create a LinkedIn app at [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Add your LinkedIn Client ID and Client Secret
   - **For development**: Use Clerk's development credentials

### 3. Get Your Clerk Keys

1. In Clerk dashboard, go to **"API Keys"**
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Create a `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env
```

4. Add your Clerk key to `.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Keep your existing Base44 config
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_SERVER_URL=https://api.base44.com
VITE_BASE44_TOKEN=your_token_here
```

### 4. Configure Redirect URLs

In Clerk dashboard, go to **"Paths"** and set:

- **Sign-in path**: `/sign-in`
- **Sign-up path**: `/sign-up`
- **After sign-in**: `/Onboarding` (or `/SwipeJobs` if user has profile)
- **After sign-up**: `/Onboarding`

## Features Implemented

### ✅ Authentication Flow

1. **Sign In/Sign Up**: Users see a beautiful branded sign-in page
2. **OAuth Options**: Google and LinkedIn (LinkedIn only if enabled in Clerk)
3. **Automatic Sync**: User data syncs between Clerk and Base44

### ✅ Onboarding Flow

**Step 1: Choose Import Method**
- **LinkedIn Import** (if user signed in with LinkedIn) - Coming soon
- **Resume Upload** - AI parses resume and auto-fills profile
- **Manual Entry** - Fill out step-by-step

**Steps 2-8**: Photo → Basic Info → Experience → Education → Skills → Resume → Review

### ✅ Profile Management

- User profile photo from Clerk (or uploaded)
- Email and name from Clerk user
- Candidate data stored in Base44
- Logout clears both Clerk and local data

## LinkedIn Profile Import (Coming Soon)

To enable LinkedIn profile data import:

1. In Clerk dashboard → "User & Authentication" → "Social Connections" → LinkedIn
2. Under "Permissions", request:
   - `r_liteprofile` - Basic profile info
   - `r_emailaddress` - Email address
   - `r_fullprofile` - Full profile (work history, education, skills)

3. The app will automatically detect when users sign in with LinkedIn
4. On the onboarding page, they'll see an "Import from LinkedIn" option

## Testing

### Development Mode

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and you should see:
1. Loading screen
2. Sign-in page with Google/LinkedIn buttons
3. After sign-in → Onboarding with import options

### Test Accounts

Clerk provides test mode accounts:
- Use any email for testing
- No real OAuth needed in development

## Production Checklist

Before deploying:

- [ ] Switch from `pk_test_` to `pk_live_` Clerk key
- [ ] Set up LinkedIn OAuth app (if using LinkedIn import)
- [ ] Add production redirect URLs in Clerk
- [ ] Enable 2FA for Clerk dashboard
- [ ] Set up Clerk webhook for user events (optional)
- [ ] Configure Clerk email templates (optional)

## Customization

### Branding

Clerk sign-in components use your brand colors:
- Primary: Pink (#FF005C) to Orange (#FF7B00) gradient
- Configured in `src/App.jsx` appearance prop

### Additional OAuth Providers

To add more providers (Apple, Microsoft, etc.):
1. Enable in Clerk dashboard
2. No code changes needed!

## Troubleshooting

### "Missing Clerk publishable key" error

- Make sure `.env` file exists in project root
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set
- Restart dev server after adding `.env`

### LinkedIn button not showing

- Check Clerk dashboard → LinkedIn is enabled
- Verify LinkedIn app is in production mode (not limited access)
- Check browser console for errors

### User profile not syncing

- Check Base44 API keys in `.env`
- Verify Candidate entity exists in Base44
- Check browser console for sync errors

## Support

- **Clerk Docs**: [https://clerk.com/docs](https://clerk.com/docs)
- **Clerk Discord**: [https://clerk.com/discord](https://clerk.com/discord)
- **SwipeHire Issues**: Create an issue in this repo

## Migration from Base44 Auth

All Base44 auth has been replaced with Clerk:

- ❌ `base44.auth.me()` → ✅ `useClerkAuth()` hook
- ❌ `base44.auth.logout()` → ✅ Clerk `signOut()`
- ❌ Manual session management → ✅ Automatic with Clerk

No Base44 user accounts needed - Clerk handles everything!
