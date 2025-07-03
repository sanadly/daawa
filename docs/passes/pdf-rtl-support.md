# PDF Pass RTL Support

This document outlines how Right-to-Left (RTL) language support, specifically for Arabic, is implemented for PDF passes, as part of task **8.4 – RTL Language Support**.

## Overview

The PDF generation service is designed to dynamically adjust the layout and content of passes based on the requested language. When the language is set to Arabic (`ar`), several mechanisms are activated to ensure a correct RTL presentation.

## How It Works

The primary logic resides in the `PdfPassService` and the `pass-template.hbs` template.

### 1. Language Detection

- The `generatePdfPass` method accepts an `options` object, which includes a `language` property (`'en' | 'ar'`).
- The service sets a boolean flag, `isRTL`, based on whether `options.language === 'ar'`.

### 2. Template Adjustments

The `isRTL` flag controls several placeholders that are injected into the `pass-template.hbs` file:

-   **`{{direction}}`**: The root `<html>` tag's `dir` attribute is set to `rtl`.
-   **`{{fontFamily}}`**: The CSS `font-family` is switched to a stack including **Amiri**, a font that supports Arabic script, which is loaded via a separate Google Fonts link.
-   **`{{fontLinkRTL}}`**: An extra `<link>` tag is added to the HTML `<head>` to import the Amiri font stylesheet.
-   **`{{rtlStyles}}`**: A block of additional CSS rules is injected to handle RTL-specific layout adjustments, such as `direction: rtl` on specific containers and text alignment.

### 3. Content Localization

-   **Labels**: All static text labels within the pass (e.g., "Date", "Time", "Venue") are replaced with their Arabic translations.
-   **Date & Time**: The `toLocaleDateString` and `toLocaleTimeString` methods are called with the `'ar-EG'` locale to ensure dates and times are formatted according to regional standards.
-   **Footer & Instructions**: The footer disclaimer and QR code instructions are swapped with their Arabic equivalents.

### 4. Dynamic Data

The system correctly renders dynamic data (e.g., guest name, event title) within the RTL layout. The browser's rendering engine, via Puppeteer, handles the character rendering based on the text's intrinsic properties and the `dir="rtl"` attribute.

## How to Trigger RTL Rendering

To generate a PDF pass in Arabic, the caller of `pdfPassService.generatePdfPass` or the `/passes/pdf/:eventId/:guestId` API endpoint must provide the correct language option.

**Example API Call:**
```
GET /api/passes/pdf/your-event-id/your-guest-id?language=ar
```

---
*Maintainer*: Engineering Team 