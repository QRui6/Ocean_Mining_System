# Typhoon Region API

This document describes the region-level historical typhoon events endpoint.

## Endpoint

```http
GET /api/mining-regions/{regionId}/typhoon/events
```

Compatibility endpoint:

```http
GET /api/mining-regions/code/{regionCode}/typhoon/events
```

## Query Parameters

- `startYear`: optional, defaults to `2000`
- `endYear`: optional, defaults to the current year
- `bufferKm`: optional, defaults to `300`
- `impactLevel`: optional, one of `core`, `strong`, `outer`
- `page`: optional, defaults to `1`
- `pageSize`: optional, defaults to `20`, max `200`
- `sort`: optional, one of `season_desc`, `season_asc`, `min_distance`, `max_wind`

## Response Fields

- `regionId`
- `regionCode`
- `regionName`
- `startYear`
- `endYear`
- `bufferKm`
- `impactLevel`
- `page`
- `pageSize`
- `total`
- `items`

`items` has the same structure as `/api/mining-areas/{areaId}/typhoon/events`.

## Notes

- Recommended frontend route: use `regionId`, for example `48`.
- `regionCode` remains available for compatibility and backend debugging.
- Current region codes come from `mining_regions.region_code`.
- Optional supporting PostgreSQL indexes are provided in [optimize_typhoon_queries.sql](/d:/船讯网/project02/Ocean_Mining_System_backend/optimize_typhoon_queries.sql:1).
