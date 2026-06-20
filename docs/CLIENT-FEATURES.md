# WeldDoc — Features Built

**Standard:** EN ISO 9606-1:2017  
**Last updated:** June 2026

---

## Landing page (`/`)

- Hero, product value proposition, sign-in CTA
- Desktop and mobile dashboard screenshots
- Six product capability cards (registry, certificates, ID cards, alerts, master list, dashboard)
- Four-step workflow section (Plan → Test & NDT → Certify → Verify)
- Comparison table vs generic ERP tools
- Trust marquee and branded marketing design
- Demo QR linking to sample verification page
- Footer with sign-in link

---

## Authentication (`/login`)

- Sign in with email and password
- Create account (name, email, password)
- New signup creates a dedicated organisation (data isolated per company)
- Redirect to dashboard after login
- Session-protected app routes

---

## Dashboard (`/dashboard`)

- Total welders count
- Active qualifications count
- Expiring soon (within 60 days)
- Overdue qualifications count
- Welder status chart (Active, Expiring, Expired, Pending, None, Inactive, Suspended)
- Approved qualifications by welding process
- Approved qualifications by joint type (butt / fillet)
- Process × joint type coverage matrix (highlights gaps)
- Needs-attention list with links to welder profiles
- Add welder shortcut

---

## Welder registry

**Routes:** `/welders`, `/welders/new`, `/welders/[id]`, `/welders/[id]/edit`

### List
- Searchable table with photo, name, UID, plant welder ID
- Process coverage and overall status per welder
- Nearest expiry date
- Filter by status and process

### Add / edit welder
- Full name, date of birth, place of birth
- ID method and number
- Employer and branch
- Plant welder ID (`W#01`, `W#02`, …)
- Photograph upload
- Auto-generated UID (configurable prefix)
- Auto-generated QR token
- Suggested sequential plant welder ID
- New welder toggle (wizard vs legacy entry on qualify)

### Welder profile
- Identity panel with photo, UID, plant ID, employer, QR code
- Welder status control (Active / Inactive / Suspended)
- All qualification records with process, joint, position, expiry, range summary
- Open workflow, certificate preview, clone, discard draft
- Log 6-month continuity (cl. 9.2) and revalidation with optional document upload

---

## Qualification workflows (`/welders/[id]/qualify`)

### Four-step wizard (new qualifications)
1. **Plan** — standard, process, joint type, product, position, material group, WPS, test date, examiner, revalidation method (9.3a/b/c)
2. **Test piece** — material grade & spec, dimensions, filler, gas, polarity, transfer mode, thicknesses, pipe OD, weld details
3. **NDT / DT** — required and optional tests, pass/fail, dates, report references, PDF uploads
4. **Certificate** — review locked range of approval, issue certificate

**Wizard features:**
- Visual stepper with clickable steps
- Back navigation between steps
- Inline field validation
- Discard draft (Draft / Pending NDT / Failed)
- Full-width form layout

**NDT by joint type:**
- Butt weld (BW): Visual Root, Visual Cap, RT/UT
- Fillet weld (FW): Visual Root, Fracture test
- Optional: PT, bend, tensile, macro, and others

**Material grade lookup (CEN ISO/TR 20172):**
- Select EN standard and grade → auto-fill parent material group
- Manual override available

**Status lifecycle:** Draft → Pending NDT → Approved (or Failed)

### Legacy qualification entry
- Minimal A–J fields for pre-existing qualifications
- PDF bundle upload (certificate, VT, RT/fracture, continuity)
- Pass/fail for VT, RT/UT, fracture
- Approved record with Legacy flag
- Manual or computed expiry from revalidation method

### Clone qualification
- Copy approved qualification into new Draft
- Opens at Step 2 for review and re-issue
- Original qualification unchanged

---

## Range-of-approval engine

- Automatic ISO 9606-1 range calculation from test piece data
- Rules engine from standard tables
- Range locked at certificate issue (not editable at sign-off)
- Shown on profile, certificate, verify page, and master list
- Preview during Plan and Test steps

---

## Certificates & ID cards

### Certificate PDF
- **Route:** `/welders/[id]/certificate?wpq=…`
- Annex A layout
- Test data, designation, range of approval table
- NDT / destructive test summary
- Continuity and revalidation annex tables
- Welder photo, organisation logo, QR code
- Manufacturer and examining body signature + stamp images
- In-browser PDF preview and download

### ID card PDF
- **Route:** `/welders/[id]/id-card`
- CR80 wallet size
- Photo, name, UID, status, company logo, QR code
- In-browser preview and download

---

## Batch test reports

**Routes:** `/reports`, `/reports/new`, `/reports/[id]`

- List all batch WQT reports
- Create report with header: joint category (BW/FW), test date, WPS, revalidation method, remarks, signatories
- Add multiple welder rows per report
- New welder flag (`*`) on sheet
- Sequential report number (configurable prefix)
- One WPQ per welder linked to report
- Range of approval computed per row
- Auto-approve if all tests pass
- Report detail table
- Download batch WQT sheet PDF with signatory blocks

---

## Master list & PED exports (`/masterlist`)

- Full qualification register table
- Columns: welder name, UID, plant ID, process, standard, joint, product, position, material groups, thickness range, pipe OD, status, dates, revalidation method, Legacy flag
- Search and filter by status and joint type
- Export standard master list (CSV)
- Export branded master list (PDF)
- Export PED list (CSV)
- Export PED list (PDF with as-on date)

---

## Public QR verification

**Routes:** `/verify/[token]`, `/verify/demo`

- No login required
- Qualified / Not qualified banner
- Organisation name, welder name, UID
- List of valid approved qualifications with range summaries
- Demo verification page for presentations
- QR on ID cards and certificates

---

## Settings (`/settings`)

### Organisation
- Company name
- Location code
- Welder UID prefix
- Report number prefix
- Alert lead days
- Alert recipient emails
- Company logo upload

### Signatories
- Manufacturer and examining body roles
- Name, designation, organisation
- Signature and stamp image uploads
- Applied to certificates and batch report PDFs

### Appearance
- Light / dark / system theme

---

## Expiry & continuity

- Revalidation methods: 9.3a (3 yr), 9.3b (2 yr), 9.3c (6 mo)
- 6-month continuity logging (cl. 9.2) on welder profile
- Continuity table updates on certificate when re-downloaded
- Dashboard expiring-soon widget (60-day window)
- Daily email digest for expiry and continuity (Resend + cron when deployed)
- Deduped alert emails

---

## Platform

- Responsive web app (desktop and mobile)
- Cloud database and file storage (photos, NDT PDFs, signatures, stamps, legacy docs)
- Organisation-scoped data isolation
- Server-side PDF generation
- Navigation recovery on stale deployments and long-idle tabs

---

## Scope

**Built:**
- EN ISO 9606-1:2017
- Welder registry (A–J fields + full ~31-field qualification)
- Range-of-approval engine
- Certificate, ID card, batch report, master list, PED export
- QR verification
- Continuity and revalidation logging
- Expiry alerts (dashboard + email)

**Not built yet:**
- ASME IX / AWS D1.1
- Separate viewer / admin roles
- Bulk legacy welder import
- Multi-site organisation hierarchy
