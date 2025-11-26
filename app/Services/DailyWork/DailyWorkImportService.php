<?php

namespace App\Services\DailyWork;

use App\Imports\DailyWorkImport;
use App\Models\DailyWork;
use App\Models\DailyWorkSummary;
use App\Models\Jurisdiction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class DailyWorkImportService
{
    private DailyWorkValidationService $validationService;

    public function __construct(DailyWorkValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    /**
     * Process Excel/CSV import
     */
    public function processImport(Request $request): array
    {
        $this->validationService->validateImportFile($request);

        $path = $request->file('file')->store('temp');
        $importedSheets = Excel::toArray(new DailyWorkImport, $path);

        // First pass: Validate all sheets
        foreach ($importedSheets as $sheetIndex => $importedDailyWorks) {
            if (empty($importedDailyWorks)) {
                continue;
            }

            $this->validationService->validateImportedData($importedDailyWorks, $sheetIndex);
        }

        // Second pass: Process the data
        $results = [];
        foreach ($importedSheets as $sheetIndex => $importedDailyWorks) {
            if (empty($importedDailyWorks)) {
                continue;
            }

            $result = $this->processSheet($importedDailyWorks, $sheetIndex);
            $results[] = $result;
        }

        return $results;
    }

    /**
     * Process a single sheet of daily works
     */
    private function processSheet(array $importedDailyWorks, int $sheetIndex): array
    {
        $date = $importedDailyWorks[0][0];
        $inChargeSummary = [];
        $processedRfiNumbers = []; // Track RFI numbers processed in this batch
        $warnings = []; // Track all warnings/errors for reporting
        $successCount = 0;
        $rowNumber = 1; // Track row number for better error reporting

        foreach ($importedDailyWorks as $importedDailyWork) {
            $rowNumber++;
            $rfiNumber = $importedDailyWork[1] ?? 'Unknown';
            $location = $importedDailyWork[4] ?? 'Unknown';

            // Check for missing required fields
            $missingFields = [];
            if (empty($importedDailyWork[0])) {
                $missingFields[] = 'Date';
            }
            if (empty($importedDailyWork[1])) {
                $missingFields[] = 'RFI Number';
            }
            if (empty($importedDailyWork[2])) {
                $missingFields[] = 'Work Type';
            }
            if (empty($importedDailyWork[3])) {
                $missingFields[] = 'Description';
            }
            if (empty($importedDailyWork[4])) {
                $missingFields[] = 'Location/Chainage';
            }

            if (! empty($missingFields)) {
                $warnings[] = [
                    'row' => $rowNumber,
                    'rfi_number' => $rfiNumber,
                    'location' => $location,
                    'type' => 'missing_data',
                    'message' => 'Missing required fields: '.implode(', ', $missingFields),
                    'severity' => 'error',
                ];

                continue; // Skip this row
            }

            // Check if this RFI number was already processed in this batch
            if (in_array($rfiNumber, $processedRfiNumbers)) {
                $warnings[] = [
                    'row' => $rowNumber,
                    'rfi_number' => $rfiNumber,
                    'location' => $location,
                    'type' => 'duplicate',
                    'message' => 'Duplicate RFI number in same upload batch',
                    'severity' => 'warning',
                ];
                Log::warning("Skipping duplicate RFI number in same batch: {$rfiNumber}");

                continue;
            }

            $result = $this->processDailyWorkRow($importedDailyWork, $date, $inChargeSummary, $rowNumber);

            if ($result['processed']) {
                $inChargeSummary = $result['summary'];
                $processedRfiNumbers[] = $rfiNumber;
                $successCount++;
            } else {
                // Add warning for failed processing
                $warnings[] = [
                    'row' => $rowNumber,
                    'rfi_number' => $rfiNumber,
                    'location' => $location,
                    'type' => $result['error_type'] ?? 'processing_error',
                    'message' => $result['error_message'] ?? 'Failed to process RFI',
                    'severity' => 'error',
                    'details' => $result['error_details'] ?? null,
                ];
            }
        }

        // Create or update daily summaries
        $this->createDailySummaries($inChargeSummary, $date);

        return [
            'sheet' => $sheetIndex + 1,
            'date' => $date,
            'summaries' => $inChargeSummary,
            'total_rows' => count($importedDailyWorks),
            'processed_count' => $successCount,
            'failed_count' => count($warnings),
            'warnings' => $warnings,
        ];
    }

    /**
     * Process a single daily work row
     */
    private function processDailyWorkRow(array $importedDailyWork, string $date, array &$inChargeSummary, int $rowNumber): array
    {
        $location = $importedDailyWork[4];
        $rfiNumber = $importedDailyWork[1];

        // Extract chainages and find jurisdiction
        $jurisdiction = $this->findJurisdictionForLocation($location);

        if (! $jurisdiction) {
            Log::warning("Row {$rowNumber}: No jurisdiction found for location: {$location}");

            // Get available jurisdiction ranges for helpful error message
            $jurisdictions = Jurisdiction::select('name', 'start_chainage', 'end_chainage')
                ->orderBy('start_chainage')
                ->get();

            $jurisdictionRanges = $jurisdictions->map(function ($j) {
                return "{$j->name}: {$j->start_chainage} to {$j->end_chainage}";
            })->join(', ');

            return [
                'processed' => false,
                'summary' => $inChargeSummary,
                'error_type' => 'jurisdiction_not_found',
                'error_message' => "No jurisdiction found for location: {$location}",
                'error_details' => [
                    'available_jurisdictions' => $jurisdictionRanges,
                    'parsed_location' => $this->parseLocationChainage($location),
                ],
            ];
        }

        $inCharge = $jurisdiction->incharge;
        $inChargeUser = User::find($inCharge);

        // Check if incharge user exists
        if (! $inChargeUser) {
            Log::warning("Row {$rowNumber}: Incharge user not found for jurisdiction: {$jurisdiction->name}");

            return [
                'processed' => false,
                'summary' => $inChargeSummary,
                'error_type' => 'incharge_not_found',
                'error_message' => "Incharge user (ID: {$inCharge}) not found for jurisdiction {$jurisdiction->name}",
                'error_details' => [
                    'jurisdiction' => $jurisdiction->name,
                    'incharge_id' => $inCharge,
                ],
            ];
        }

        $inChargeName = $inChargeUser->user_name;

        // Initialize incharge summary if not exists
        if (! isset($inChargeSummary[$inCharge])) {
            $inChargeSummary[$inCharge] = [
                'totalDailyWorks' => 0,
                'resubmissions' => 0,
                'embankment' => 0,
                'structure' => 0,
                'pavement' => 0,
            ];
        }

        // Update summary counters
        $inChargeSummary[$inCharge]['totalDailyWorks']++;
        $this->updateTypeCounter($inChargeSummary[$inCharge], $importedDailyWork[2]);

        try {
            // Check for existing daily work
            $existingDailyWork = DailyWork::where('number', $rfiNumber)->first();

            if ($existingDailyWork) {
                // This is a resubmission - update the existing RFI
                $this->handleResubmission($existingDailyWork, $importedDailyWork, $inChargeSummary[$inCharge]);
            } else {
                // This is a new submission
                $this->createNewDailyWork($importedDailyWork, $inCharge);
            }

            return ['processed' => true, 'summary' => $inChargeSummary];
        } catch (\Exception $e) {
            Log::error("Row {$rowNumber}: Error creating/updating daily work: {$e->getMessage()}");

            return [
                'processed' => false,
                'summary' => $inChargeSummary,
                'error_type' => 'database_error',
                'error_message' => "Database error: {$e->getMessage()}",
                'error_details' => [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ],
            ];
        }
    }

    /**
     * Find jurisdiction for a given location
     */
    private function findJurisdictionForLocation(string $location): ?Jurisdiction
    {
        // Regex for extracting start and end chainages
        $chainageRegex = '/(.*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)-(.*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)|(.*K[0-9]+)(.*)/';

        if (preg_match($chainageRegex, $location, $matches)) {
            $startChainage = $matches[1] === '' ? $matches[0] : $matches[1];
            $endChainage = $matches[2] === '' ? null : $matches[2];

            $startChainageFormatted = $this->formatChainage($startChainage);
            $endChainageFormatted = $endChainage ? $this->formatChainage($endChainage) : null;

            $jurisdictions = Jurisdiction::all();

            foreach ($jurisdictions as $jurisdiction) {
                $formattedStartJurisdiction = $this->formatChainage($jurisdiction->start_chainage);
                $formattedEndJurisdiction = $this->formatChainage($jurisdiction->end_chainage);

                // Check if the start chainage is within the jurisdiction's range
                if ($startChainageFormatted >= $formattedStartJurisdiction &&
                    $startChainageFormatted <= $formattedEndJurisdiction) {
                    Log::info('Jurisdiction Match Found: '.$formattedStartJurisdiction.'-'.$formattedEndJurisdiction);

                    return $jurisdiction;
                }

                // If an end chainage exists, check if it's within the jurisdiction's range
                if ($endChainageFormatted &&
                    $endChainageFormatted >= $formattedStartJurisdiction &&
                    $endChainageFormatted <= $formattedEndJurisdiction) {
                    Log::info('Jurisdiction Match Found for End Chainage: '.$formattedStartJurisdiction.'-'.$formattedEndJurisdiction);

                    return $jurisdiction;
                }
            }
        }

        return null;
    }

    /**
     * Format chainage for comparison
     */
    private function formatChainage(string $chainage): string
    {
        // Remove spaces and convert to uppercase
        $chainage = strtoupper(trim($chainage));

        // Extract K number and additional values
        if (preg_match('/K(\d+)(?:\+(\d+(?:\.\d+)?))?/', $chainage, $matches)) {
            $kNumber = (int) $matches[1];
            $additional = isset($matches[2]) ? (float) $matches[2] : 0;

            // Convert to a comparable format (e.g., K05+900 becomes 5.900)
            return sprintf('%d.%03d', $kNumber, $additional);
        }

        return $chainage;
    }

    /**
     * Update type counter in summary
     */
    private function updateTypeCounter(array &$summary, string $type): void
    {
        switch ($type) {
            case 'Embankment':
                $summary['embankment']++;
                break;
            case 'Structure':
                $summary['structure']++;
                break;
            case 'Pavement':
                $summary['pavement']++;
                break;
        }
    }

    /**
     * Handle resubmission of existing daily work
     */
    private function handleResubmission(DailyWork $existingDailyWork, array $importedDailyWork, array &$summary): void
    {
        $summary['resubmissions']++;

        // Increment resubmission count
        $resubmissionCount = ($existingDailyWork->resubmission_count ?? 0) + 1;
        $resubmissionDetails = $this->getResubmissionDetails($resubmissionCount);

        // Update the existing daily work with resubmission info
        $existingDailyWork->update([
            'resubmission_count' => $resubmissionCount,
            'resubmission_date' => Carbon::now(),
            'inspection_details' => $resubmissionDetails,
            // Update other fields from the import
            'type' => $importedDailyWork[2],
            'description' => $importedDailyWork[3],
            'location' => $importedDailyWork[4],
            'qty_layer' => $importedDailyWork[5] ?? null,
            'side' => $importedDailyWork[6] ?? null,
            'planned_time' => $importedDailyWork[7] ?? null,
        ]);
    }

    /**
     * Create new daily work
     */
    private function createNewDailyWork(array $importedDailyWork, int $inChargeId): void
    {
        DailyWork::create([
            'date' => $importedDailyWork[0],
            'number' => $importedDailyWork[1],
            'status' => DailyWork::STATUS_NEW,
            'type' => $importedDailyWork[2],
            'description' => $importedDailyWork[3],
            'location' => $importedDailyWork[4],
            'qty_layer' => $importedDailyWork[5] ?? null,
            'side' => $importedDailyWork[6] ?? null,
            'planned_time' => $importedDailyWork[7] ?? null,
            'incharge' => $inChargeId,
            'assigned' => null, // Don't auto-assign to incharge
        ]);
    }

    /**
     * Get resubmission date
     */
    private function getResubmissionDate(DailyWork $existingDailyWork, int $resubmissionCount): string
    {
        if ($resubmissionCount === 1) {
            return $existingDailyWork->resubmission_date ?? $this->getOrdinalNumber($resubmissionCount).' Resubmission on '.Carbon::now()->format('jS F Y');
        }

        return $this->getOrdinalNumber($resubmissionCount).' Resubmission on '.Carbon::now()->format('jS F Y');
    }

    /**
     * Get resubmission details text for inspection_details field
     */
    private function getResubmissionDetails(int $resubmissionCount): string
    {
        return $this->getOrdinalNumber($resubmissionCount).' Resubmission on '.Carbon::now()->format('jS F Y');
    }

    /**
     * Get ordinal number (1st, 2nd, 3rd, etc.)
     */
    private function getOrdinalNumber(int $number): string
    {
        if (! in_array(($number % 100), [11, 12, 13])) {
            switch ($number % 10) {
                case 1: return $number.'st';
                case 2: return $number.'nd';
                case 3: return $number.'rd';
            }
        }

        return $number.'th';
    }

    /**
     * Create or update daily summaries
     */
    private function createDailySummaries(array $inChargeSummary, string $date): void
    {
        foreach ($inChargeSummary as $inChargeId => $summary) {
            DailyWorkSummary::updateOrCreate(
                ['date' => $date, 'incharge' => $inChargeId],
                [
                    'totalDailyWorks' => $summary['totalDailyWorks'],
                    'resubmissions' => $summary['resubmissions'],
                    'embankment' => $summary['embankment'],
                    'structure' => $summary['structure'],
                    'pavement' => $summary['pavement'],
                ]
            );
        }
    }

    /**
     * Parse location chainage for error reporting
     */
    private function parseLocationChainage(string $location): array
    {
        $chainageRegex = '/(.*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)-(.*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)|(.*K[0-9]+)(.*)/';

        if (preg_match($chainageRegex, $location, $matches)) {
            $startChainage = $matches[1] === '' ? $matches[0] : $matches[1];
            $endChainage = $matches[2] === '' ? null : $matches[2];

            return [
                'original' => $location,
                'start_chainage' => $startChainage,
                'end_chainage' => $endChainage,
                'formatted_start' => $this->formatChainage($startChainage),
                'formatted_end' => $endChainage ? $this->formatChainage($endChainage) : null,
            ];
        }

        return [
            'original' => $location,
            'error' => 'Could not parse chainage format',
        ];
    }

    /**
     * Download Excel template for daily works import
     */
    public function downloadTemplate()
    {
        // Create sample data for the template
        $templateData = [
            ['Date', 'RFI Number', 'Work Type', 'Description', 'Location/Chainage', 'Quantity/Layer', 'Side (Optional)', 'Time (Optional)'],
            ['4/27/2025', 'S2025-0425-9663', 'Structure', 'Isolation Barrier (Type-2, Steel Post) Installation Work', 'K05+560-K05+660', '150 MT', 'TR-R', '3:00 PM'],
            ['4/27/2025', 'E2025-0426-14687', 'Embankment', 'Embankment Compaction and Grading Work', 'K06+100-K06+250', '2 Layers', 'TR-L', '9:00 AM'],
            ['4/27/2025', 'P2025-0427-3180', 'Pavement', 'Asphalt Pavement Laying and Compaction', 'K07+300-K07+500', '500 SQM', 'SR-R', '4:00 PM'],
            ['4/28/2025', 'S2025-0428-1234, E2025-0428-5678', 'Structure', 'Bridge Foundation Excavation Work', 'K08+200-K08+350', '75 MT', 'SR-L', '10:00 AM'],
        ];

        // Create a temporary file
        $filename = 'daily_works_import_template_'.date('Y-m-d_H-i-s').'.xlsx';
        $tempPath = storage_path('app/temp/'.$filename);

        // Ensure temp directory exists
        if (! file_exists(dirname($tempPath))) {
            mkdir(dirname($tempPath), 0755, true);
        }

        // Create Excel file with template data
        Excel::store(new class($templateData) implements \Maatwebsite\Excel\Concerns\FromArray
        {
            private $data;

            public function __construct($data)
            {
                $this->data = $data;
            }

            public function array(): array
            {
                return $this->data;
            }
        }, 'temp/'.$filename);

        // Return download response
        return response()->download($tempPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
