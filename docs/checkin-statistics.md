# Check-in Statistics Feature

This document outlines the architecture and implementation details for the event check-in statistics feature.

## 1. Feature Overview

The goal of this feature is to provide event staff with a real-time dashboard displaying key metrics related to guest check-ins. This allows for better monitoring of event ingress and provides valuable data for post-event analysis.

## 2. Backend Implementation

The backend is responsible for aggregating check-in data and exposing it through a secure API endpoint.

### 2.1. API Endpoint

- **Endpoint:** `GET /checkin/:eventId/statistics`
- **Description:** Retrieves check-in statistics for a specific event.
- **Permissions:** Requires authenticated user with `staff` or `admin` role.

### 2.2. Data Transfer Object (DTO)

The API will return the following data structure, defined in `statistics.dto.ts`:

```typescript
export class CheckinStatisticsDto {
  total_guests: number;
  checked_in_count: number;
  checkin_percentage: number;
  
  by_tier: Array<{
    tier_id: string;
    tier_name: string;
    total_guests: number;
    checked_in_count: number;
  }>;
  
  timeline: Array<{
    hour: string; // e.g., "18:00"
    count: number;
  }>;
}
```

### 2.3. Service Logic (`checkin.service.ts`)

The `getStatisticsForEvent` method will perform the following steps:
1.  Verify the event exists.
2.  Fetch all guests for the event to get the `total_guests` count and the breakdown by tier.
3.  Fetch all check-in records for the event.
4.  Calculate the `checked_in_count` and overall `checkin_percentage`.
5.  Group check-in records by tier to populate the `by_tier` array.
6.  Group check-in records by the hour of their timestamp to create the `timeline` data.
7.  Return the fully populated `CheckinStatisticsDto`.

## 3. Frontend Implementation

The frontend will fetch the statistics data and display it in a user-friendly modal dialog with visualizations.

### 3.1. API Client (`checkin-api.ts`)

A new function `getStatistics(eventId: string)` will be added to the `checkinApi` object to call the backend endpoint.

### 3.2. Charting Library

We will use `recharts` for data visualization due to its simplicity and good integration with React. This will be added as a new dependency.

### 3.3. Components

- **`StatisticsView.tsx`**: This will be the main component for the dashboard. It will fetch data on mount and render the charts and key metrics. It will include:
  - A bar chart for the check-in breakdown by tier.
  - A line chart for the check-in timeline.
  - Display cards for the total checked-in count and percentage.

- **`CheckinInterface.tsx`**: A button will be added to the header of this component to open the `StatisticsView` in a modal.

- **Modal Implementation**: We will use a pre-existing modal or create a new generic one to host the `StatisticsView`. 