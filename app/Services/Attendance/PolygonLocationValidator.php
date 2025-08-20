<?php

namespace App\Services\Attendance;

/**
 * Polygon-based location validation service
 */
class PolygonLocationValidator extends BaseAttendanceValidator
{
    public function validate(): array
    {
        $polygon = $this->attendanceType->config['polygon'] ?? [];
        $lat = $this->request->input('lat');
        $lng = $this->request->input('lng');
        $allowWithoutLocation = $this->attendanceType->config['allow_without_location'] ?? false;

        // Check if location data is missing
        if (! $lat || ! $lng) {
            // If location is not provided, check if we allow attendance without location
            if ($allowWithoutLocation) {
                return $this->successResponse('Attendance recorded without location validation (location access denied).');
            } else {
                return $this->errorResponse('Location coordinates are required for polygon validation. Please enable location access and try again.');
            }
        }

        if (empty($polygon)) {
            return $this->errorResponse('No polygon boundary configured for this attendance type.');
        }

        if (! $this->isPointInPolygon($lat, $lng, $polygon)) {
            return $this->errorResponse('You are not within the allowed location boundary.', 403);
        }

        return $this->successResponse('Location verified within polygon boundary.');
    }

    /**
     * Check if a point is inside a polygon using ray casting algorithm
     */
    private function isPointInPolygon($lat, $lng, $polygon): bool
    {
        $x = $lng;
        $y = $lat;
        $inside = false;

        $count = count($polygon);
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            if ((($polygon[$i]['lat'] > $y) !== ($polygon[$j]['lat'] > $y)) &&
                ($x < ($polygon[$j]['lng'] - $polygon[$i]['lng']) * ($y - $polygon[$i]['lat']) / ($polygon[$j]['lat'] - $polygon[$i]['lat']) + $polygon[$i]['lng'])) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }
}
