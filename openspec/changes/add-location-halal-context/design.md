## Context

The current analysis request contains only an image and current-user profile. Tavily receives dish-level candidates but no place context, even though ingredients and preparation can vary by region. The earlier proposal to verify restaurant halal certificates was intentionally dropped: it is too brittle for a short prototype, many small vendors have no searchable certificate, and absence of a record must not create blanket warnings.

## Goals / Non-Goals

**Goals:**

- Let users optionally share browser location or type a city.
- Convert coordinates into a coarse place on the server, then discard them.
- Use city, region, and country only to localize research into common ingredients and preparation.
- Preserve source provenance and degrade safely when permission, reverse geocoding, or research is unavailable.

**Non-Goals:**

- Tracking users, storing coordinates, background permission requests, or address history.
- Looking up or validating restaurant halal certification in this MVP.
- Treating regional recipe evidence as proof of a specific restaurant's ingredients.
- Guaranteeing ingredients, cross-contamination, or religious compliance for every dish.

## Decisions

### User-initiated coarse location

Place `Use my location` beside an optional city field on the scan screen. The browser asks permission only after that action. Coordinates are rounded to two decimal places before one request to a server proxy, are never written to browser storage, and are not included in the analysis request or result. Manual city input works without geolocation and denial never blocks scanning.

### Server-side reverse geocoding

Use Nominatim's public reverse endpoint behind `/api/location/reverse`. The server rounds and validates coordinates again, sends an identifying user agent, requests only address data at city-level zoom, uses a short timeout, and returns a bounded city/region/country response with OpenStreetMap attribution. This is a single user-triggered request, not autocomplete, polling, or bulk geocoding.

### Place-only analysis contract

Add a bounded optional `location` multipart field containing `source`, `city`, `region`, `country`, and `countryCode`. No coordinates or restaurant identity enter the analysis contract. The server validates location independently from profile data, and analysis remains fully functional when it is absent.

### Localized research, not local inference

Attach a human-readable place label to research candidates and instruct the planner to use it only when investigating ingredients or preparation that could differ locally. Fallback Tavily queries include the place. Tavily results remain `common_usage` evidence and never become an `exact_menu` claim.

### Existing halal safety semantics remain authoritative

Explicit pork, lard, or alcohol evidence creates a hard conflict for a halal profile. Evidence of a locally common but uncertain ingredient creates `needs_confirmation`; sparse evidence creates `insufficient_information`; otherwise compatibility remains evidence-aware. Missing certification is not researched and cannot make every dish suspicious. Targeted restaurant questions remain the final check for uncertain preparation.

## Risks / Trade-offs

- [Public reverse geocoder availability] → Use a short timeout, allow manual city, and never block analysis when it fails.
- [Regional evidence can be over-generalized] → Label it `common_usage`, retain source URLs, and require confirmation rather than claiming an exact recipe.
- [Additional research wording can increase query length] → Add one compact place label only to material candidate queries.
- [Location privacy] → Request only on action, round before transport, proxy server-side, discard coordinates, avoid persistence/logging, and clear component state on reset/navigation.

## Migration Plan

1. Add coarse-place and reverse-geocode contracts with deterministic parsing tests.
2. Add the reverse-geocode proxy and analysis request parsing before connecting live orchestration.
3. Localize research planning and then add scan controls using the existing brand system.
4. Run browser tests for permission allowed/denied, manual city, and skipped context.
5. Validate on HTTPS after authorized deployment; rollback by omitting location context.

## Open Questions

- The exact city used in the final demo remains pending with the primary/backup menu images.
