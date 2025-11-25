<?php

namespace App\Http\Controllers;

use App\Exports\AttendanceAdminExport;
use App\Exports\AttendanceExport;
use App\Models\HRM\Attendance;
use App\Models\HRM\AttendanceSetting;
use App\Models\HRM\Holiday;
use App\Models\HRM\LeaveSetting;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Throwable;

class AttendanceController extends Controller
{
    public function index1(): \Inertia\Response
    {
        return Inertia::render('AttendanceAdmin', [
            'allUsers' => User::role('Employee')->get(),
            'title' => 'Attendances of Employees',
        ]);
    }

    public function index2(): \Inertia\Response
    {
        return Inertia::render('AttendanceEmployee', [
            'title' => 'Attendances',
        ]);
    }

    public function index3(): \Inertia\Response
    {
        return Inertia::render('TimeSheet', [
            'title' => 'Time Sheet',
        ]);
    }

    public function paginate(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $perPage = (int) $request->get('perPage', 30);
            $page = (int) $request->get('page', 1);
            $employee = $request->get('employee');
            $currentMonth = $request->get('currentMonth');
            $currentYear = $request->get('currentYear');

            $users = $this->getEmployeeUsersWithAttendanceAndLeaves($currentYear, $currentMonth);
            $leaveTypes = LeaveSetting::all();
            $holidays = $this->getHolidaysForMonth($currentYear, $currentMonth);
            $leaveCountsArray = $this->getLeaveCountsArray($currentYear, $currentMonth);

            // Map user data to attendance
            $attendances = $users->map(function ($user) use ($currentYear, $currentMonth, $holidays, $leaveTypes) {
                return $this->getUserAttendanceData($user, $currentYear, $currentMonth, $holidays, $leaveTypes);
            });

            // Filter first (before pagination)
            if (! empty($employee)) {
                $attendances = $attendances->filter(function ($attendance) use ($employee) {
                    return stripos($attendance['name'], $employee) !== false;
                });
                $page = 1; // Reset page if filtered
            }

            $sortedAttendances = $attendances->sortBy('user_id')->values();
            $total = $sortedAttendances->count();
            $lastPage = ceil($total / $perPage);
            $paginated = $sortedAttendances->slice(($page - 1) * $perPage, $perPage)->values();

            return response()->json([
                'data' => $paginated,
                'total' => $total,
                'page' => $page,
                'last_page' => $lastPage,
                'leaveTypes' => $leaveTypes,
                'leaveCounts' => $leaveCountsArray,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in paginate method: '.$e->getMessage());

            return response()->json(['error' => 'An error occurred while fetching attendance data.'], 500);
        }
    }

    private function getEmployeeUsersWithAttendanceAndLeaves($year, $month)
    {
        return User::whereHas('roles', function ($query) {
            $query->where('name', 'Employee');
        })->with([
            'attendances' => function ($query) use ($year, $month) {
                $query->whereYear('date', $year)
                    ->whereMonth('date', $month);
            },
            'leaves' => function ($query) use ($year, $month) {
                $query->join('leave_settings', 'leaves.leave_type', '=', 'leave_settings.id')
                    ->select('leaves.*', 'leave_settings.type as leave_type')
                    ->where(function ($query) use ($year, $month) {
                        $query->whereYear('leaves.from_date', $year)
                            ->whereMonth('leaves.from_date', $month)
                            ->orWhereYear('leaves.to_date', $year)
                            ->whereMonth('leaves.to_date', $month);
                    })
                    ->orderBy('leaves.from_date', 'desc');
            },
        ])->get();
    }

    private function getHolidaysForMonth($year, $month)
    {
        return Holiday::where(function ($query) use ($year, $month) {
            $query->whereYear('from_date', $year)
                ->whereMonth('from_date', $month)
                ->orWhereYear('to_date', $year)
                ->whereMonth('to_date', $month);
        })->get();
    }

    private function getLeaveCountsArray($year, $month)
    {
        $leaveCounts = DB::table('leaves')
            ->join('leave_settings', 'leaves.leave_type', '=', 'leave_settings.id')
            ->select(
                'leaves.user_id',
                'leave_settings.type as leave_type',
                DB::raw('SUM(DATEDIFF(leaves.to_date, leaves.from_date) + 1) as total_days')
            )
            ->where(function ($query) use ($year, $month) {
                $query->whereYear('leaves.from_date', $year)
                    ->whereMonth('leaves.from_date', $month)
                    ->orWhereYear('leaves.to_date', $year)
                    ->whereMonth('leaves.to_date', $month);
            })
            ->groupBy('leaves.user_id', 'leave_settings.type')
            ->get();

        $leaveCountsArray = [];
        foreach ($leaveCounts as $leave) {
            $userId = $leave->user_id;
            $leaveType = $leave->leave_type;
            $totalDays = $leave->total_days;

            if (! isset($leaveCountsArray[$userId])) {
                $leaveCountsArray[$userId] = [
                    'Casual' => 0,
                    'Sick' => 0,
                    'Weekend' => 0,
                    'Earned' => 0,
                ];
            }
            $leaveCountsArray[$userId][$leaveType] = $totalDays;
        }

        return $leaveCountsArray;
    }

    public function getUserAttendanceData($user, $year, $month, $holidays, $leaveTypes)
    {
        $daysInMonth = Carbon::create($year, $month)->daysInMonth;
        $attendanceData = [
            'user_id' => $user->id,
            'employee_id' => $user->employee_id,
            'name' => $user->name,
            'profile_image_url' => $user->profile_image_url,
        ];

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = Carbon::create($year, $month, $day);
            $dateString = $date->toDateString();

            $attendancesForDate = $user->attendances
                ->filter(fn ($a) => Carbon::parse($a->date)->isSameDay($date))
                ->sortBy('punchin');

            $holiday = $holidays->first(fn ($h) => $date->between(
                Carbon::parse($h->from_date)->startOfDay(),
                Carbon::parse($h->to_date)->endOfDay()
            ));
            $leave = $user->leaves
                ->first(fn ($l) => $date->between(
                    Carbon::parse($l->from_date)->startOfDay(),
                    Carbon::parse($l->to_date)->endOfDay()
                ));

            // Defaults
            $symbol = '▼';
            $punchIn = null;
            $punchOut = null;
            $totalWorkHours = '00:00';
            $remarks = 'Absent';

            if ($holiday && ! $leave) {
                if ($attendancesForDate->isNotEmpty()) {
                    $first = $attendancesForDate->first();
                    $last = $attendancesForDate->count() === 1 ? $first : $attendancesForDate->reverse()->first(fn ($item) => $item->punchout !== null);

                    $totalMinutes = 0;
                    foreach ($attendancesForDate as $attendance) {
                        if ($attendance->punchin && $attendance->punchout) {
                            $in = Carbon::parse($attendance->punchin);
                            $out = Carbon::parse($attendance->punchout);
                            if ($out->lt($in)) {
                                $out->addDay();
                            }
                            $totalMinutes += $in->diffInMinutes($out);
                        }
                    }

                    $hours = floor($totalMinutes / 60);
                    $mins = $totalMinutes % 60;
                    $totalWorkHours = sprintf('%02d:%02d', $hours, $mins);
                    $symbol = '√';
                    $remarks = $totalMinutes > 0 ? 'Present on Holiday' : ((now()->toDateString() === $date) ? 'Currently Working' : 'Not Punched Out');
                    $punchIn = $first->punchin;
                    $punchOut = $last ? $last->punchout : null;
                } else {
                    $symbol = '#';
                    $remarks = 'Holiday';
                }
            } elseif ($leave) {
                $symbol = $leaveTypes->firstWhere('id', $leave->leave_type)->symbol ?? '/';
                $remarks = 'On Leave';
            } elseif ($attendancesForDate->isNotEmpty()) {
                $first = $attendancesForDate->first();
                $last = $attendancesForDate->count() === 1 ? $first : $attendancesForDate->reverse()->first(fn ($item) => $item->punchout !== null);

                $totalMinutes = 0;
                foreach ($attendancesForDate as $attendance) {
                    if ($attendance->punchin && $attendance->punchout) {
                        $in = Carbon::parse($attendance->punchin);
                        $out = Carbon::parse($attendance->punchout);
                        if ($out->lt($in)) {
                            $out->addDay();
                        }
                        $totalMinutes += $in->diffInMinutes($out);
                    }
                }

                $hours = floor($totalMinutes / 60);
                $mins = $totalMinutes % 60;
                $totalWorkHours = sprintf('%02d:%02d', $hours, $mins);
                $symbol = '√';
                $remarks = $totalMinutes > 0 ? 'Present' : ($date->isToday() ? 'Currently Working' : 'Not Punched Out');
                $punchIn = $first->punchin;
                $punchOut = $last ? $last->punchout : null;
            } elseif ($holiday && ! $attendancesForDate->isNotEmpty()) {
                $symbol = '#';
                $remarks = 'Holiday';
            }

            $attendanceData[$dateString] = [
                'status' => $symbol,
                'punch_in' => $punchIn,
                'punch_out' => $punchOut,
                'total_work_hours' => $totalWorkHours,
                'remarks' => $remarks,
            ];
        }

        return $attendanceData;
    }

