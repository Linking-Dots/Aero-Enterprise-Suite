<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\DeviceTrackingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class DeviceLockingBehaviorTest extends TestCase
{
    use RefreshDatabase;

    private DeviceTrackingService $deviceService;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->deviceService = app(DeviceTrackingService::class);
        
        // Create a user with single device login enabled
        $this->user = User::factory()->create([
            'single_device_login_enabled' => true,
        ]);
    }

    /** @test */
    public function user_can_login_from_first_device()
    {
        $request = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        
        $result = $this->deviceService->canUserLoginFromDevice($this->user, $request);
        
        $this->assertTrue($result['allowed']);
        $this->assertEquals('Login allowed: No active devices found', $result['message']);
    }

    /** @test */
    public function user_cannot_login_from_second_different_device()
    {
        // First device login
        $firstRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $this->deviceService->registerDevice($this->user, $firstRequest, 'session1');
        
        // Try to login from a completely different device
        $secondRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        $result = $this->deviceService->canUserLoginFromDevice($this->user, $secondRequest);
        
        $this->assertFalse($result['allowed']);
        $this->assertStringContainsString('Login blocked: Account is active on another device', $result['message']);
    }

    /** @test */
    public function user_can_login_from_same_device_with_updated_fingerprint()
    {
        // First device login
        $firstRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $this->deviceService->registerDevice($this->user, $firstRequest, 'session1');
        
        // Same device but with slightly different user agent (OS update)
        $updatedRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15');
        
        $result = $this->deviceService->canUserLoginFromDevice($this->user, $updatedRequest);
        
        $this->assertTrue($result['allowed']);
        $this->assertStringContainsString('Login from same device', $result['message']);
    }

    /** @test */
    public function user_can_login_from_compatible_device()
    {
        // First device login
        $firstRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $this->deviceService->registerDevice($this->user, $firstRequest, 'session1');
        
        // Same browser and platform but different version
        $compatibleRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
        
        $result = $this->deviceService->canUserLoginFromDevice($this->user, $compatibleRequest);
        
        // This should be allowed as it's the same device type (iPhone with Safari)
        $this->assertTrue($result['allowed']);
    }

    /** @test */
    public function multiple_users_can_each_have_one_device()
    {
        $user2 = User::factory()->create(['single_device_login_enabled' => true]);
        
        // User 1 logs in from iPhone
        $user1Request = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $this->deviceService->registerDevice($this->user, $user1Request, 'session1');
        
        // User 2 logs in from Android
        $user2Request = $this->createRequestWithUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');
        $this->deviceService->registerDevice($user2, $user2Request, 'session2');
        
        // Both should be able to login from their respective devices
        $user1Result = $this->deviceService->canUserLoginFromDevice($this->user, $user1Request);
        $user2Result = $this->deviceService->canUserLoginFromDevice($user2, $user2Request);
        
        $this->assertTrue($user1Result['allowed']);
        $this->assertTrue($user2Result['allowed']);
        
        // User 1 should not be able to login from User 2's device
        $user1FromUser2Device = $this->deviceService->canUserLoginFromDevice($this->user, $user2Request);
        $this->assertFalse($user1FromUser2Device['allowed']);
    }

    /** @test */
    public function user_with_disabled_single_device_can_use_multiple_devices()
    {
        $userWithoutRestriction = User::factory()->create(['single_device_login_enabled' => false]);
        
        $iPhoneRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $androidRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36');
        
        // Register iPhone
        $this->deviceService->registerDevice($userWithoutRestriction, $iPhoneRequest, 'session1');
        
        // Should be able to login from Android too since single device login is disabled
        // Note: The canUserLoginFromDevice method should allow this, but let's verify
        $result = $this->deviceService->canUserLoginFromDevice($userWithoutRestriction, $androidRequest);
        
        // This test might fail if the service doesn't check the user's single_device_login_enabled setting
        // In that case, we'd need to modify the service
        $this->assertTrue($result['allowed'], 'User without single device restriction should be able to use multiple devices');
    }

    private function createRequestWithUserAgent(string $userAgent): Request
    {
        return Request::create('/', 'GET', [], [], [], [
            'HTTP_USER_AGENT' => $userAgent,
            'HTTP_ACCEPT_LANGUAGE' => 'en-US,en;q=0.9',
            'HTTP_ACCEPT_ENCODING' => 'gzip, deflate, br',
        ]);
    }
}
