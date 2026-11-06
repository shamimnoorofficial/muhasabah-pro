/* Qibla bearing maths: well-known directions from a few cities (±1.5°). node tests/qibla.cjs */
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync('pwa/qibla.js', 'utf8'), sandbox);
const { bearing, distanceKm } = sandbox.window.MHSQibla;
const near = (a, b, tol) => Math.abs(((a - b + 540) % 360) - 180) <= tol;
assert.ok(near(bearing(23.8103, 90.4125), 278.5, 1.5), 'Dhaka → ' + bearing(23.8103, 90.4125));
assert.ok(near(bearing(51.5074, -0.1278), 118.9, 1.5), 'London → ' + bearing(51.5074, -0.1278));
assert.ok(near(bearing(40.7128, -74.006), 58.5, 1.5), 'New York → ' + bearing(40.7128, -74.006));
assert.ok(near(bearing(-6.2088, 106.8456), 295.1, 1.5), 'Jakarta → ' + bearing(-6.2088, 106.8456));
assert.ok(near(bearing(24.5247, 39.5692), 176.0, 1.5), 'Madinah → ' + bearing(24.5247, 39.5692));
assert.ok(Math.abs(distanceKm(23.8103, 90.4125) - 5170) < 60, 'Dhaka distance ' + distanceKm(23.8103, 90.4125));
assert.ok(distanceKm(21.422487, 39.826206) < 0.01, 'at the Kaaba');
console.log('Qibla: bearings for Dhaka, London, New York, Jakarta and Madinah passed');
