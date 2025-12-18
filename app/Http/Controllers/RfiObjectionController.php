<?php

namespace App\Http\Controllers;

use App\Models\DailyWork;
use App\Models\RfiObjection;
use App\Notifications\RfiObjectionNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RfiObjectionController extends Controller
{
    /**
     * Get all objections for a specific RFI.
     */
    public function index(DailyWork $dailyWork): JsonResponse
    {
        $this->authorize('viewAny', RfiObjection::class);

        $objections = $dailyWork->objections()
            ->with(['createdBy:id,name,email', 'resolvedBy:id,name,email'])
            ->get()
            ->map(function ($objection) {
                return array_merge($objection->toArray(), [
                    'files' => $objection->files,
                ]);
            });

        return response()->json([
            'objections' => $objections,
            'total' => $objections->count(),
            'active_count' => $objections->where('is_active', true)->count(),
        ]);
    }

    /**
     * Get a specific objection with details.
     */
    public function show(DailyWork $dailyWork, RfiObjection $objection): JsonResponse
    {
        // Ensure objection belongs to the daily work
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('view', $objection);

        $objection->load([
            'createdBy:id,name,email',
            'updatedBy:id,name,email',
            'resolvedBy:id,name,email',
            'statusLogs.changedBy:id,name',
        ]);

        return response()->json([
            'objection' => array_merge($objection->toArray(), [
                'files' => $objection->files,
            ]),
        ]);
    }

    /**
     * Create a new objection for an RFI.
     */
    public function store(Request $request, DailyWork $dailyWork): JsonResponse
    {
        $this->authorize('create', [RfiObjection::class, $dailyWork]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'nullable|string|in:'.implode(',', RfiObjection::$categories),
            'description' => 'required|string|max:5000',
            'reason' => 'required|string|max:5000',
            'status' => 'nullable|string|in:draft,submitted',
        ]);

        try {
            DB::beginTransaction();

            $objection = new RfiObjection([
                'daily_work_id' => $dailyWork->id,
                'title' => $validated['title'],
                'category' => $validated['category'] ?? RfiObjection::CATEGORY_OTHER,
                'description' => $validated['description'],
                'reason' => $validated['reason'],
                'status' => $validated['status'] ?? RfiObjection::STATUS_DRAFT,
                'created_by' => auth()->id(),
            ]);

            $objection->save();

            // Log initial status
            $objection->statusLogs()->create([
                'from_status' => null,
                'to_status' => $objection->status,
                'notes' => 'Objection created',
                'changed_by' => auth()->id(),
                'changed_at' => now(),
            ]);

            // If submitted immediately, send notifications
            if ($objection->status === RfiObjection::STATUS_SUBMITTED) {
                $this->notifyStakeholders($objection, 'submitted');
            }

            DB::commit();

            $objection->load(['createdBy:id,name,email']);

            return response()->json([
                'message' => 'Objection created successfully.',
                'objection' => array_merge($objection->toArray(), [
                    'files' => $objection->files,
                ]),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Failed to create objection: '.$e->getMessage()], 500);
        }
    }

    /**
     * Update an existing objection.
     */
    public function update(Request $request, DailyWork $dailyWork, RfiObjection $objection): JsonResponse
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('update', $objection);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'category' => 'nullable|string|in:'.implode(',', RfiObjection::$categories),
            'description' => 'sometimes|required|string|max:5000',
            'reason' => 'sometimes|required|string|max:5000',
        ]);

        try {
            $objection->update($validated);

            $objection->load(['createdBy:id,name,email']);

            return response()->json([
                'message' => 'Objection updated successfully.',
                'objection' => array_merge($objection->toArray(), [
                    'files' => $objection->files,
                ]),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update objection: '.$e->getMessage()], 500);
        }
    }

    /**
     * Delete an objection.
     */
    public function destroy(DailyWork $dailyWork, RfiObjection $objection): JsonResponse
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('delete', $objection);

        try {
            // Clear media files
            $objection->clearMediaCollection('objection_files');

            $objection->delete();

            return response()->json([
                'message' => 'Objection deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete objection: '.$e->getMessage()], 500);
        }
    }

    /**
     * Submit an objection for review.
     */
    public function submit(DailyWork $dailyWork, RfiObjection $objection): JsonResponse
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('submit', $objection);

        try {
            $objection->submit('Submitted for review');

            // Send notifications
            $this->notifyStakeholders($objection, 'submitted');

            $objection->load(['createdBy:id,name,email']);

            return response()->json([
                'message' => 'Objection submitted for review.',
                'objection' => array_merge($objection->toArray(), [
                    'files' => $objection->files,
                ]),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to submit objection: '.$e->getMessage()], 500);
        }
    }

    /**
     * Start reviewing an objection.
     */
    public function startReview(DailyWork $dailyWork, RfiObjection $objection): JsonResponse
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('review', $objection);

        try {
            $objection->startReview('Review started');

            $objection->load(['createdBy:id,name,email']);

            return response()->json([
                'message' => 'Objection is now under review.',
                'objection' => array_merge($objection->toArray(), [
                    'files' => $objection->files,
                ]),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to start review: '.$e->getMessage()], 500);
        }
    }

    /**
     * Resolve an objection.
     */
    public function resolve(Request $request, DailyWork $dailyWork, RfiObjection $objection): JsonResponse
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('review', $objection);

        $validated = $request->validate([
            'resolution_notes' => 'required|string|max:5000',
        ]);

        try {
            $objection->resolve($validated['resolution_notes']);

            // Notify the objection creator
            $this->notifyStakeholders($objection, 'resolved');

            $objection->load(['createdBy:id,name,email', 'resolvedBy:id,name,email']);

            return response()->json([
                'message' => 'Objection resolved successfully.',
                'objection' => array_merge($objection->toArray(), [
                    'files' => $objection->files,
                ]),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to resolve objection: '.$e->getMessage()], 500);
        }
    }

    /**
     * Reject an objection.
     */
    public function reject(Request $request, DailyWork $dailyWork, RfiObjection $objection): JsonResponse
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('review', $objection);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:5000',
        ]);

        try {
            $objection->reject($validated['rejection_reason']);

            // Notify the objection creator
            $this->notifyStakeholders($objection, 'rejected');

            $objection->load(['createdBy:id,name,email', 'resolvedBy:id,name,email']);

            return response()->json([
                'message' => 'Objection rejected.',
                'objection' => array_merge($objection->toArray(), [
                    'files' => $objection->files,
                ]),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to reject objection: '.$e->getMessage()], 500);
        }
    }

    /**
     * Upload files to an objection.
     */
    public function uploadFiles(Request $request, DailyWork $dailyWork, RfiObjection $objection): JsonResponse
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('uploadFiles', $objection);

        $request->validate([
            'files' => 'required|array|min:1|max:10',
            'files.*' => 'file|mimes:jpeg,jpg,png,webp,gif,pdf,doc,docx,xls,xlsx|max:10240',
        ]);

        $uploadedFiles = [];
        $errors = [];

        foreach ($request->file('files') as $file) {
            try {
                $media = $objection
                    ->addMedia($file)
                    ->usingFileName($this->generateUniqueFileName($file))
                    ->toMediaCollection('objection_files');

                $uploadedFiles[] = [
                    'id' => $media->id,
                    'name' => $media->file_name,
                    'url' => $media->getUrl(),
                    'thumb_url' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : null,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'is_image' => str_starts_with($media->mime_type, 'image/'),
                    'is_pdf' => $media->mime_type === 'application/pdf',
                ];
            } catch (\Exception $e) {
                $errors[] = [
                    'file' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'message' => count($uploadedFiles).' file(s) uploaded successfully.',
            'files' => $uploadedFiles,
            'errors' => $errors,
            'total_files' => $objection->getMedia('objection_files')->count(),
        ]);
    }

    /**
     * Get files for an objection.
     */
    public function getFiles(DailyWork $dailyWork, RfiObjection $objection): JsonResponse
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('view', $objection);

        return response()->json([
            'files' => $objection->files,
            'total' => $objection->files_count,
        ]);
    }

    /**
     * Delete a file from an objection.
     */
    public function deleteFile(DailyWork $dailyWork, RfiObjection $objection, int $mediaId): JsonResponse
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('deleteFiles', $objection);

        $media = $objection->getMedia('objection_files')->where('id', $mediaId)->first();

        if (! $media) {
            return response()->json(['error' => 'File not found.'], 404);
        }

        try {
            $media->delete();

            return response()->json([
                'message' => 'File deleted successfully.',
                'total_files' => $objection->getMedia('objection_files')->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete file: '.$e->getMessage()], 500);
        }
    }

    /**
     * Download a file from an objection.
     */
    public function downloadFile(DailyWork $dailyWork, RfiObjection $objection, int $mediaId)
    {
        if ($objection->daily_work_id !== $dailyWork->id) {
            return response()->json(['error' => 'Objection not found for this RFI.'], 404);
        }

        $this->authorize('view', $objection);

        $media = $objection->getMedia('objection_files')->where('id', $mediaId)->first();

        if (! $media) {
            return response()->json(['error' => 'File not found.'], 404);
        }

        return response()->download($media->getPath(), $media->file_name);
    }

    /**
     * Get objection categories and statuses for form dropdowns.
     */
    public function getMetadata(): JsonResponse
    {
        return response()->json([
            'categories' => collect(RfiObjection::$categories)->map(fn ($cat) => [
                'value' => $cat,
                'label' => RfiObjection::$categoryLabels[$cat] ?? ucfirst(str_replace('_', ' ', $cat)),
            ]),
            'statuses' => collect(RfiObjection::$statuses)->map(fn ($status) => [
                'value' => $status,
                'label' => RfiObjection::$statusLabels[$status] ?? ucfirst(str_replace('_', ' ', $status)),
            ]),
            'active_statuses' => RfiObjection::$activeStatuses,
        ]);
    }

    /**
     * Generate a unique filename for uploaded files.
     */
    protected function generateUniqueFileName($file): string
    {
        $extension = $file->getClientOriginalExtension();
        $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $baseName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $baseName);

        return substr($baseName, 0, 100).'_'.time().'_'.uniqid().'.'.$extension;
    }

    /**
     * Notify relevant stakeholders about objection events.
     */
    protected function notifyStakeholders(RfiObjection $objection, string $event): void
    {
        try {
            $dailyWork = $objection->dailyWork;
            $usersToNotify = collect();

            // Get incharge user
            if ($dailyWork->incharge && $dailyWork->inchargeUser) {
                $usersToNotify->push($dailyWork->inchargeUser);
            }

            // Get assigned user
            if ($dailyWork->assigned && $dailyWork->assignedUser && $dailyWork->assigned !== $dailyWork->incharge) {
                $usersToNotify->push($dailyWork->assignedUser);
            }

            // For submitted events, also notify managers/admins
            if ($event === 'submitted') {
                $managers = \App\Models\User::role(['Super Admin', 'Admin', 'Project Manager', 'Consultant'])
                    ->where('active', true)
                    ->get();
                $usersToNotify = $usersToNotify->merge($managers);
            }

            // For resolved/rejected events, notify the objection creator
            if (in_array($event, ['resolved', 'rejected']) && $objection->createdBy) {
                $usersToNotify->push($objection->createdBy);
            }

            // Remove duplicates and the current user
            $usersToNotify = $usersToNotify
                ->unique('id')
                ->filter(fn ($user) => $user->id !== auth()->id());

            foreach ($usersToNotify as $user) {
                $user->notify(new RfiObjectionNotification($objection, $event));
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send objection notifications', [
                'objection_id' => $objection->id,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
