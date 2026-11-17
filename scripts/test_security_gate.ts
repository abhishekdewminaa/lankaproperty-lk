import { superAdminSecurityService } from '../src/services/superAdminSecurityService';

console.log('Testing SuperAdmin verifyPassword with master key...');

// Test 1: Verify correct password with no honeypot
const res1 = superAdminSecurityService.verifyPassword('LANKApro2028$');
console.log('Test 1 (Correct key):', res1);
if (!res1.success) throw new Error('Expected success with correct master key!');

// Test 2: Verify correct password even if browser autofilled a string
const res2 = superAdminSecurityService.verifyPassword('LANKApro2028$', 'https://lankaproperty.lk');
console.log('Test 2 (Correct key + autofill):', res2);
if (!res2.success) throw new Error('Expected success with correct master key even with autofill!');

// Test 3: Wrong password
const res3 = superAdminSecurityService.verifyPassword('wrong_password');
console.log('Test 3 (Wrong key):', res3);
if (res3.success) throw new Error('Expected failure with wrong key!');

console.log('\nAll security gate tests passed successfully!');
