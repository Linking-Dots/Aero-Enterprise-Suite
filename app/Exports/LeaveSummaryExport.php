<?php

namespace App\Exports;

use App\Services\Leave\LeaveSummaryService;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Border;

class LeaveSummaryExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings
{
    protected $filters;

    protected $summaryService;

    public function __construct(array $filters)
    {
        $this->filters = $filters;
        $this->summaryService = app(LeaveSummaryService::class);
    }

    public function collection()
    {
        $summaryData = $this->summaryService->generateLeaveSummary($this->filters);
        $data = $summaryData['data'] ?? [];

        $rows = collect();
        $counter = 1;

        foreach ($data as $employee) {
            $rows->push([
                'No.' => $counter++,
                'Employee Name' => $employee['employee_name'] ?? 'N/A',
                'Department' => $employee['department'] ?? 'N/A',
                'January' => $employee['JAN'] ?? 0,
                'February' => $employee['FEB'] ?? 0,
                'March' => $employee['MAR'] ?? 0,
                'April' => $employee['APR'] ?? 0,
                'May' => $employee['MAY'] ?? 0,
                'June' => $employee['JUN'] ?? 0,
                'July' => $employee['JUL'] ?? 0,
                'August' => $employee['AUG'] ?? 0,
                'September' => $employee['SEP'] ?? 0,
                'October' => $employee['OCT'] ?? 0,
                'November' => $employee['NOV'] ?? 0,
                'December' => $employee['DEC'] ?? 0,
                'Total Approved' => $employee['total_approved'] ?? 0,
                'Total Pending' => $employee['total_pending'] ?? 0,
                'Total Balance' => $employee['total_balance'] ?? 0,
                'Usage Percentage' => ($employee['usage_percentage'] ?? 0).'%',
            ]);
        }

        return $rows;
    }

    public function headings(): array
    {
        return [
            'No.',
            'Employee Name',
            'Department',
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
            'Total Approved',
            'Total Pending',
            'Total Balance',
            'Usage Percentage',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $summaryData = $this->summaryService->generateLeaveSummary($this->filters);
                $stats = $summaryData['stats'] ?? [];

                $firstDataRow = 2;
                $lastDataRow = $sheet->getHighestDataRow();
                $totalEmployees = $stats['total_employees'] ?? 0;
                $totalApproved = $stats['total_approved_leaves'] ?? 0;
                $totalPending = $stats['total_pending_leaves'] ?? 0;
                $totalDepartments = $stats['departments_count'] ?? 0;

                // Insert header rows
                $sheet->insertNewRowBefore(1, 3);

                // ====== Title ======
                $sheet->mergeCells('A1:S1');
                $sheet->setCellValue('A1', 'Leave Summary Report - '.($this->filters['year'] ?? now()->year));
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

                // ====== Generated on ======
                $sheet->mergeCells('A2:S2');
                $sheet->setCellValue('A2', 'Generated on: '.now()->format('F d, Y h:i A'));
                $sheet->getStyle('A2')->getAlignment()->setHorizontal('center');

                // ====== Summary statistics ======
                $sheet->mergeCells('A3:S3');
                $summaryText = "Total Employees: {$totalEmployees} | Approved Leaves: {$totalApproved} | Pending Leaves: {$totalPending} | Departments: {$totalDepartments}";
                $sheet->setCellValue('A3', $summaryText);
                $sheet->getStyle('A3')->getAlignment()->setHorizontal('center');
                $sheet->getStyle('A3')->getFont()->setBold(true);

                // ====== Style the headers ======
                $sheet->getStyle('A4:S4')->getFont()->setBold(true);
                $sheet->getStyle('A4:S4')->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('E3F2FD');
                $sheet->getStyle('A4:S4')->getAlignment()->setHorizontal('center');

                // ====== Borders for the full range ======
                $highestRow = $sheet->getHighestRow();
                $highestCol = $sheet->getHighestColumn();
                $sheet->getStyle("A1:{$highestCol}{$highestRow}")
                    ->getBorders()->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN);
                $sheet->getStyle("A4:{$highestCol}{$highestRow}")
                    ->getAlignment()->setHorizontal('center');

                // ====== Freeze pane after headers ======
                $sheet->freezePane('A5');
            },
        ];
    }
}
