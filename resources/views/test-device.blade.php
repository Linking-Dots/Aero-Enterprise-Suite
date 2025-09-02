<!DOCTYPE html>
<html>
<head>
    <title>Device Info Test</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <h2>Device Hardware Info Test</h2>
    <form id="deviceForm">
        <div>
            <label>Device Model:</label>
            <input type="text" name="device_model" id="device_model" placeholder="e.g., iPhone 14 Pro">
        </div>
        <div>
            <label>Device Serial/ID:</label>
            <input type="text" name="device_serial" id="device_serial" placeholder="e.g., stable device identifier">
        </div>
        <div>
            <label>Device MAC (optional):</label>
            <input type="text" name="device_mac" id="device_mac" placeholder="Usually not available">
        </div>
        <button type="submit">Test Device Info Capture</button>
    </form>

    <div id="result" style="margin-top: 20px; background: #f5f5f5; padding: 10px; display: none;">
        <h3>Backend Response:</h3>
        <pre id="response"></pre>
    </div>

    <script>
        // Auto-populate with browser/JS accessible info
        document.addEventListener('DOMContentLoaded', function() {
            // Try to get some device info from browser
            const deviceModel = navigator.userAgentData?.platform || navigator.platform || 'Unknown';
            const deviceSerial = generateBrowserFingerprint();
            
            document.getElementById('device_model').value = deviceModel;
            document.getElementById('device_serial').value = deviceSerial;

            // For Capacitor apps, you could use:
            // import { Device } from '@capacitor/device';
            // const info = await Device.getInfo();
            // document.getElementById('device_model').value = info.model;
        });

        function generateBrowserFingerprint() {
            // Create a stable browser-based identifier
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Device fingerprint', 2, 2);
            
            const fingerprint = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                canvas.toDataURL()
            ].join('|');
            
            // Simple hash function
            let hash = 0;
            for (let i = 0; i < fingerprint.length; i++) {
                const char = fingerprint.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return 'browser_' + Math.abs(hash).toString(16);
        }

        document.getElementById('deviceForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/debug/device-info', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'X-Device-Model': formData.get('device_model'),
                        'X-Device-Serial': formData.get('device_serial'),
                        'X-Device-Mac': formData.get('device_mac'),
                        'Accept': 'application/json'
                    },
                    body: formData
                });
                
                const data = await response.json();
                document.getElementById('response').textContent = JSON.stringify(data, null, 2);
                document.getElementById('result').style.display = 'block';
            } catch (error) {
                document.getElementById('response').textContent = 'Error: ' + error.message;
                document.getElementById('result').style.display = 'block';
            }
        });
    </script>
</body>
</html>
