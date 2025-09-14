# Netlify Deployment Guide

## Prerequisites
1. A Netlify account (sign up at https://netlify.com)
2. Your Supabase project URL and anon key

## Deployment Steps

### Option 1: Deploy via Netlify CLI (Recommended)

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

### Option 2: Deploy via Netlify Dashboard

1. **Go to https://app.netlify.com**
2. **Click "Add new site" → "Import an existing project"**
3. **Connect your Git repository** (GitHub, GitLab, etc.)
4. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

### Environment Variables Setup

**IMPORTANT:** You need to set these environment variables in Netlify:

1. Go to your site dashboard → Site settings → Environment variables
2. Add these variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

### Your Supabase Credentials

To find your Supabase credentials:
1. Go to your Supabase project dashboard
2. Go to Settings → API
3. Copy:
   - Project URL (for VITE_SUPABASE_URL)
   - Project API keys → anon/public (for VITE_SUPABASE_ANON_KEY)

## Post-Deployment

After deployment, your app will be available at:
- `https://your-site-name.netlify.app`

Make sure to test all functionality, especially:
- User authentication
- Challenge submissions
- Friend requests
- Country selection

## Troubleshooting

If you encounter issues:
1. Check the build logs in Netlify dashboard
2. Verify environment variables are set correctly
3. Ensure your Supabase RLS policies allow public access where needed
4. Check browser console for any client-side errors
