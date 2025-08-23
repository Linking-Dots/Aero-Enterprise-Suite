<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserDevice;
use App\Services\DeviceTrackingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SingleDeviceLoginTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;

    protected DeviceTrackingService $deviceService;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test user
        $this->user = User::factory()->create([
            'single_device_login_enabled' => false,
        ]);

        $this->deviceService = app(DeviceTrackingService::class);
    }

    /** @test */
    public function user_can_enable_single_device_login()
    {
        $this->assertFalse($this->user->hasSingleDeviceLoginEnabled());

        $result = $this->user->enableSingleDeviceLogin('Test enable');

        $this->assertTrue($result);
        $this->assertTrue($this->user->fresh()->hasSingleDeviceLoginEnabled());
        $this->assertEquals('Test enable', $this->user->fresh()->device_reset_reason);
    }

    /** @test */
    public function user_can_disable_single_device_login()
    {
        $this->user->update(['single_device_login_enabled' => true]);

        $this->assertTrue($this->user->hasSingleDeviceLoginEnabled());

        $result = $this->user->disableSingleDeviceLogin('Test disable');

        $this->assertTrue($result);
        $this->assertFalse($this->user->fresh()->hasSingleDeviceLoginEnabled());
        $this->assertEquals('Test disable', $this->user->fresh()->device_reset_reason);
    }

    /** @test */
    public function user_can_reset_devices()
    {
        // Create some test devices
        UserDevice::factory()->create([
            'user_id' => $this->user->id,
            'is_active' => true,
            'session_id' => 'session1',
        ]);

        UserDevice::factory()->create([
            'user_id' => $this->user->id,
            'is_active' => true,
            'session_id' => 'session2',
        ]);

        $this->assertEquals(2, $this->user->activeDevices()->count());

        $result = $this->user->resetDevices('Admin test reset');

        $this->assertTrue($result);
        $this->assertEquals(0, $this->user->fresh()->activeDevices()->count());
        $this->assertEquals('Admin test reset', $this->user->fresh()->device_reset_reason);
        $this->assertNotNull($this->user->fresh()->device_reset_at);
    }

    /** @test */
    public function admin_can_toggle_single_device_login_via_api()
    {
        // Create admin user with proper permissions
        $admin = User::factory()->create();
        $adminRole = Role::create(['name' => 'admin']);
        $admin->assignRole($adminRole);

        $this->actingAs($admin);

        // Enable single device login
        $response = $this->postJson(route('users.device.toggle'), [
            'user_id' => $this->user->id,
            'enabled' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'user' => [
                    'id' => $this->user->id,
                    'single_device_login' => true,
                ],
            ]);

        $this->assertTrue($this->user->fresh()->hasSingleDeviceLoginEnabled());
    }

    /** @test */
    public function admin_can_reset_user_devices_via_api()
    {
        // Create some test devices
        UserDevice::factory()->create([
            'user_id' => $this->user->id,
            'is_active' => true,
        ]);

        // Create admin user
        $admin = User::factory()->create();
        $adminRole = Role::create(['name' => 'admin']);
        $admin->assignRole($adminRole);

        $this->actingAs($admin);

        $response = $this->postJson(route('users.device.reset'), [
            'user_id' => $this->user->id,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'user' => [
                    'id' => $this->user->id,
                    'active_device' => null,
                ],
            ]);

        $this->assertEquals(0, $this->user->fresh()->activeDevices()->count());
    }

    /** @test */
    public function device_service_can_check_login_permission()
    {
        $request = Request::create('/', 'GET');
        $request->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 Test Browser');
        $request->server->set('REMOTE_ADDR', '127.0.0.1');

        // Test when single device login is disabled
        $result = $this->deviceService->canUserLoginFromDevice($this->user, $request);
        $this->assertTrue($result['allowed']);

        // Enable single device login
        $this->user->enableSingleDeviceLogin();

        // Test first login (should be allowed)
        $result = $this->deviceService->canUserLoginFromDevice($this->user, $request);
        $this->assertTrue($result['allowed']);

        // Register a device
        $device = $this->deviceService->registerDevice($this->user, $request, 'session123');

        // Test login from same device (should be allowed)
        $result = $this->deviceService->canUserLoginFromDevice($this->user, $request);
        $this->assertTrue($result['allowed']);

        // Create a different request (different device)
        $newRequest = Request::create('/', 'GET');
        $newRequest->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 Different Browser');
        $newRequest->server->set('REMOTE_ADDR', '192.168.1.1');

        // Test login from different device (should be blocked)
        $result = $this->deviceService->canUserLoginFromDevice($this->user, $newRequest);
        $this->assertFalse($result['allowed']);
        $this->assertArrayHasKey('blocked_by_device', $result);
    }

    /** @test */
    public function user_device_summary_returns_correct_data()
    {
        // Create test devices
        UserDevice::factory()->create([
            'user_id' => $this->user->id,
            'is_active' => true,
        ]);

        UserDevice::factory()->create([
            'user_id' => $this->user->id,
            'is_active' => false,
        ]);

        $summary = $this->user->getDeviceSummary();

        $this->assertEquals(2, $summary['total_devices']);
        $this->assertEquals(1, $summary['active_devices']);
        $this->assertFalse($summary['single_device_enabled']);
        $this->assertNotNull($summary['current_device']);
    }

    /** @test */
    public function single_device_login_accessor_works_correctly()
    {
        $this->assertFalse($this->user->single_device_login);

        $this->user->update(['single_device_login_enabled' => true]);

        $this->assertTrue($this->user->fresh()->single_device_login);
    }
}
