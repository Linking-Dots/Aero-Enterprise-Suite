<?php

namespace App\Services\DailyWork;

use App\Models\DailyWork;
use App\Models\NCR;
use App\Models\Objection;
use App\Models\Tasks;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class DailyWorkFileService
{
    /**
     * Upload multiple RFI files for a daily work task.
     * Does NOT clear existing files - supports multiple files per task.
     */
    public function uploadRfiFiles(DailyWork $dailyWork, array $files): array
    {
        $uploadedFiles = [];
        $errors = [];

        \Log::info('DailyWorkFileService: uploadRfiFiles called', [
            'daily_work_id' => $dailyWork->id,
            'files_count' => count($files),
        ]);

        foreach ($files as $index => $file) {
            \Log::info("Processing file {$index}", [
                'is_uploaded_file' => $file instanceof UploadedFile,
                'type' => gettype($file),
                'class' => is_object($file) ? get_class($file) : 'not_object',
            ]);

            if (! $file instanceof UploadedFile) {
                \Log::warning("File {$index} is not an UploadedFile instance");

                continue;
            }

            try {
                $media = $dailyWork
                    ->addMedia($file)
                    ->usingFileName($this->generateUniqueFileName($file))
                    ->toMediaCollection('rfi_files');

                \Log::info("File {$index} uploaded successfully", ['media_id' => $media->id]);

                $uploadedFiles[] = [
                    'id' => $media->id,
                    'name' => $media->file_name,
                    'url' => $media->getUrl(),
                    'thumb_url' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : null,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'human_size' => $this->formatBytes($media->size),
                    'is_image' => str_starts_with($media->mime_type, 'image/'),
                    'is_pdf' => $media->mime_type === 'application/pdf',
                ];
            } catch (\Exception $e) {
                \Log::error("Error uploading file {$index}", [
                    'file' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ]);
                $errors[] = [
                    'file' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'uploaded' => $uploadedFiles,
            'errors' => $errors,
            'total_files' => $dailyWork->getMedia('rfi_files')->count(),
        ];
    }

    /**
     * Get all RFI files for a daily work task.
     */
    public function getRfiFiles(DailyWork $dailyWork): array
    {
        return $dailyWork->getMedia('rfi_files')->map(function ($media) {
            return [
                'id' => $media->id,
                'name' => $media->file_name,
                'original_name' => $media->name,
                'url' => $media->getUrl(),
                'thumb_url' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : null,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'human_size' => $this->formatBytes($media->size),
                'is_image' => str_starts_with($media->mime_type, 'image/'),
                'is_pdf' => $media->mime_type === 'application/pdf',
                'created_at' => $media->created_at->toISOString(),
            ];
        })->toArray();
    }

    /**
     * Delete a specific RFI file.
     */
    public function deleteRfiFile(DailyWork $dailyWork, int $mediaId): bool
    {
        $media = $dailyWork->getMedia('rfi_files')->where('id', $mediaId)->first();

        if (! $media) {
            return false;
        }

        $media->delete();

        return true;
    }

    /**
     * Get a specific RFI file media object.
     */
    public function getRfiFile(DailyWork $dailyWork, int $mediaId): ?Media
    {
        return $dailyWork->getMedia('rfi_files')->where('id', $mediaId)->first();
    }

    /**
     * Upload RFI file for a daily work task (legacy method - kept for compatibility)
     *
     * @deprecated Use uploadRfiFiles instead
     */
    public function uploadRfiFile(Request $request): array
    {
        $this->validateRfiFileRequest($request);

        $task = DailyWork::find($request->taskId);

        if (! $request->hasFile('file')) {
            throw new \Exception('No file uploaded');
        }

        $newRfiFile = $request->file('file');

        // Clear old file from 'rfi_files' collection if it exists
        $task->clearMediaCollection('rfi_files');

        // Add the new RFI file to the 'rfi_files' collection
        $task->addMediaFromRequest('file')->toMediaCollection('rfi_files');

        // Get the new file URL
        $newRfiFileUrl = $task->getFirstMediaUrl('rfi_files');

        // Store the URL in the task
        $task->file = $newRfiFileUrl;
        $task->save();

        return [
            'message' => 'RFI file uploaded successfully',
            'url' => $newRfiFileUrl,
        ];
    }

    /**
     * Attach report (NCR or Objection) to a task
     */
    public function attachReport(Request $request): array
    {
        $taskId = $request->input('task_id');
        $selectedReport = $request->input('selected_report');

        $task = Tasks::findOrFail($taskId);

        // Split the selected option into type and id
        [$type, $id] = explode('_', $selectedReport);

        $attachmentResult = $this->processReportAttachment($task, $type, $id);

        // Update the timestamp of the task
        $task->touch();

        // Retrieve the updated task data
        $updatedTask = Tasks::with('ncrs', 'objections')->findOrFail($taskId);

        return [
            'message' => $attachmentResult['message'],
            'updatedRowData' => $updatedTask,
        ];
    }

    /**
     * Detach reports from a task
     */
    public function detachReport(Request $request): array
    {
        $taskId = $request->input('task_id');
        $task = Tasks::findOrFail($taskId);

        $detachmentResult = $this->processReportDetachment($task);

        // Update the timestamp of the task
        $task->touch();

        // Retrieve the updated task data
        $updatedTask = Tasks::with('ncrs', 'objections')->findOrFail($taskId);

        return [
            'message' => $detachmentResult['message'],
            'updatedRowData' => $updatedTask,
        ];
    }

    /**
     * Validate RFI file upload request
     */
    private function validateRfiFileRequest(Request $request): void
    {
        $request->validate([
            'taskId' => 'required|exists:daily_works,id',
            'file' => 'required|mimes:pdf|max:5120', // PDF file up to 5 MB
        ]);
    }

    /**
     * Process report attachment based on type
     */
    private function processReportAttachment(Tasks $task, string $type, string $id): array
    {
        if ($type === 'ncr') {
            return $this->attachNcr($task, $id);
        } elseif ($type === 'obj') {
            return $this->attachObjection($task, $id);
        }

        throw new \Exception('Invalid report type');
    }

    /**
     * Attach NCR to task
     */
    private function attachNcr(Tasks $task, string $ncrNo): array
    {
        $ncr = NCR::where('ncr_no', $ncrNo)->firstOrFail();

        // Check if the NCR is already attached to the task
        if (! $task->ncrs()->where('ncr_no', $ncr->ncr_no)->exists()) {
            $task->ncrs()->attach($ncr->id);
        }

        return [
            'message' => "NCR {$ncrNo} attached to {$task->number} successfully.",
        ];
    }

    /**
     * Attach Objection to task
     */
    private function attachObjection(Tasks $task, string $objNo): array
    {
        $objection = Objection::where('obj_no', $objNo)->firstOrFail();

        // Check if the Objection is already attached to the task
        if (! $task->objections()->where('obj_no', $objection->obj_no)->exists()) {
            $task->objections()->attach($objection->id);
        }

        return [
            'message' => "Objection {$objNo} attached to {$task->number} successfully.",
        ];
    }

    /**
     * Process report detachment
     */
    private function processReportDetachment(Tasks $task): array
    {
        // If task has NCRs, detach them
        if ($task->ncrs->count() > 0) {
            $detachedNCRs = $task->ncrs()->detach();
            $message = $detachedNCRs > 0
                ? "NCR detached from task {$task->number} successfully."
                : "No NCRs were attached to task {$task->number}.";

            return ['message' => $message];
        }

        // If task has Objections, detach them
        if ($task->objections->count() > 0) {
            $detachedObjections = $task->objections()->detach();
            $message = $detachedObjections > 0
                ? "Objection detached from task {$task->number} successfully."
                : "No Objections were attached to task {$task->number}.";

            return ['message' => $message];
        }

        return ['message' => 'No reports attached to this task.'];
    }

    /**
     * Generate a unique filename for uploaded file.
     */
    private function generateUniqueFileName(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $originalName);

        return $sanitizedName.'_'.uniqid().'.'.$extension;
    }

    /**
     * Format bytes to human readable size.
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision).' '.$units[$pow];
    }
}
