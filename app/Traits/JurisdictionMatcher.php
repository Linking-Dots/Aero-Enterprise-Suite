<?php

namespace App\Traits;

use App\Models\Jurisdiction;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

trait JurisdictionMatcher
{
    /**
     * Cached jurisdictions collection
     */
    private ?Collection $cachedJurisdictions = null;

    /**
     * Get jurisdictions with caching
     */
    protected function getJurisdictions(): Collection
    {
        if ($this->cachedJurisdictions === null) {
            // Cache jurisdictions for 5 minutes to reduce DB queries during bulk imports
            $this->cachedJurisdictions = Cache::remember('jurisdictions_all', 300, function () {
                return Jurisdiction::all();
            });
        }

        return $this->cachedJurisdictions;
    }

    /**
     * Clear the cached jurisdictions
     */
    protected function clearJurisdictionCache(): void
    {
        $this->cachedJurisdictions = null;
        Cache::forget('jurisdictions_all');
    }

    /**
     * Find jurisdiction for a given location string
     */
    protected function findJurisdictionForLocation(string $location): ?Jurisdiction
    {
        // Regex for extracting start and end chainages
        // Matches patterns like: K30+560-K30+570, K24+800, K13 TOLL STATION
        $chainageRegex = '/([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)\s*-\s*([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)|([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)/';

        if (! preg_match($chainageRegex, $location, $matches)) {
            Log::debug('JurisdictionMatcher: No chainage pattern found in location', ['location' => $location]);

            return null;
        }

        // Extract start and end chainages based on match groups
        $startChainage = ! empty($matches[1]) ? $matches[1] : ($matches[3] ?? null);
        $endChainage = ! empty($matches[2]) ? $matches[2] : null;

        if (! $startChainage) {
            return null;
        }

        $startChainageFormatted = $this->formatChainageToFloat($startChainage);
        $endChainageFormatted = $endChainage ? $this->formatChainageToFloat($endChainage) : null;

        $jurisdictions = $this->getJurisdictions();

        foreach ($jurisdictions as $jurisdiction) {
            $formattedStartJurisdiction = $this->formatChainageToFloat($jurisdiction->start_chainage);
            $formattedEndJurisdiction = $this->formatChainageToFloat($jurisdiction->end_chainage);

            // Check if the start chainage is within the jurisdiction's range
            if ($startChainageFormatted >= $formattedStartJurisdiction &&
                $startChainageFormatted <= $formattedEndJurisdiction) {
                Log::debug('JurisdictionMatcher: Match found for start chainage', [
                    'location' => $location,
                    'jurisdiction' => $formattedStartJurisdiction.'-'.$formattedEndJurisdiction,
                ]);

                return $jurisdiction;
            }

            // If an end chainage exists, check if it's within the jurisdiction's range
            if ($endChainageFormatted &&
                $endChainageFormatted >= $formattedStartJurisdiction &&
                $endChainageFormatted <= $formattedEndJurisdiction) {
                Log::debug('JurisdictionMatcher: Match found for end chainage', [
                    'location' => $location,
                    'jurisdiction' => $formattedStartJurisdiction.'-'.$formattedEndJurisdiction,
                ]);

                return $jurisdiction;
            }
        }

        Log::debug('JurisdictionMatcher: No jurisdiction found', ['location' => $location]);

        return null;
    }

    /**
     * Format chainage string to float for comparison
     *
     * @example K05+900 becomes 5.900
     * @example K30+560 becomes 30.560
     */
    protected function formatChainageToFloat(string $chainage): float
    {
        // Remove spaces and convert to uppercase
        $chainage = strtoupper(trim($chainage));

        // Extract K number and additional values
        if (preg_match('/K(\d+)(?:\+(\d+(?:\.\d+)?))?/', $chainage, $matches)) {
            $kNumber = (int) $matches[1];
            $additional = isset($matches[2]) ? (float) $matches[2] : 0;

            // Convert to a comparable format (e.g., K05+900 becomes 5.900)
            return $kNumber + ($additional / 1000);
        }

        return 0;
    }

    /**
     * Format chainage for display/storage
     */
    protected function formatChainageForDisplay(string $chainage): string
    {
        $chainage = strtoupper(trim($chainage));

        if (preg_match('/K(\d+)(?:\+(\d+(?:\.\d+)?))?/', $chainage, $matches)) {
            $kNumber = (int) $matches[1];
            $additional = isset($matches[2]) ? (int) $matches[2] : 0;

            return sprintf('K%02d+%03d', $kNumber, $additional);
        }

        return $chainage;
    }
}
