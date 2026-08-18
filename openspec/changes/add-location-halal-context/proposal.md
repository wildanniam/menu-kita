## Why

MenuKita currently researches dish names without knowing where the diner is. The same dish can use different common ingredients or preparation methods across regions, so optional coarse location context can make Tavily research more relevant without pretending to know an exact restaurant recipe.

## What Changes

- Add an optional, user-initiated browser location request with a manual city fallback.
- Reverse-geocode coordinates once through a server proxy and send only city, region, country, and country code into menu analysis.
- Add coarse place context to research planning so Tavily can investigate locally common ingredients and preparation methods for material unknowns.
- Preserve existing halal reasoning: explicit pork, lard, or alcohol conflicts; uncertain local usage requires confirmation; missing certification is not a negative signal.
- Do not add automatic BPJPH/certification lookup to the hackathon MVP.

## Capabilities

### New Capabilities

- `location-context`: Optional place collection, reverse geocoding, privacy behavior, and analysis transport.
- `location-aware-research`: Localized research planning, evidence provenance, and conservative compatibility behavior.

### Modified Capabilities

None.

## Impact

- Extends shared Zod contracts, multipart analysis parsing, scan UI, analysis orchestration, and Tavily query behavior.
- Adds a small server-side reverse-geocoding adapter for OpenStreetMap Nominatim; the browser never sends raw coordinates to the analysis endpoint.
- Adds no authentication, database, persistent location history, restaurant certification lookup, or guarantee of ingredient or religious compliance.
