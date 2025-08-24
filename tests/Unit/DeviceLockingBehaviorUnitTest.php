<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\DeviceTrackingService;
use Illuminate\Http\Request;
use Tests\TestCase;
use Mockery;

class DeviceLockingBehaviorUnitTest extends TestCase
{
    private DeviceTrackingService $deviceService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->deviceService = new DeviceTrackingService();
    }

    /** @test */
    public function device_service_allows_login_when_single_device_login_disabled()
    {
        // Mock user without single device login enabled
        $user = Mockery::mock(User::class);
        $user->shouldReceive('hasSingleDeviceLoginEnabled')->andReturn(false);
        
        $request = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
        
        $result = $this->deviceService->canUserLoginFromDevice($user, $request);
        
        $this->assertTrue($result['allowed']);
        $this->assertEquals('Login allowed', $result['message']);
    }

    /** @test */
    public function device_service_checks_devices_when_single_device_login_enabled()
    {
        // Mock user with single device login enabled but no active devices
        $user = Mockery::mock(User::class);
        $user->shouldReceive('hasSingleDeviceLoginEnabled')->andReturn(true);
        
        // Mock the devices relationship
        $devicesRelation = Mockery::mock();
        $devicesRelation->shouldReceive('where->active->first')->andReturn(null); // No exact device match
        $devicesRelation->shouldReceive('where->active->first')->andReturn(null); // No compatible device match
        $devicesRelation->shouldReceive('first')->andReturn(null); // No active devices at all
        
        $user->shouldReceive('devices')->andReturn($devicesRelation);
        
        $request = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
        
        $result = $this->deviceService->canUserLoginFromDevice($user, $request);
        
        $this->assertTrue($result['allowed']);
        $this->assertEquals('Login allowed: No active devices found', $result['message']);
    }

    /** @test */
    public function device_fingerprinting_creates_different_ids_for_different_devices()
    {
        $iPhoneRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $androidRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');
        
        $iPhoneDeviceId = $this->deviceService->generateDeviceId($iPhoneRequest);
        $androidDeviceId = $this->deviceService->generateDeviceId($androidRequest);
        
        $this->assertNotEquals($iPhoneDeviceId, $androidDeviceId, 'Different devices should have different device IDs');
    }

    /** @test */
    public function device_fingerprinting_creates_same_compatible_id_for_same_device_type()
    {
        $iPhone15Request = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $iPhone16Request = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
        
        $iPhone15CompatibleId = $this->deviceService->generateCompatibleDeviceId($iPhone15Request);
        $iPhone16CompatibleId = $this->deviceService->generateCompatibleDeviceId($iPhone16Request);
        
        $this->assertEquals($iPhone15CompatibleId, $iPhone16CompatibleId, 'Same device type with different OS versions should have same compatible ID');
    }

    /** @test */
    public function device_fingerprinting_creates_different_compatible_ids_for_different_device_types()
    {
        $iPhoneRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $androidRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');
        
        $iPhoneCompatibleId = $this->deviceService->generateCompatibleDeviceId($iPhoneRequest);
        $androidCompatibleId = $this->deviceService->generateCompatibleDeviceId($androidRequest);
        
        $this->assertNotEquals($iPhoneCompatibleId, $androidCompatibleId, 'Different device types should have different compatible IDs');
    }

    private function createRequestWithUserAgent(string $userAgent): Request
    {
        return Request::create('/', 'GET', [], [], [], [
            'HTTP_USER_AGENT' => $userAgent,
            'HTTP_ACCEPT_LANGUAGE' => 'en-US,en;q=0.9',
            'HTTP_ACCEPT_ENCODING' => 'gzip, deflate, br',
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
