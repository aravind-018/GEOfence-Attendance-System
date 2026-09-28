/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 (Workplace)
 * @param lon1 Longitude of point 1 (Workplace)
 * @param lat2 Latitude of point 2 (Employee)
 * @param lon2 Longitude of point 2 (Employee)
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000; // Earth's mean radius in meters

  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export interface GeofenceValidationParams {
  workplaceLat: number;
  workplaceLon: number;
  radiusMeters: number;
  maxGpsAccuracyMeters: number;
  employeeLat: number;
  employeeLon: number;
  gpsAccuracyMeters: number;
}

export interface GeofenceValidationResult {
  isValid: boolean;
  isInsideGeofence: boolean;
  isAccuracyAcceptable: boolean;
  distanceMeters: number;
  radiusMeters: number;
  gpsAccuracyMeters: number;
  maxGpsAccuracyMeters: number;
  reason?: "OUTSIDE_GEOFENCE" | "POOR_GPS_ACCURACY" | "INVALID_COORDINATES";
  message: string;
}

export function validateGeofence({
  workplaceLat,
  workplaceLon,
  radiusMeters,
  maxGpsAccuracyMeters,
  employeeLat,
  employeeLon,
  gpsAccuracyMeters,
}: GeofenceValidationParams): GeofenceValidationResult {
  // 1. Coordinate range validation
  if (
    isNaN(employeeLat) ||
    isNaN(employeeLon) ||
    employeeLat < -90 ||
    employeeLat > 90 ||
    employeeLon < -180 ||
    employeeLon > 180
  ) {
    return {
      isValid: false,
      isInsideGeofence: false,
      isAccuracyAcceptable: false,
      distanceMeters: 0,
      radiusMeters,
      gpsAccuracyMeters,
      maxGpsAccuracyMeters,
      reason: "INVALID_COORDINATES",
      message: "Provided GPS coordinates are out of valid range.",
    };
  }

  // 2. Distance calculation
  const distanceRaw = calculateHaversineDistance(
    workplaceLat,
    workplaceLon,
    employeeLat,
    employeeLon
  );
  const distanceMeters = Math.round(distanceRaw * 10) / 10;

  const isInsideGeofence = distanceMeters <= radiusMeters;
  const isAccuracyAcceptable = gpsAccuracyMeters <= maxGpsAccuracyMeters;

  if (!isAccuracyAcceptable) {
    return {
      isValid: false,
      isInsideGeofence,
      isAccuracyAcceptable: false,
      distanceMeters,
      radiusMeters,
      gpsAccuracyMeters,
      maxGpsAccuracyMeters,
      reason: "POOR_GPS_ACCURACY",
      message:
        "Your location accuracy is currently too low to verify attendance. Please move to an area with a better GPS signal and try again.",
    };
  }

  if (!isInsideGeofence) {
    return {
      isValid: false,
      isInsideGeofence: false,
      isAccuracyAcceptable: true,
      distanceMeters,
      radiusMeters,
      gpsAccuracyMeters,
      maxGpsAccuracyMeters,
      reason: "OUTSIDE_GEOFENCE",
      message: "Attendance cannot be marked because you are outside the authorized workplace area.",
    };
  }

  return {
    isValid: true,
    isInsideGeofence: true,
    isAccuracyAcceptable: true,
    distanceMeters,
    radiusMeters,
    gpsAccuracyMeters,
    maxGpsAccuracyMeters,
    message: "Location verified within authorized workplace geofence.",
  };
}
