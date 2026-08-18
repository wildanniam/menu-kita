## 1. Location contracts and request boundaries

- [x] 1.1 Add validated coarse-place and reverse-geocode contracts with privacy-focused schema tests
- [x] 1.2 Add a bounded server-side Nominatim reverse-geocode adapter and API route with deterministic parsing and failure tests
- [x] 1.3 Extend the multipart analysis client/server boundary with optional place-only context and malformed-input tests

## 2. Location-aware research

- [x] 2.1 Carry place context into research candidates, OpenAI planning, and deterministic fallback Tavily queries
- [x] 2.2 Preserve `common_usage` provenance, deterministic compatibility precedence, and targeted confirmation questions with localized-evidence tests

## 3. User experience

- [x] 3.1 Add optional manual city and user-initiated browser-location controls without persistence
- [x] 3.2 Display resolved place, optional/denied guidance, and OpenStreetMap attribution without blocking menu analysis

## 4. Verification and documentation

- [x] 4.1 Run automated and browser checks for permission success/denial, manual city, skipped context, reload, and reset
  - Verified 81 automated tests, production build, explicit spice validation, group join/reload, manual city ephemerality, mocked browser-location resolution, OpenStreetMap attribution, mobile permission denial, and continued upload access.
- [x] 4.2 Document location privacy, research semantics, live-demo inputs, and remaining HTTPS acceptance work