    public function updateAttendance(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Validate the incoming request data
            $validatedData = $request->validate([
                'user_id' => 'required|integer',
                'date' => 'required|date',
                'symbol' => 'required|string|max:255', // Add appropriate validation rules
            ]);

            // Extract validated data
            $userId = $validatedData['user_id'];
            $date = $validatedData['date'];
            $symbol = $validatedData['symbol'];

            // Check if the attendance record already exists
            $attendance = Attendance::where('user_id', $userId)->whereDate('date', $date)->first();

            // If the record doesn't exist, create a new one
            if (! $attendance) {
                $attendance = new Attendance;
                $attendance->user_id = $userId;
                $attendance->date = $date;
            }

            // Update the symbol
            $attendance->symbol = $symbol;
            $attendance->save();

            // Return a success response
            return response()->json(['message' => 'Attendance updated successfully']);
        } catch (\Exception $e) {
            // Handle exceptions
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function punch(Request $request)
    {
        $user = Auth::user();

        // 1. Get the user's attendance type (with config)
        $attendanceType = $user->attendanceType; // Eloquent relation

        if (! $attendanceType || ! $attendanceType->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'No active attendance type assigned to user.',
            ], 422);
        }

        // 2. Check for existing punch status today
        $today = Carbon::today();
        $latestAttendance = Attendance::where('user_id', $user->id)
            ->whereDate('date', $today)
            ->latest('punchin')
            ->first();

        // The punch service will handle the logic automatically
        // No need for manual punch_type validation here

        // 2. Validate attendance based on type configuration
        $validation = $this->validateAttendanceType($attendanceType, $request);
        if ($validation['status'] === 'error') {
            return response()->json($validation, $validation['code']);
        }

        // 3. Process the punch using the service
        $punchService = new \App\Services\Attendance\AttendancePunchService;
        $result = $punchService->processPunch($user, $request);

        if ($result['status'] === 'error') {
            return response()->json($result, $result['code']);
        }

