<?php

namespace Tests\Feature;

use App\Models\DailyWork;
use App\Models\RfiObjection;
use App\Models\User;
use App\Notifications\RfiObjectionNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class RfiObjectionWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $incharge;
    protected User $assigned;
    protected DailyWork $dailyWork;

    protected function setUp(): void
    {
        parent::setUp();

        // Clear permission cache
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Create permissions
        Permission::create(['name' => 'rfi-objections.view']);
        Permission::create(['name' => 'rfi-objections.create']);
        Permission::create(['name' => 'rfi-objections.update']);
        Permission::create(['name' => 'rfi-objections.delete']);
        Permission::create(['name' => 'rfi-objections.review']);

        // Create roles
        $adminRole = Role::create(['name' => 'Administrator']);
        $adminRole->givePermissionTo([
            'rfi-objections.view',
            'rfi-objections.create',
            'rfi-objections.update',
            'rfi-objections.delete',
            'rfi-objections.review',
        ]);

        // Create users
        $this->admin = User::factory()->create();
        $this->admin->assignRole('Administrator');

        $this->incharge = User::factory()->create();
        $this->assigned = User::factory()->create();

        // Create a daily work
        $this->dailyWork = DailyWork::factory()->create([
            'number' => 'RFI-2025-001',
            'date' => '2025-12-01',
            'status' => 'new',
            'incharge' => $this->incharge->id,
            'assigned' => $this->assigned->id,
            'type' => 'Structure',
            'description' => 'Bridge foundation work',
            'location' => 'K05+560',
            'rfi_submission_date' => '2025-12-01',
        ]);

        // Set up fake storage for file uploads
        Storage::fake('public');
    }

    /** @test */
    public function user_can_view_objections_for_an_rfi(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'title' => 'Design Issue',
            'status' => RfiObjection::STATUS_SUBMITTED,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson(route('dailyWorks.objections.index', $this->dailyWork->id));

        $response->assertOk()
            ->assertJsonStructure([
                'objections' => [
                    '*' => [
                        'id',
                        'title',
                        'category',
                        'description',
                        'reason',
                        'status',
                        'created_at',
                    ],
                ],
                'total',
                'active_count',
            ])
            ->assertJson([
                'total' => 1,
                'active_count' => 1,
            ]);
    }

    /** @test */
    public function user_can_create_objection_as_draft(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.store', $this->dailyWork->id), [
                'title' => 'Foundation depth issue',
                'category' => RfiObjection::CATEGORY_DESIGN_CONFLICT,
                'description' => 'The foundation depth does not match the approved drawings',
                'reason' => 'Site conditions require deeper foundation',
                'status' => RfiObjection::STATUS_DRAFT,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'objection' => [
                    'id',
                    'title',
                    'category',
                    'description',
                    'reason',
                    'status',
                ],
            ])
            ->assertJson([
                'objection' => [
                    'title' => 'Foundation depth issue',
                    'status' => RfiObjection::STATUS_DRAFT,
                ],
            ]);

        $this->assertDatabaseHas('rfi_objections', [
            'daily_work_id' => $this->dailyWork->id,
            'title' => 'Foundation depth issue',
            'status' => RfiObjection::STATUS_DRAFT,
        ]);

        // Check status log was created
        $this->assertDatabaseHas('rfi_objection_status_logs', [
            'to_status' => RfiObjection::STATUS_DRAFT,
        ]);
    }

    /** @test */
    public function user_can_create_and_submit_objection_immediately(): void
    {
        Notification::fake();

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.store', $this->dailyWork->id), [
                'title' => 'Safety concern',
                'category' => RfiObjection::CATEGORY_SAFETY_CONCERN,
                'description' => 'Inadequate safety barriers',
                'reason' => 'Risk of worker injury',
                'status' => RfiObjection::STATUS_SUBMITTED,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('rfi_objections', [
            'daily_work_id' => $this->dailyWork->id,
            'title' => 'Safety concern',
            'status' => RfiObjection::STATUS_SUBMITTED,
        ]);

        // Verify notifications were sent
        Notification::assertSentTo(
            [$this->incharge, $this->assigned],
            RfiObjectionNotification::class
        );
    }

    /** @test */
    public function user_can_update_draft_objection(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'title' => 'Original title',
            'status' => RfiObjection::STATUS_DRAFT,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson(route('dailyWorks.objections.update', [$this->dailyWork->id, $objection->id]), [
                'title' => 'Updated title',
                'description' => 'Updated description',
                'reason' => 'Updated reason',
            ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Objection updated successfully.',
            ]);

        $this->assertDatabaseHas('rfi_objections', [
            'id' => $objection->id,
            'title' => 'Updated title',
        ]);
    }

    /** @test */
    public function user_can_submit_draft_objection_for_review(): void
    {
        Notification::fake();

        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_DRAFT,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.submit', [$this->dailyWork->id, $objection->id]));

        $response->assertOk()
            ->assertJson([
                'message' => 'Objection submitted for review.',
            ]);

        $this->assertDatabaseHas('rfi_objections', [
            'id' => $objection->id,
            'status' => RfiObjection::STATUS_SUBMITTED,
        ]);

        // Check status log
        $this->assertDatabaseHas('rfi_objection_status_logs', [
            'rfi_objection_id' => $objection->id,
            'from_status' => RfiObjection::STATUS_DRAFT,
            'to_status' => RfiObjection::STATUS_SUBMITTED,
        ]);
    }

    /** @test */
    public function reviewer_can_start_review_on_submitted_objection(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_SUBMITTED,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.review', [$this->dailyWork->id, $objection->id]));

        $response->assertOk();

        $this->assertDatabaseHas('rfi_objections', [
            'id' => $objection->id,
            'status' => RfiObjection::STATUS_UNDER_REVIEW,
        ]);
    }

    /** @test */
    public function reviewer_can_resolve_objection(): void
    {
        Notification::fake();

        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_UNDER_REVIEW,
            'created_by' => $this->assigned->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.resolve', [$this->dailyWork->id, $objection->id]), [
                'resolution_notes' => 'Issue has been addressed per the revised drawings.',
            ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Objection resolved successfully.',
            ]);

        $objection->refresh();

        $this->assertEquals(RfiObjection::STATUS_RESOLVED, $objection->status);
        $this->assertEquals('Issue has been addressed per the revised drawings.', $objection->resolution_notes);
        $this->assertEquals($this->admin->id, $objection->resolved_by);
        $this->assertNotNull($objection->resolved_at);

        // Check notification sent to creator
        Notification::assertSentTo([$this->assigned], RfiObjectionNotification::class);
    }

    /** @test */
    public function reviewer_can_reject_objection(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_UNDER_REVIEW,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.reject', [$this->dailyWork->id, $objection->id]), [
                'rejection_reason' => 'Objection is not valid based on specifications.',
            ]);

        $response->assertOk();

        $objection->refresh();

        $this->assertEquals(RfiObjection::STATUS_REJECTED, $objection->status);
        $this->assertEquals('Objection is not valid based on specifications.', $objection->resolution_notes);
        $this->assertEquals($this->admin->id, $objection->resolved_by);
    }

    /** @test */
    public function user_can_upload_files_to_objection(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_DRAFT,
            'created_by' => $this->admin->id,
        ]);

        $file = UploadedFile::fake()->image('evidence.jpg', 800, 600);

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.files.upload', [$this->dailyWork->id, $objection->id]), [
                'files' => [$file],
            ]);

        $response->assertOk()
            ->assertJsonStructure([
                'message',
                'files' => [
                    '*' => [
                        'id',
                        'name',
                        'url',
                        'mime_type',
                        'size',
                    ],
                ],
                'total_files',
            ]);

        // Check file was stored
        $this->assertCount(1, $objection->getMedia('objection_files'));
    }

    /** @test */
    public function user_can_delete_file_from_objection(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'created_by' => $this->admin->id,
        ]);

        $file = UploadedFile::fake()->image('test.jpg');
        $media = $objection->addMedia($file)->toMediaCollection('objection_files');

        $response = $this->actingAs($this->admin)
            ->deleteJson(route('dailyWorks.objections.files.delete', [
                $this->dailyWork->id,
                $objection->id,
                $media->id,
            ]));

        $response->assertOk()
            ->assertJson([
                'message' => 'File deleted successfully.',
            ]);

        $this->assertCount(0, $objection->fresh()->getMedia('objection_files'));
    }

    /** @test */
    public function user_can_delete_draft_objection(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_DRAFT,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson(route('dailyWorks.objections.destroy', [$this->dailyWork->id, $objection->id]));

        $response->assertOk()
            ->assertJson([
                'message' => 'Objection deleted successfully.',
            ]);

        $this->assertSoftDeleted('rfi_objections', [
            'id' => $objection->id,
        ]);
    }

    /** @test */
    public function active_objections_are_counted_correctly(): void
    {
        // Create various objections
        RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_DRAFT,
        ]);

        RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_SUBMITTED,
        ]);

        RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_UNDER_REVIEW,
        ]);

        RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_RESOLVED,
        ]);

        RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_REJECTED,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson(route('dailyWorks.objections.index', $this->dailyWork->id));

        $response->assertOk()
            ->assertJson([
                'total' => 5,
                'active_count' => 3, // draft, submitted, under_review
            ]);
    }

    /** @test */
    public function cannot_submit_already_submitted_objection(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_SUBMITTED,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.submit', [$this->dailyWork->id, $objection->id]));

        $response->assertStatus(422)
            ->assertJson([
                'error' => 'Only draft objections can be submitted.',
            ]);
    }

    /** @test */
    public function cannot_resolve_draft_objection(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.resolve', [$this->dailyWork->id, $objection->id]), [
                'resolution_notes' => 'Resolved',
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function objection_validation_requires_all_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.store', $this->dailyWork->id), [
                // Missing required fields
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'description', 'reason']);
    }

    /** @test */
    public function objection_category_must_be_valid(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.store', $this->dailyWork->id), [
                'title' => 'Test',
                'category' => 'invalid_category',
                'description' => 'Test description',
                'reason' => 'Test reason',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category']);
    }

    /** @test */
    public function file_upload_validates_mime_types(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'created_by' => $this->admin->id,
        ]);

        $file = UploadedFile::fake()->create('document.exe', 100, 'application/x-msdownload');

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.files.upload', [$this->dailyWork->id, $objection->id]), [
                'files' => [$file],
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function file_upload_validates_size_limit(): void
    {
        $objection = RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'created_by' => $this->admin->id,
        ]);

        // Create a file larger than 10MB
        $file = UploadedFile::fake()->create('large.pdf', 11000);

        $response = $this->actingAs($this->admin)
            ->postJson(route('dailyWorks.objections.files.upload', [$this->dailyWork->id, $objection->id]), [
                'files' => [$file],
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function daily_work_has_active_objections_count(): void
    {
        RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_SUBMITTED,
        ]);

        RfiObjection::factory()->create([
            'daily_work_id' => $this->dailyWork->id,
            'status' => RfiObjection::STATUS_RESOLVED,
        ]);

        $dailyWork = DailyWork::withCount('activeObjections')->find($this->dailyWork->id);

        $this->assertEquals(1, $dailyWork->active_objections_count);
    }
}
