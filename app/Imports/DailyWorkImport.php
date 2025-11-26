<?php

namespace App\Imports;

use App\Models\DailyWork;
use Maatwebsite\Excel\Concerns\ToModel;

class DailyWorkImport implements ToModel
{
    public function model(array $row)
    {
        return new DailyWork([
            'date' => $row[0],
            'number' => $row[1],
            'type' => $row[2],
            'description' => $row[3],
            'location' => $row[4],
            'qty_layer' => $row[5],  // Column F
            'side' => $row[6],       // Column G
            'planned_time' => $row[7], // Column H
        ]);
    }
}