        return response()->json($result);
    }

    /**
     * Validate attendance based on type configuration
     */
    private function validateAttendanceType($attendanceType, Request $request)
    {
        try {
            $validator = \App\Services\Attendance\AttendanceValidatorFactory::create($attendanceType, $request);

            return $validator->validate();
        } catch (\InvalidArgumentException $e) {
            return [
                'status' => 'error',
                'message' => 'Invalid attendance type configuration: '.$e->getMessage(),
                'code' => 422,
            ];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Attendance validation error: '.$e->getMessage());

            return [
                'status' => 'error',
                'message' => 'Validation failed. Please try again.',
                'code' => 500,
            ];
        }
    }

    public function punchIn(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Validate incoming request data
            $request->validate([
                'user_id' => 'required|integer',
                'location' => 'required',
            ]);

            // Get the current user
            $currentUser = Auth::user();
            $today = Carbon::today();

            // Attempt to create or update the attendance record
            Attendance::create([
                'user_id' => $request->user_id,
                'date' => Carbon::today(),
                'punchin' => Carbon::now(),
                'punchin_location' => $request->location,
            ]);

            // Return success response with no punches if there are none
            return response()->json([
                'success' => true,
                'message' => 'Successfully punched in!',
            ]);
        } catch (\Exception $e) {
            // Handle exceptions
            return response()->json(['error' => $e->getMessage()]);
        }
    }

    public function punchOut(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Validate incoming request data
            $request->validate([
                'user_id' => 'required|integer', // Assuming user_id should be an integer
                'location' => 'required',
            ]);

            // Find the attendance record for the user and date
            $attendance = Attendance::where('user_id', $request->user_id)
                ->where('date', Carbon::today())
                ->latest()
                ->firstOrFail();

            // Update punchout and punchout_location fields
            $attendance->punchout = Carbon::now();
            $attendance->punchout_location = $request->location;
            $attendance->save();

            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Successfully punched out!',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // Handle the case where the attendance record is not found
            return response()->json(['error' => 'Attendance record not found.'], 404);
        } catch (\Exception $e) {
            // Handle other exceptions
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getUserLocationsForDate(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $selectedDate = Carbon::parse($request->query('date'))->format('Y-m-d');

            $attendances = Attendance::with(['user.designation', 'user.attendanceType', 'media'])
                ->whereNotNull('punchin')
                ->whereDate('date', $selectedDate)
                ->orderBy('user_id')
                ->orderBy('punchin')
                ->get();

            // Group attendances by user to handle multiple cycles
            $userAttendances = $attendances->groupBy('user_id');

            $locations = [];

            // Fetch ALL active attendance types with geo_polygon or route_waypoint configs
            // This ensures boundaries are always shown on the map regardless of who punched in
            $allAttendanceTypes = \App\Models\HRM\AttendanceType::where('is_active', true)
                ->whereNotNull('config')
                ->get();

            $attendanceTypeConfigs = [];
            foreach ($allAttendanceTypes as $attendanceType) {
                $baseSlug = preg_replace('/_\d+$/', '', $attendanceType->slug);

                // Only include types with polygon or route configs
                if (in_array($baseSlug, ['geo_polygon', 'route_waypoint'])) {
                    $config = $attendanceType->config;

                    // Check if config has actual data
                    $hasPolygonData = ! empty($config['polygon']) || ! empty($config['polygons']);
                    $hasRouteData = ! empty($config['waypoints']) || ! empty($config['routes']);

                    if ($hasPolygonData || $hasRouteData) {
                        $attendanceTypeConfigs[$attendanceType->id] = [
                            'id' => $attendanceType->id,
                            'name' => $attendanceType->name,
                            'slug' => $attendanceType->slug,
                            'base_slug' => $baseSlug,
                            'config' => $config,
                        ];
                    }
                }
            }

            foreach ($userAttendances as $userId => $userPunches) {
                $user = $userPunches->first()->user;
                $attendanceType = $user->attendanceType;
                $baseSlug = $attendanceType ? preg_replace('/_\d+$/', '', $attendanceType->slug) : null;
                $requiresPhoto = in_array($baseSlug, ['geo_polygon', 'route_waypoint']);

                $cycles = $userPunches->map(function ($attendance) use ($requiresPhoto) {
                    return [
                        'attendance_id' => $attendance->id,
                        'punchin_location' => $attendance->punchin_location_array ?? null,
                        'punchout_location' => $attendance->punchout_location_array ?? null,
                        'punchin_time' => $attendance->punchin,
                        'punchout_time' => $attendance->punchout,
                        'punchin_photo_url' => $requiresPhoto ? $attendance->punchin_photo_url : null,
                        'punchout_photo_url' => $requiresPhoto ? $attendance->punchout_photo_url : null,
                        'is_complete' => ! is_null($attendance->punchout),
                    ];
                })->values()->toArray();

                $locations[] = [
                    'user_id' => $user->id ?? null,
                    'name' => $user->name ?? 'Unknown',
                    'profile_image_url' => $user->profile_image_url ?? null,
                    'designation' => optional($user->designation)->title ?? 'N/A',
                    'attendance_type' => $attendanceType ? [
                        'id' => $attendanceType->id,
                        'name' => $attendanceType->name,
                        'slug' => $attendanceType->slug,
                        'base_slug' => $baseSlug,
                    ] : null,
                    'requires_photo' => $requiresPhoto,
                    'cycles' => $cycles,
                    // Keep legacy fields for backward compatibility
                    'punchin_location' => $userPunches->last()->punchin_location_array ?? null,
                    'punchout_location' => $userPunches->last()->punchout_location_array ?? null,
                    'punchin_time' => $userPunches->last()->punchin,
                    'punchout_time' => $userPunches->last()->punchout,
                ];
            }

            return response()->json([
                'success' => true,
                'date' => $selectedDate,
                'locations' => $locations,
                'attendance_type_configs' => array_values($attendanceTypeConfigs),
            ]);
        } catch (\Throwable $e) {
            Log::error('Error fetching user locations: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch user locations.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getCurrentUserPunch(): \Illuminate\Http\JsonResponse
    {
        $today = Carbon::today();

        try {
            $currentUser = Auth::user();

            // Efficiently check if the user is on leave today
            $userLeave = DB::table('leaves')
                ->join('leave_settings', 'leaves.leave_type', '=', 'leave_settings.id')
                ->select('leaves.*', 'leave_settings.type as leave_type')
                ->where('leaves.user_id', $currentUser->id)
                ->whereDate('leaves.from_date', '<=', $today)
                ->whereDate('leaves.to_date', '>=', $today)
                ->first();

            $userAttendances = Attendance::with('user:id,name')
                ->whereNotNull('punchin')
                ->whereDate('date', $today)
                ->where('user_id', $currentUser->id)
                ->orderBy('punchin')
                ->get();

            $punches = [];
            $totalProductionTime = 0;

            if ($userAttendances->isNotEmpty()) {
                $now = Carbon::now();
                $punches = $userAttendances->map(function ($attendance) use (&$totalProductionTime, $now) {
                    $punchInTime = Carbon::parse($attendance->punchin);
                    $punchOutTime = $attendance->punchout ? Carbon::parse($attendance->punchout) : $now;
                    $duration = $punchInTime->diffInSeconds($punchOutTime);
                    $totalProductionTime += $duration;

                    return [
                        'date' => $attendance->date,
                        'punchin_time' => $attendance->punchin,
                        'punchin_location' => $attendance->punchin_location_array,
                        'punchout_time' => $attendance->punchout,
                        'punchout_location' => $attendance->punchout_location_array,
                        'duration' => gmdate('H:i:s', $duration),
                    ];
                });
            }

            return response()->json([
                'punches' => $punches,
                'total_production_time' => gmdate('H:i:s', $totalProductionTime),
                'isUserOnLeave' => $userLeave, // null if not on leave, or leave object if on leave
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json('An error occurred while retrieving attendance data.', 500);
        }
    }

    public function getAllUsersAttendanceForDate(Request $request): \Illuminate\Http\JsonResponse
    {        // Get the date from the query parameter, defaulting to today's date if none is provided
        $selectedDate = Carbon::parse($request->query('date'))->format('Y-m-d');
        $perPage = (int) $request->get('perPage', 10); // Default to 10 users per page
        $page = $request->get('employee') != '' ? 1 : (int) $request->get('page', 1);
        $employee = $request->get('employee', '');
        try {
            // Get all users with Employee role
            $allUsersQuery = User::role('Employee');

            // Apply employee search filter to all users if provided
            if ($employee !== '') {
                $allUsersQuery->where(function ($query) use ($employee) {
                    $query->where('name', 'like', '%'.$employee.'%')
                        ->orWhere('employee_id', 'like', '%'.$employee.'%');
                });
            }

            $allUsers = $allUsersQuery->get();

            // Get users who have attendance for the selected date
            $usersWithAttendanceQuery = User::role('Employee')
                ->whereHas('attendances', function ($query) use ($selectedDate) {
                    $query->whereNotNull('punchin')
                        ->whereDate('date', $selectedDate);
                });

            // Apply employee search filter if provided
            if ($employee !== '') {
                $usersWithAttendanceQuery->where(function ($query) use ($employee) {
                    $query->where('name', 'like', '%'.$employee.'%')
                        ->orWhere('employee_id', 'like', '%'.$employee.'%');
                });
            }

            // Get users with attendance (for pagination)
            $usersWithAttendance = $usersWithAttendanceQuery->get();

            // Paginate users (not attendance records)
            $paginatedUsers = $usersWithAttendance->forPage($page, $perPage);

            // Get user IDs for the current page
            $userIds = $paginatedUsers->pluck('id');

            // Get ALL attendance records for these users on the selected date
            $attendanceRecords = Attendance::with('user')
                ->whereNotNull('punchin')
                ->whereDate('date', $selectedDate)
                ->whereIn('user_id', $userIds)
                ->orderBy('user_id')
                ->orderBy('punchin')
                ->get();            // Identify absent users: filter out users who don't have any attendance record
            // Only include users that match the search criteria
            $absentUsers = $allUsers->filter(function ($user) use ($usersWithAttendance) {
                return ! $usersWithAttendance->contains('id', $user->id);
            });
            if ($attendanceRecords->isEmpty()) {
                return response()->json([
                    'message' => 'No attendance records found for the selected date.',
                    'attendances' => [],
                    'absent_users' => $allUsers->values(), // Return filtered users as absent if no attendance is recorded
                    'leaves' => [],
                    'current_page' => (int) $page,
                    'last_page' => 1,
                    'total' => 0,
                ]);
            }

            // Group attendance records by user (Admin view logic)
            $groupedByUser = $attendanceRecords->groupBy('user_id')->map(function ($userAttendances) {
                $firstRecord = $userAttendances->first();
                $user = $firstRecord->user;

                // Sort punches by time
                $sortedPunches = $userAttendances->sortBy('punchin');

                // Calculate totals for this user
                $totalWorkMinutes = 0;
                $completePunches = 0;
                $hasIncompletePunch = false;

                $punches = $sortedPunches->map(function ($record) use (&$totalWorkMinutes, &$completePunches, &$hasIncompletePunch) {
                    if ($record->punchin && $record->punchout) {
                        $punchIn = Carbon::parse($record->punchin);
                        $punchOut = Carbon::parse($record->punchout);
                        $workMinutes = $punchIn->diffInMinutes($punchOut);
                        $totalWorkMinutes += $workMinutes;
                        $completePunches++;
                    } elseif ($record->punchin && ! $record->punchout) {
                        $hasIncompletePunch = true;
                    }

                    return [
                        'punch_in' => $record->punchin,
                        'punch_out' => $record->punchout,
                        'id' => $record->id,
                        'date' => $record->date,
                        'punchin_location' => $record->punchin_location_array,
                        'punchout_location' => $record->punchout_location_array,
                    ];
                })->values();

                // Get first punch and last complete punch
                $firstPunch = $sortedPunches->first();
                $lastCompletePunch = $sortedPunches->where('punchout', '!=', null)->last();

                return [
                    'id' => 'user-'.$user->id, // Unique ID for user grouping
                    'user_id' => $user->id,
                    'user' => $user,
                    'date' => $firstRecord->date,
                    'punchin_time' => $firstPunch->punchin,
                    'punchout_time' => $lastCompletePunch ? $lastCompletePunch->punchout : null,
                    'punchin_location' => $firstPunch->punchin_location_array,
                    'punchout_location' => $lastCompletePunch ? $lastCompletePunch->punchout_location_array : null,
                    'total_work_minutes' => round($totalWorkMinutes, 2),
                    'punch_count' => $userAttendances->count(),
                    'complete_punches' => $completePunches,
                    'has_incomplete_punch' => $hasIncompletePunch,
                    'first_punch_date' => $firstRecord->date,
                    'last_punch_date' => $sortedPunches->last()->date,
                    'punches' => $punches,
                ];
            })->values();            // Get today's leaves for the filtered users
            $userIds = $allUsers->pluck('id');
            $todayLeaves = DB::table('leaves')
                ->join('leave_settings', 'leaves.leave_type', '=', 'leave_settings.id')
                ->select('leaves.*', 'leave_settings.type as leave_type')
                ->whereDate('leaves.from_date', '<=', $selectedDate)
                ->whereDate('leaves.to_date', '>=', $selectedDate)
                ->whereIn('leaves.user_id', $userIds)
                ->get(); // Calculate pagination info based on users, not attendance records
            $totalUsers = $usersWithAttendance->count();
            $lastPage = (int) ceil($totalUsers / $perPage);

            // Return paginated data for attendances, absent users, and leave data
            return response()->json([
                'attendances' => $groupedByUser,
                'absent_users' => $absentUsers->values(),
                'leaves' => $todayLeaves,
                'current_page' => (int) $page,
                'last_page' => $lastPage,
                'total' => (int) $totalUsers, // Total number of users with attendance, not total records
            ]);
        } catch (Throwable $exception) {
            // Handle unexpected exceptions during data retrieval
            report($exception); // Report the exception for debugging or logging

            return response()->json([
                'error' => 'An error occurred while retrieving attendance data.',
                'details' => $exception->getMessage(), // Return the error message for debugging
            ], 500);
        }
    }

    public function getCurrentUserAttendanceForDate(Request $request): \Illuminate\Http\JsonResponse
    {
        $perPage = (int) $request->get('perPage', 10); // Default to 10 items per page
        $page = $request->get('employee') != '' ? 1 : (int) $request->get('page', 1);
        $currentMonth = $request->get('currentMonth'); // Filter by month
        $currentYear = $request->get('currentYear'); // Filter by year

        try {
            // Get all attendance records for the current user for the specified month/year
            $attendanceRecords = Attendance::with('user')
                ->whereNotNull('punchin')
                ->where('user_id', Auth::id())
                ->whereYear('date', $currentYear)
                ->whereMonth('date', $currentMonth)
                ->orderBy('date')
                ->orderBy('punchin')
                ->get();
            if ($attendanceRecords->isEmpty()) {
                return response()->json([
                    'message' => 'No attendance records found for the selected month.',
                    'attendances' => [],
                    'absent_users' => [],
                    'leaves' => [],
                    'current_page' => (int) $page,
                    'last_page' => 1,
                    'total' => 0,
                ]);
            }

            // Group attendance records by date (Employee view logic)
            $groupedByDate = $attendanceRecords->groupBy(function ($record) {
                return Carbon::parse($record->date)->format('Y-m-d');
            })->map(function ($dateAttendances, $date) {
                $firstRecord = $dateAttendances->first();
                $user = $firstRecord->user;

                // Sort punches by time for this date
                $sortedPunches = $dateAttendances->sortBy('punchin');

                // Calculate totals for this date
                $totalWorkMinutes = 0;
                $completePunches = 0;
                $hasIncompletePunch = false;

                $punches = $sortedPunches->map(function ($record) use (&$totalWorkMinutes, &$completePunches, &$hasIncompletePunch) {
                    if ($record->punchin && $record->punchout) {
                        $punchIn = Carbon::parse($record->punchin);
                        $punchOut = Carbon::parse($record->punchout);
                        $workMinutes = $punchIn->diffInMinutes($punchOut);
                        $totalWorkMinutes += $workMinutes;
                        $completePunches++;
                    } elseif ($record->punchin && ! $record->punchout) {
                        $hasIncompletePunch = true;
                    }

                    return [
                        'punch_in' => $record->punchin,
                        'punch_out' => $record->punchout,
                        'id' => $record->id,
                        'date' => $record->date,
                        'punchin_location' => $record->punchin_location_array,
                        'punchout_location' => $record->punchout_location_array,
                    ];
                })->values();

                // Get first punch and last complete punch for this date
                $firstPunch = $sortedPunches->first();
                $lastCompletePunch = $sortedPunches->where('punchout', '!=', null)->last();

                return [
                    'id' => $firstRecord->id, // Use first record ID for the date
                    'user_id' => $user->id,
                    'user' => $user,
                    'date' => $date,
                    'punchin_time' => $firstPunch->punchin,
                    'punchout_time' => $lastCompletePunch ? $lastCompletePunch->punchout : null,
                    'punchin_location' => $firstPunch->punchin_location_array,
                    'punchout_location' => $lastCompletePunch ? $lastCompletePunch->punchout_location_array : null,
                    'total_work_minutes' => round($totalWorkMinutes, 2),
                    'punch_count' => $dateAttendances->count(),
                    'complete_punches' => $completePunches,
                    'has_incomplete_punch' => $hasIncompletePunch,
                    'first_punch_date' => $date,
                    'last_punch_date' => $date,
                    'punches' => $punches,
                ];
            })->values();

            // Sort by date descending (newest first)
            $sortedByDate = $groupedByDate->sortByDesc('date')->values();            // Apply pagination to the grouped data
            $paginatedData = $sortedByDate->forPage($page, $perPage)->values();
            $totalRecords = $sortedByDate->count();
            $lastPage = (int) ceil($totalRecords / $perPage);

            // Return paginated data for attendances
            return response()->json([
                'attendances' => $paginatedData,
                'absent_users' => [], // No absent users for employee view
                'leaves' => [],
                'current_page' => (int) $page,
                'last_page' => $lastPage,
                'total' => (int) $totalRecords,
            ]);
        } catch (Throwable $exception) {
            // Handle unexpected exceptions during data retrieval
            report($exception); // Report the exception for debugging or logging

            return response()->json([
                'error' => 'An error occurred while retrieving attendance data.',
                'details' => $exception->getMessage(), // Return the error message for debugging
            ], 500);
        }
    }

    /**
     * Get the client's IP address
     */
    public function getClientIp(Request $request): \Illuminate\Http\JsonResponse
    {
        $ip = $request->ip();

        // Try to get the real IP if behind proxy
        if ($request->hasHeader('X-Forwarded-For')) {
            $ip = $request->header('X-Forwarded-For');
            // If multiple IPs, get the first one
            if (strpos($ip, ',') !== false) {
                $ip = trim(explode(',', $ip)[0]);
            }
        } elseif ($request->hasHeader('X-Real-IP')) {
            $ip = $request->header('X-Real-IP');
        }

        return response()->json([
            'ip' => $ip,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get present users attendance for a specific date
     */
    public function getPresentUsersForDate(Request $request): \Illuminate\Http\JsonResponse
    {
        $selectedDate = Carbon::parse($request->query('date'))->format('Y-m-d');
        $perPage = (int) $request->get('perPage', 10);
        $page = $request->get('employee') != '' ? 1 : (int) $request->get('page', 1);
        $employee = $request->get('employee', '');

        try {
            // Get users who have attendance for the selected date
            $usersWithAttendanceQuery = User::role('Employee')
                ->whereHas('attendances', function ($query) use ($selectedDate) {
                    $query->whereNotNull('punchin')
                        ->whereDate('date', $selectedDate);
                });

            // Apply employee search filter if provided
            if ($employee !== '') {
                $usersWithAttendanceQuery->where(function ($query) use ($employee) {
                    $query->where('name', 'like', '%'.$employee.'%')
                        ->orWhere('employee_id', 'like', '%'.$employee.'%');
                });
            }

            // Get users with attendance (for pagination)
            $usersWithAttendance = $usersWithAttendanceQuery->get();

            // Paginate users (not attendance records)
            $paginatedUsers = $usersWithAttendance->forPage($page, $perPage);

            // Get user IDs for the current page
            $userIds = $paginatedUsers->pluck('id');

            // Get ALL attendance records for these users on the selected date
            $attendanceRecords = Attendance::with('user')
                ->whereNotNull('punchin')
                ->whereDate('date', $selectedDate)
                ->whereIn('user_id', $userIds)
                ->orderBy('user_id')
                ->orderBy('punchin')
                ->get();

            if ($attendanceRecords->isEmpty()) {
                return response()->json([
                    'message' => 'No attendance records found for the selected date.',
                    'attendances' => [],
                    'current_page' => (int) $page,
                    'last_page' => 1,
                    'total' => 0,
                ]);
            }

            // Group attendance records by user (Admin view logic)
            $groupedByUser = $attendanceRecords->groupBy('user_id')->map(function ($userAttendances) {
                $firstRecord = $userAttendances->first();
                $user = $firstRecord->user;

                // Sort punches by time
                $sortedPunches = $userAttendances->sortBy('punchin');

                // Calculate totals for this user
                $totalWorkMinutes = 0;
                $completePunches = 0;
                $hasIncompletePunch = false;

                $punches = $sortedPunches->map(function ($record) use (&$totalWorkMinutes, &$completePunches, &$hasIncompletePunch) {
                    if ($record->punchin && $record->punchout) {
                        $punchIn = Carbon::parse($record->punchin);
                        $punchOut = Carbon::parse($record->punchout);
                        $workMinutes = $punchIn->diffInMinutes($punchOut);
                        $totalWorkMinutes += $workMinutes;
                        $completePunches++;
                    } elseif ($record->punchin && ! $record->punchout) {
                        $hasIncompletePunch = true;
                    }

                    return [
                        'punch_in' => $record->punchin,
                        'punch_out' => $record->punchout,
                        'id' => $record->id,
                        'date' => $record->date,
                        'punchin_location' => $record->punchin_location_array,
                        'punchout_location' => $record->punchout_location_array,
                    ];
                })->values();

                // Get first punch and last complete punch
                $firstPunch = $sortedPunches->first();
                $lastCompletePunch = $sortedPunches->where('punchout', '!=', null)->last();

                return [
                    'id' => 'user-'.$user->id,
                    'user_id' => $user->id,
                    'user' => $user,
                    'date' => $firstRecord->date,
                    'punchin_time' => $firstPunch->punchin,
                    'punchout_time' => $lastCompletePunch ? $lastCompletePunch->punchout : null,
                    'punchin_location' => $firstPunch->punchin_location_array,
                    'punchout_location' => $lastCompletePunch ? $lastCompletePunch->punchout_location_array : null,
                    'total_work_minutes' => round($totalWorkMinutes, 2),
                    'punch_count' => $userAttendances->count(),
                    'complete_punches' => $completePunches,
                    'has_incomplete_punch' => $hasIncompletePunch,
                    'first_punch_date' => $firstRecord->date,
                    'last_punch_date' => $sortedPunches->last()->date,
                    'punches' => $punches,
                ];
            })->values();

            // Calculate pagination info based on users, not attendance records
            $totalUsers = $usersWithAttendance->count();
            $lastPage = (int) ceil($totalUsers / $perPage);

            return response()->json([
                'attendances' => $groupedByUser,
                'current_page' => (int) $page,
                'last_page' => $lastPage,
                'total' => (int) $totalUsers,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'error' => 'An error occurred while retrieving present users data.',
                'details' => $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Get absent users for a specific date
     */
    public function getAbsentUsersForDate(Request $request): \Illuminate\Http\JsonResponse
    {
        $selectedDate = Carbon::parse($request->query('date'))->format('Y-m-d');

        try {

            // When not searching, get all users with Employee role
            $allUsers = User::role('Employee')->get();

            // Get IDs of users who have attendance for the selected date
            $presentUserIds = User::role('Employee')
                ->whereHas('attendances', function ($query) use ($selectedDate) {
                    $query->whereNotNull('punchin')
                        ->whereDate('date', $selectedDate);
                })
                ->pluck('id');

            // Identify absent users: filter out users who have attendance
            $absentUsers = $allUsers->filter(function ($user) use ($presentUserIds) {
                return ! $presentUserIds->contains($user->id);
            });

            // Get leaves for the absent users
            $userIds = $absentUsers->pluck('id');
            $todayLeaves = DB::table('leaves')
                ->join('leave_settings', 'leaves.leave_type', '=', 'leave_settings.id')
                ->select('leaves.*', 'leave_settings.type as leave_type')
                ->whereDate('leaves.from_date', '<=', $selectedDate)
                ->whereDate('leaves.to_date', '>=', $selectedDate)
                ->whereIn('leaves.user_id', $userIds)
                ->get();

            return response()->json([
                'absent_users' => $absentUsers->values(),
                'leaves' => $todayLeaves,
                'total_absent' => $absentUsers->count(),
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'error' => 'An error occurred while retrieving absent users data.',
                'details' => $exception->getMessage(),
            ], 500);
        }
    }

    public function getMonthlyAttendanceStats(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $currentMonth = $request->get('currentMonth', date('m'));
            $currentYear = $request->get('currentYear', date('Y'));
            $userId = $request->get('userId'); // For employee-specific stats (admin use)
            $attendanceSetting = AttendanceSetting::first(); // or user-specific if scoped
            $weekendDays = $attendanceSetting->weekend_days ?? ['saturday', 'sunday'];
            $startOfMonth = Carbon::create($currentYear, $currentMonth, 1)->startOfDay();
            $isCurrentMonth = Carbon::now()->year == $currentYear && Carbon::now()->month == $currentMonth;
            $endOfMonth = $isCurrentMonth
                ? Carbon::now()->endOfDay()
                : Carbon::create($currentYear, $currentMonth)->endOfMonth()->endOfDay();
            // Office end + overtime_after (grace)
            $officeEndTime = $attendanceSetting->office_end_time ?? '17:00:00';
            $overtimeAfter = $attendanceSetting->overtime_after ?? 30; // in minutes
            // For employee route, always use current authenticated user
            if ($request->route()->getName() === 'attendance.myMonthlyStats') {
                $userId = Auth::id();
            }

            // Get total working days in month (excluding weekends and holidays)
            $totalDaysInMonth = $isCurrentMonth
                ? Carbon::now()->day
                : Carbon::create($currentYear, $currentMonth)->daysInMonth;
            $today = Carbon::now()->day;
            $holidaysCount = $this->getTotalHolidayDays($currentYear, $currentMonth);
            $weekendCount = $this->getWeekendDaysCount($currentYear, $currentMonth, $weekendDays);
            $totalWorkingDays = $totalDaysInMonth - $holidaysCount - $weekendCount;

            // Base query for attendance records
            $attendanceQuery = Attendance::whereBetween('date', [$startOfMonth, $endOfMonth]);

            // Base query for users
            $userQuery = User::whereHas('roles', function ($query) {
                $query->where('name', 'Employee');
            });

            if ($userId) {
                // Employee-specific stats
                $attendanceQuery->where('user_id', $userId);
                $userQuery->where('id', $userId);
                $totalEmployees = 1;
            } else {
                // Admin stats - all employees
                $totalEmployees = $userQuery->count();
            }
            // Get attendance records
            $attendanceRecords = $attendanceQuery->get();

            // Calculate attendance metrics - count unique days with attendance, not individual punches
            if ($userId) {
                // For individual employee: count unique dates where they punched in
                $presentDays = $attendanceRecords
                    ->where('punchin', '!=', null)
                    ->pluck('date')
                    ->map(function ($date) {
                        return Carbon::parse($date)->format('Y-m-d');
                    })
                    ->unique()
                    ->count();

                // For individual employee, calculate absent days based on their working days only
                $absentDays = $totalWorkingDays - $presentDays;
            } else {
                // For admin stats: count total unique user-date combinations
                $presentDays = $attendanceRecords
                    ->where('punchin', '!=', null)
                    ->groupBy(function ($record) {
                        return $record->user_id.'-'.Carbon::parse($record->date)->format('Y-m-d');
                    })
                    ->count();

                // For admin stats, calculate across all employees
                $absentDays = $totalWorkingDays * $totalEmployees - $presentDays;
            }

            // Calculate late arrivals (assuming 9:00 AM is standard start time)
            // Only count one late arrival per user per day (earliest punch if multiple)
            $lateMarkAfter = $attendanceSetting->late_mark_after ?? 30; // int, in minutes
            $officeStartTime = $attendanceSetting->office_start_time->format('H:i:s') ?? '09:00:00'; // string: HH:mm:ss

            if ($userId) {

                // Individual employee: count late days
                $lateArrivals = $attendanceRecords
                    ->whereNotNull('punchin')
                    ->groupBy(fn ($record) => Carbon::parse($record->date)->format('Y-m-d')) // Group by date
                    ->filter(function ($dayRecords) use ($lateMarkAfter, $officeStartTime) {
                        // Get the earliest punch-in for the day
                        $earliestPunchRecord = $dayRecords->sortBy('punchin')->first();
                        if (! $earliestPunchRecord || ! $earliestPunchRecord->punchin) {
                            return false;
                        }

                        $dateString = Carbon::parse($earliestPunchRecord->date)->format('Y-m-d');
                        $punchTime = Carbon::parse($dateString.' '.$earliestPunchRecord->punchin->format('H:i:s'));
                        $lateThreshold = Carbon::parse($dateString.' '.$officeStartTime)->addMinutes($lateMarkAfter);

                        return $punchTime->gt($lateThreshold);
                    })
                    ->count();
            } else {
                // Admin view: count total late arrivals per user per day
                $lateArrivals = $attendanceRecords
                    ->whereNotNull('punchin')
                    ->groupBy(fn ($record) => $record->user_id.'-'.Carbon::parse($record->date)->format('Y-m-d'))
                    ->filter(function ($userDayRecords) use ($lateMarkAfter, $officeStartTime) {
                        $earliestPunch = $userDayRecords->sortBy('punchin')->first();

                        if (! $earliestPunch || ! $earliestPunch->punchin) {
                            return false;
                        }

                        // Build full datetime for punch and office start
                        $dateString = Carbon::parse($earliestPunch->date)->format('Y-m-d');
                        $punchTime = Carbon::parse($dateString.' '.$earliestPunch->punchin->format('H:i:s'));
                        $lateThreshold = Carbon::parse($dateString.' '.$officeStartTime)->addMinutes($lateMarkAfter);

                        return $punchTime->gt($lateThreshold);
                    })
                    ->count();
            }

            // Calculate overtime hours - sum work time per day, then check if over 8 hours
            $overtimeMinutes = 0;

            if ($userId) {
                // Individual employee: Group by date
                $attendanceRecords
                    ->groupBy(fn ($record) => Carbon::parse($record->date)->format('Y-m-d'))
                    ->each(function ($dayRecords) use (&$overtimeMinutes, $officeEndTime, $overtimeAfter) {

                        $lastPunchOutRecord = $dayRecords->filter(fn ($r) => $r->punchout)
                            ->sortByDesc('punchout')
                            ->first();

                        if (! $lastPunchOutRecord) {
                            return;
                        }

                        $date = Carbon::parse($lastPunchOutRecord->date)->format('Y-m-d');
                        $punchOutTime = Carbon::parse($date.' '.$lastPunchOutRecord->punchout->format('H:i:s'));

                        $overtimeStart = Carbon::parse($date.' '.$officeEndTime->format('H:i:s'))->addMinutes($overtimeAfter);

                        if ($punchOutTime->gt($overtimeStart)) {
                            $overtimeMinutes += $overtimeStart->diffInMinutes($punchOutTime);
                        }
                    });
            } else {
                // Admin view: Group by user + date
                $attendanceRecords
                    ->groupBy(fn ($record) => $record->user_id.'-'.Carbon::parse($record->date)->format('Y-m-d'))
                    ->each(function ($userDayRecords) use (&$overtimeMinutes, $officeEndTime, $overtimeAfter) {

                        $lastPunchOutRecord = $userDayRecords->filter(fn ($r) => $r->punchout)
                            ->sortByDesc('punchout')
                            ->first();

                        if (! $lastPunchOutRecord) {
                            return;
                        }

                        $date = Carbon::parse($lastPunchOutRecord->date)->format('Y-m-d');
                        $punchOutTime = Carbon::parse($date.' '.$lastPunchOutRecord->punchout->format('H:i:s'));

                        $overtimeStart = Carbon::parse($date.' '.$officeEndTime->format('H:i:s'))->addMinutes($overtimeAfter);

                        if ($punchOutTime->gt($overtimeStart)) {
                            $overtimeMinutes += $overtimeStart->diffInMinutes($punchOutTime);
                        }
                    });
            }

            // Get leave statistics
            $leaveQuery = DB::table('leaves')
                ->join('leave_settings', 'leaves.leave_type', '=', 'leave_settings.id')
                ->whereYear('leaves.from_date', '<=', $currentYear)
                ->whereMonth('leaves.from_date', '<=', $currentMonth)
                ->whereYear('leaves.to_date', '>=', $currentYear)
                ->whereMonth('leaves.to_date', '>=', $currentMonth);

            if ($userId) {
                $leaveQuery->where('leaves.user_id', $userId);
            }

            $leaves = $leaveQuery->select(
                'leave_settings.type as leave_type',
                DB::raw('SUM(DATEDIFF(
                    LEAST(leaves.to_date, LAST_DAY(STR_TO_DATE(CONCAT('.$currentYear.',"-",'.$currentMonth.',"-01"), "%Y-%m-%d"))),
                    GREATEST(leaves.from_date, STR_TO_DATE(CONCAT('.$currentYear.',"-",'.$currentMonth.',"-01"), "%Y-%m-%d"))
                ) + 1) as total_days')
            )->groupBy('leave_settings.type')->get();

            $leaveBreakdown = [];
            $totalLeaveDays = 0;
            foreach ($leaves as $leave) {
                $leaveBreakdown[$leave->leave_type] = (int) $leave->total_days;
                $totalLeaveDays += (int) $leave->total_days;
            }
            // Calculate attendance percentage
            if ($userId) {
                // For individual employee: (present days / total working days) * 100
                $attendancePercentage = $totalWorkingDays > 0 ?
                    round(($presentDays / $totalWorkingDays) * 100, 2) : 0;
            } else {
                // For admin: (total present days / (working days * total employees)) * 100
                $attendancePercentage = ($totalWorkingDays * $totalEmployees) > 0 ?
                    round(($presentDays / ($totalWorkingDays * $totalEmployees)) * 100, 2) : 0;
            }
            // Calculate average work hours per day - sum all work time and divide by present days
            $totalWorkMinutes = 0;

            if ($userId) {
                // For individual employee: group by date and sum daily work time
                $attendanceRecords
                    ->groupBy(function ($record) {
                        return Carbon::parse($record->date)->format('Y-m-d');
                    })
                    ->each(function ($dayRecords) use (&$totalWorkMinutes) {
                        $dayRecords->each(function ($record) use (&$totalWorkMinutes) {
                            if ($record->punchin && $record->punchout) {
                                $totalWorkMinutes += Carbon::parse($record->punchin)->diffInMinutes(Carbon::parse($record->punchout));
                            }
                        });
                    });
            } else {
                // For admin stats: sum all work time across all users
                $attendanceRecords->each(function ($record) use (&$totalWorkMinutes) {
                    if ($record->punchin && $record->punchout) {
                        $totalWorkMinutes += Carbon::parse($record->punchin)->diffInMinutes(Carbon::parse($record->punchout));
                    }
                });
            }

            $averageWorkHours = $presentDays > 0 ? round($totalWorkMinutes / $presentDays / 60, 2) : 0;

            // Monthly focused statistics without today's snapshot

            return response()->json([
                'success' => true,
                'data' => [
                    // Basic month info
                    'month' => Carbon::create($currentYear, $currentMonth)->format('F Y'),
                    'year' => (int) $currentYear,

                    // Employee and day counts
                    'totalEmployees' => $totalEmployees,
                    'totalWorkingDays' => $totalWorkingDays,
                    'totalWeekendDays' => $weekendCount,
                    'totalHolidays' => $holidaysCount,

                    // Attendance metrics
                    'totalPresentDays' => $presentDays,
                    'totalAbsentDays' => $absentDays,
                    'totalLateArrivals' => $lateArrivals,
                    'totalEarlyLeaves' => 0, // Can be calculated if needed
                    'attendancePercentage' => $attendancePercentage,

                    // Leave statistics
                    'totalLeaveDays' => $totalLeaveDays,
                    'approvedLeaves' => $totalLeaveDays, // Assuming all counted leaves are approved
                    'pendingLeaves' => 0, // Can be calculated if needed
                    'rejectedLeaves' => 0, // Can be calculated if needed

                    // Performance indicators
                    'perfectAttendanceEmployees' => $totalEmployees > 0 ? max(0, $totalEmployees - $absentDays / max(1, $totalWorkingDays)) : 0,
                    'averageAttendanceRate' => $attendancePercentage,
                    'mostAbsentEmployee' => null, // Can be calculated if needed
                    'bestAttendanceEmployee' => null, // Can be calculated if needed

                    // Meta information
                    'lastUpdated' => now()->toISOString(),
                    'generatedAt' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error calculating monthly attendance stats: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'Failed to calculate attendance statistics.',
            ], 500);
        }
    }

    private function getTotalHolidayDays(int $year, int $month): int
    {
        $holidays = Holiday::where(function ($query) use ($year, $month) {
            $query->whereYear('from_date', $year)
                ->whereMonth('from_date', $month)
                ->orWhereYear('to_date', $year)
                ->whereMonth('to_date', $month);
        })->get();

        return $holidays->sum(function ($holiday) use ($year, $month) {
            $from = Carbon::parse($holiday->from_date);
            $to = Carbon::parse($holiday->to_date);

            // Limit to current year and month
            $startOfMonth = Carbon::create($year, $month, 1);
            $endOfMonth = Carbon::now()->year == $year && Carbon::now()->month == $month
                ? Carbon::today()
                : (clone $startOfMonth)->endOfMonth();

            if ($from > $endOfMonth || $to < $startOfMonth) {
                return 0; // Outside target range
            }

            $holidayStart = $from->greaterThan($startOfMonth) ? $from : $startOfMonth;
            $holidayEnd = $to->lessThan($endOfMonth) ? $to : $endOfMonth;

            return $holidayStart->diffInDays($holidayEnd) + 1;
        });
    }

    private function getWeekendDaysCount(int $year, int $month, array $weekendDays): int
    {
        $startOfMonth = Carbon::create($year, $month, 1);
        $endOfRange = Carbon::now()->year == $year && Carbon::now()->month == $month
            ? Carbon::today()
            : (clone $startOfMonth)->endOfMonth();

        // Fetch holiday ranges
        $holidayRanges = Holiday::where(function ($query) use ($year, $month) {
            $query->whereYear('from_date', $year)->whereMonth('from_date', $month)
                ->orWhereYear('to_date', $year)->whereMonth('to_date', $month);
        })->get()->map(function ($holiday) use ($startOfMonth, $endOfRange) {
            $from = Carbon::parse($holiday->from_date);
            $to = Carbon::parse($holiday->to_date);

            return [
                'start' => $from->greaterThan($startOfMonth) ? $from : $startOfMonth,
                'end' => $to->lessThan($endOfRange) ? $to : $endOfRange,
            ];
        });

        $weekendCount = 0;
        $current = $startOfMonth->copy();

        while ($current <= $endOfRange) {
            $dayName = strtolower($current->format('l'));

            if (in_array($dayName, $weekendDays)) {
                $isInsideHoliday = $holidayRanges->contains(function ($range) use ($current) {
                    return $current->betweenIncluded($range['start'], $range['end']);
                });

                if (! $isInsideHoliday) {
                    $weekendCount++;
                }
            }

            $current->addDay();
        }

        return $weekendCount;
    }

    /**
     * Check for updates to user locations
     *
     * @param  string  $date  The date to check for updates (Y-m-d format)
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkForLocationUpdates($date)
    {
        try {
            // Validate date format
            $validated = Validator::make(
                ['date' => $date],
                ['date' => 'required|date_format:Y-m-d']
            );

            if ($validated->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid date format. Please use YYYY-MM-DD.',
                ], 400);
            }

            // Get the most recent update timestamp for locations on the given date
            $lastUpdate = \App\Models\HRM\Attendance::whereDate('date', $date)
                ->max('updated_at');

            // Convert the timestamp to a Carbon instance if it exists
            $lastUpdateTime = $lastUpdate ? \Carbon\Carbon::parse($lastUpdate) : null;

            return response()->json([
                'success' => true,
                'has_updates' => $lastUpdate !== null,
                'last_updated' => $lastUpdateTime ? $lastUpdateTime->toIso8601String() : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking for location updates: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to check for updates.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check for timesheet updates
     *
     * @param  string  $date  The date to check for updates (Y-m-d format)
     * @param  string  $month  The month to check for updates (YYYY-MM format)
     */
    /**
     * Mark user as present for a specific date (Admin function)
     * This creates attendance record with punch in/out for users who were absent
     */
    public function markAsPresent(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Enhanced validation to include punch data for consistency
            $validatedData = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'date' => 'required|date',
                'punch_in_time' => 'nullable|date_format:H:i',
                'punch_out_time' => 'nullable|date_format:H:i',
                'reason' => 'nullable|string|max:255',
                'location' => 'nullable|string',
                // Location data in the same format as punch function
                'lat' => 'nullable|numeric|between:-90,90',
                'lng' => 'nullable|numeric|between:-180,180',
                'address' => 'nullable|string|max:255',
            ]);

            $userId = $validatedData['user_id'];
            $date = Carbon::parse($validatedData['date'])->format('Y-m-d');
            $punchInTime = $validatedData['punch_in_time'] ?? '09:00';
            $punchOutTime = $validatedData['punch_out_time'] ?? null;
            $reason = $validatedData['reason'] ?? 'Marked present by administrator';
            $location = $validatedData['location'] ?? null;

            // Check if the user already has attendance for this date
            $existingAttendance = Attendance::where('user_id', $userId)
                ->whereDate('date', $date)
                ->first();

            if ($existingAttendance) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User already has attendance record for this date.',
                ], 422);
            }

            // Verify the user exists and is an employee
            $user = User::find($userId);
            if (! $user || ! $user->hasRole('Employee')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user or user is not an employee.',
                ], 422);
            }

            // Prepare location data using the same format as regular punch function
            $locationData = [
                'lat' => $validatedData['lat'] ?? 0,
                'lng' => $validatedData['lng'] ?? 0,
                'address' => $validatedData['address'] ?? $location ?? 'Manually marked present by '.(Auth::user()?->name ?? 'Administrator'),
                'timestamp' => now()->toISOString(),
            ];

            // Create the attendance record with punch in
            $attendanceData = [
                'user_id' => $userId,
                'date' => $date,
                'punchin' => Carbon::parse($date.' '.$punchInTime),
                'punchin_location' => json_encode($locationData),
            ];

            // Add punch out if provided
            if ($punchOutTime) {
                $attendanceData['punchout'] = Carbon::parse($date.' '.$punchOutTime);
                $attendanceData['punchout_location'] = json_encode($locationData);
            }

            $attendance = Attendance::create($attendanceData);

            return response()->json([
                'status' => 'success',
                'message' => "User {$user->name} marked as present for ".Carbon::parse($date)->format('M d, Y'),
                'data' => [
                    'attendance' => $attendance,
                    'user' => $user->only(['id', 'name', 'employee_id']),
                    'location_info' => isset($validatedData['lat']) ? [
                        'coordinates' => "{$validatedData['lat']}, {$validatedData['lng']}",
                        'accuracy' => $validatedData['accuracy'] ?? 10,
                    ] : ['address' => $locationData['address']],
                ],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error marking user as present: '.$e->getMessage(), [
                'user_id' => $request->get('user_id'),
                'date' => $request->get('date'),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark multiple users as present (Bulk operation)
     */
    public function bulkMarkAsPresent(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'user_ids' => 'required|array|min:1',
                'user_ids.*' => 'required|integer|exists:users,id',
                'date' => 'required|date',
                'punch_in_time' => 'nullable|date_format:H:i',
                'punch_out_time' => 'nullable|date_format:H:i',
                'reason' => 'nullable|string|max:255',
                'location' => 'nullable|string',
            ]);

            $userIds = $validatedData['user_ids'];
            $date = Carbon::parse($validatedData['date'])->format('Y-m-d');
            $punchInTime = $validatedData['punch_in_time'] ?? '09:00';
            $punchOutTime = $validatedData['punch_out_time'] ?? null;
            $reason = $validatedData['reason'] ?? 'Bulk marked present by administrator';
            $location = $validatedData['location'] ?? null;

            $results = [
                'successful' => [],
                'failed' => [],
                'skipped' => [],
            ];

            DB::beginTransaction();

            try {
                foreach ($userIds as $userId) {
                    // Check if user already has attendance
                    $existingAttendance = Attendance::where('user_id', $userId)
                        ->whereDate('date', $date)
                        ->first();

                    if ($existingAttendance) {
                        $user = User::find($userId);
                        $results['skipped'][] = [
                            'user_id' => $userId,
                            'name' => $user->name ?? 'Unknown',
                            'reason' => 'Already has attendance record',
                        ];

                        continue;
                    }

                    // Verify user is an employee
                    $user = User::find($userId);
                    if (! $user || ! $user->hasRole('Employee')) {
                        $results['failed'][] = [
                            'user_id' => $userId,
                            'name' => $user->name ?? 'Unknown',
                            'reason' => 'Invalid user or not an employee',
                        ];

                        continue;
                    }

                    // Create attendance record
                    $attendanceData = [
                        'user_id' => $userId,
                        'date' => $date,
                        'punchin' => Carbon::parse($date.' '.$punchInTime),
                        'punchin_location' => $location ? json_encode(['manual' => true, 'bulk' => true, 'reason' => $reason]) : null,
                    ];

                    if ($punchOutTime) {
                        $attendanceData['punchout'] = Carbon::parse($date.' '.$punchOutTime);
                        $attendanceData['punchout_location'] = $location ? json_encode(['manual' => true, 'bulk' => true, 'reason' => $reason]) : null;
                    }

                    $attendance = Attendance::create($attendanceData);

                    $results['successful'][] = [
                        'user_id' => $userId,
                        'name' => $user->name,
                        'attendance_id' => $attendance->id,
                    ];
                }

                DB::commit();

                $totalProcessed = count($userIds);
                $successCount = count($results['successful']);
                $failedCount = count($results['failed']);
                $skippedCount = count($results['skipped']);

                return response()->json([
                    'status' => 'success',
                    'message' => "Bulk mark present completed. {$successCount} successful, {$failedCount} failed, {$skippedCount} skipped out of {$totalProcessed} users.",
                    'data' => $results,
                    'summary' => [
                        'total' => $totalProcessed,
                        'successful' => $successCount,
                        'failed' => $failedCount,
                        'skipped' => $skippedCount,
                    ],
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in bulk mark as present: '.$e->getMessage(), [
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
            ], 500);
        }
    }

    /**
     * Check for timesheet updates
     *
     * @param  string  $date  The date to check for updates (Y-m-d format)
     * @param  string  $month  The month to check for updates (YYYY-MM format)
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkTimesheetUpdates($date, $month = null)
    {
        try {
            // Validate date format
            $validated = Validator::make(
                [
                    'date' => $date,
                    'month' => $month,
                ],
                [
                    'date' => 'required|date_format:Y-m-d',
                    'month' => 'nullable|date_format:Y-m',
                ]
            );

            if ($validated->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid date format. Please use YYYY-MM-DD for date and YYYY-MM for month.',
                ], 400);
            }

            $query = \App\Models\HRM\Attendance::query();

            // Check for updates on the specific date
            $query->whereDate('date', $date);

            // If month is provided, also check for updates in that month
            if ($month) {
                $query->orWhere(function ($q) use ($month) {
                    $q->whereYear('date', '=', substr($month, 0, 4))
                        ->whereMonth('date', '=', substr($month, 5, 2));
                });
            }

            // Get the most recent update timestamp
            $lastUpdate = $query->max('updated_at');

            // Also check if there are any records for the date
            $hasRecords = \App\Models\HRM\Attendance::whereDate('date', $date)->exists();

            return response()->json([
                'success' => true,
                'has_updates' => $lastUpdate !== null,
                'has_records' => $hasRecords,
                'last_updated' => $lastUpdate ? \Carbon\Carbon::parse($lastUpdate)->toIso8601String() : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking for timesheet updates: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to check for timesheet updates.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function exportExcel(Request $request)
    {
        $date = $request->input('date');

        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\AttendanceExport($date), 'Daily_Timesheet_'.date('Y_m_d', strtotime($date)).'.xlsx');
    }

    public function exportPdf(Request $request)
    {
        $date = $request->input('date');
        $rows = (new AttendanceExport($date))->collection();
        $pdf = PDF::loadView('attendance_pdf', [
            'title' => 'Daily Timesheet - '.date('F d, Y', strtotime($date)),
            'generatedOn' => now()->format('F d, Y h:i A'),
            'rows' => $rows,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('Daily_Timesheet_'.date('Y_m_d', strtotime($date)).'.pdf');
    }

    public function exportAdminExcel(Request $request)
    {
        $month = $request->get('month');

        return (new AttendanceAdminExport)->export($month);
    }

    public function exportAdminPdf(Request $request)
    {
        $month = $request->get('month');
        $from = Carbon::parse($month.'-01');
        $to = $from->copy()->endOfMonth();
        $monthName = $from->format('F Y');

        $users = User::with(['attendances', 'leaves'])->role('Employee')->where('active', 1)->get();
        $leaveTypes = LeaveSetting::all();
        $holidays = Holiday::all();

        $attendanceData = [];
        foreach ($users as $user) {
            $attendanceData[] = $this->getUserAttendanceData($user, $from->year, $from->month, $holidays, collect($leaveTypes));
        }

        // You can build a custom view file for formatting the PDF layout
        $pdf = PDF::loadView('attendance_admin_pdf', [
            'monthName' => $monthName,
            'from' => $from,
            'to' => $to,
            'users' => $users,
            'attendanceData' => $attendanceData,
            'leaveTypes' => $leaveTypes,
        ])->setPaper('A4', 'landscape');

        $fileName = "DBEDC_Attendance_{$monthName}.pdf";

        return $pdf->download($fileName);
    }
}
