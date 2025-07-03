# PDF Pass Template Setup

This document outlines the rationale, structure, and implementation details for the **PDF pass template** introduced in task **8.1 – PDF Template Setup**.

## Why a Separate Template?

1. **Maintainability** – Moving the raw HTML out of `PdfPassService` keeps the service class concise and easier to reason about.
2. **Design Flexibility** – Product/design teams can tweak colours, fonts, and layout without touching TypeScript code.
3. **Multi-Language & RTL** – A template file with clear placeholders simplifies localisation and RTL handling.
4. **Build-time Assets** – `nest-cli.json` already copies `*.hbs` assets during build, so shipping a template file is friction-less.

## Where It Lives

```
apps/backend/src/passes/templates/pass-template.hbs
```

* The `*.hbs` extension ensures Nest copies the file to `dist/`.
* The template uses **double-brace placeholders** (`{{variable}}`) – *no actual Handlebars runtime* is required.

## How It Works

1. **Load & Cache** – `PdfPassService` reads the file once on module initialisation and caches it (`templateHtml`).
2. **Compile** – For each pass request we:
   * Gather context (event, guest, tier, QR code…)
   * Build a `Record<string,string>` of placeholders → values.
   * Replace all `{{placeholder}}` tokens via regex (`compileTemplate`).
3. **Render PDF** – The compiled HTML is fed to Puppeteer, exactly as before.

### New Placeholders

| Placeholder     | Description                               |
|-----------------|-------------------------------------------|
| `direction`     | `ltr` or `rtl`                            |
| `language`      | ISO code, currently `en` / `ar`           |
| `primaryColor`  | Brand colour from `event.design_config`   |
| `secondaryColor`| Secondary brand colour                    |
| `fontFamily`    | Inter (LTR) or Amiri (RTL) stack          |
| `fontLinkRTL`   | Extra `<link>` tag to load Amiri font     |
| `eventName`     | Event title                               |
| `eventType`     | e.g. *Conference* / *Wedding*             |
| `tierName`      | Ticket tier label                         |
| `guestName`     | Guest's full name                         |
| `guestEmail`    | Guest's email address                     |
| `eventDate`     | Formatted date string                     |
| `eventTime`     | Formatted time string                     |
| `eventVenue`    | Venue name (or *TBA*)                     |
| `qrCodeDataUrl` | Base64 QR image                           |
| `rtlStyles`     | Extra CSS rules if RTL                    |
| `footerText`    | Localised footer disclaimer               |
| `dateLabel`     | Localised label for *Date*                |
| `timeLabel`     | Localised label for *Time*                |
| `venueLabel`    | Localised label for *Venue*               |
| `tierLabel`     | Localised label for *Tier*                |
| `qrInstruction` | Localised QR instruction text             |
| `customStyles`  | Optional injected CSS from caller         |
| `passId`        | Unique pass identifier                    |

## Extending / Theming

* **Custom CSS** – Callers can pass `customStyles` via `PDFPassOptions` to inject bespoke styling.
* **Additional Placeholders** – Add the token in the template and supply its value in `generateHtmlTemplate`.
* **More Languages** – Extend the label & footer mappings.

*Maintainer*: Engineering Team 