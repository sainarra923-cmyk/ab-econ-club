# Acton-Boxborough Economics Club website

The club's site: a blog officers post to, events, officer profiles, resources, and an email newsletter.

Until it's connected to Supabase, the site shows placeholder content with a gold "Preview" bar at the top. That's expected.

## How it fits together

| Piece | What it does |
| --- | --- |
| **GitHub** (this repo) | Stores the code. Every change is saved here. |
| **Vercel** | Turns the code into the live website. Updates automatically when this repo changes. |
| **Supabase** | Stores posts, events, officer logins, images, and newsletter sign-ups. |
| **Resend** | Sends newsletter emails. Optional until you have a domain. |

Officers never touch GitHub. They log in at `/login` and post from there.

---

## Setup guide

Do these in order. Keep a notes file open to paste keys into as you go.

### 1. Supabase: create the database

1. Go to [supabase.com](https://supabase.com) and sign up with GitHub.
2. Click **New project**. Name it `ab-econ-club`, click **Generate a password** (save it somewhere), pick the **East US** region, and create it. It takes a minute or two.
3. In the left sidebar, open **SQL Editor**. Click **New query**.
4. Open [`supabase/setup.sql`](supabase/setup.sql) in this repo, click the **Copy raw file** button, paste everything into the SQL editor, and click **Run**. You should see "Success. No rows returned."
5. In the left sidebar, go to **Authentication**, then find the sign-up settings (under **Sign In / Providers**) and turn **off** "Allow new users to sign up." Officers get in by invite only.
6. Go to **Authentication > Users**, click **Add user > Create new user**. Enter your email and a password, check **Auto Confirm User**, and create it. The first account is automatically the admin.
7. Go to **Project Settings > API Keys** and copy three things into your notes:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`; it may be on the **Data API** page)
   - **Publishable key** (starts with `sb_publishable_`)
   - **Secret key** (starts with `sb_secret_`). Never share this one or paste it anywhere public.

   If you only see keys called `anon` and `service_role`, use `anon` as the publishable key and `service_role` as the secret key.

### 2. Vercel: put the site online

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New > Project**, find `ab-econ-club`, and click **Import**.
3. Open **Environment Variables** and add these three (name on the left, value on the right):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `SUPABASE_SECRET_KEY` | Secret key |

4. Click **Deploy**. When it finishes, you get a link like `ab-econ-club.vercel.app`. The Preview bar should be gone.

### 3. Supabase: tell it where the site lives

Back in Supabase, go to **Authentication > URL Configuration**:

- **Site URL:** your Vercel link, e.g. `https://ab-econ-club.vercel.app`
- **Redirect URLs:** add `https://ab-econ-club.vercel.app/**`

This makes password reset links send people back to your site.

### 4. Log in and clean up

1. Go to `your-site/login` and log in with the account from step 1.6.
2. **My profile:** add your real name, role, grade, photo, and bio.
3. **Officers:** delete the three placeholder profiles, then invite real officers. Each invite gives you a link to text or email them.
4. **Posts:** edit or delete the three placeholder posts.
5. **Events:** replace the placeholder events.

### 5. Buy the domain

1. In Vercel, open the project, go to **Settings > Domains**, search for a name (like `abeconclub.org`), and buy it. Buying through Vercel connects it automatically.
2. In **Settings > Environment Variables**, add `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.org`.
3. Go to **Deployments**, open the menu on the newest one, and click **Redeploy** so the change takes effect.
4. In Supabase **Authentication > URL Configuration**, change the Site URL to your domain and add `https://yourdomain.org/**` to Redirect URLs.

### 6. Turn on newsletter emails

People can sign up right away; this step lets you actually send.

1. Sign up at [resend.com](https://resend.com).
2. Go to **Domains > Add domain** and enter your domain. Resend shows a few DNS records.
3. In Vercel, go to the domain's DNS settings (**Settings > Domains**, or the Domains tab on your Vercel dashboard) and add each record exactly as Resend shows it. Back in Resend, click **Verify**. It can take a few minutes to an hour.
4. In Resend, go to **API Keys** and create one.
5. In Vercel, add two environment variables, then redeploy:

   | Name | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the key from Resend |
   | `NEWSLETTER_FROM_EMAIL` | `AB Econ <newsletter@yourdomain.org>` |

Now **Newsletter** in the admin area can email a post or a custom message to everyone signed up. Once email is on, officer invites also get emailed automatically.

---

## Using the admin area

- **Posts:** write in the editor. Buttons handle headings, bold, lists, links, tables, and images. **Preview** shows exactly how it'll look. **Save draft** keeps it hidden; **Publish** puts it live. Officers can edit their own posts; the admin can edit any.
- **Charts:** make the chart in Google Sheets, Excel, or [FRED](https://fred.stlouisfed.org), download it as an image, and use **Image or chart**.
- **Member-written posts:** fill in "Written by a member?" and the post shows their name instead of yours.
- **Events:** add, edit, or delete. Past events move to the bottom of the Events page on their own.
- **Officers** (admin only): invite, reorder, hide, remove, or make a password reset link.
- **Newsletter** (admin only): see subscribers, download the list, send emails.

## Changing page text

The About page, Resources page, tagline, and meeting time live in [`src/content/site.ts`](src/content/site.ts). Edit that file on GitHub (pencil icon), commit, and Vercel updates the site in about a minute.

## For developers

Next.js 16 (App Router), Tailwind CSS 4, Supabase (Postgres with row-level security, Auth, Storage), Resend.

```bash
npm install
cp .env.example .env.local   # fill in values, or leave empty for placeholder mode
npm run dev
```

- `supabase/schema.sql` is the source for the database. `supabase/setup.sql` is generated from it plus `src/content/placeholder.json`: run `node scripts/build-setup-sql.mjs` after editing either. Both are safe to re-run.
- Security lives in the database rules: the public can read published posts, events, and profiles; officers write their own posts; only the admin manages officers. Subscribers are only reachable with the secret key on the server.
