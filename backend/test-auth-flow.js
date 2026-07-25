import { register, login, verifyOtp, forgotPassword, resetPassword } from './src/services/authService.js';
import * as otpRepo from './src/repositories/otpRepository.js';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function testCompleteAuthFlow() {
  const testEmail = `test_flow_${Date.now()}@example.com`;
  const initialPassword = 'Password123!';
  const updatedPassword = 'NewPassword456!';
  let otpCode = null;

  console.log('==============================================');
  console.log('      NEARHIRE.AI AUTH FLOW INTEGRATION TEST   ');
  console.log('==============================================');
  console.log(`Test Email: ${testEmail}\n`);

  try {
    // 1. REGISTER
    console.log('Step 1: Registering new user...');
    const regResult = await register({
      name: 'Integration Test User',
      email: testEmail,
      password: initialPassword,
      role: 'seeker',
    });
    console.log('✅ Registration successful! User ID:', regResult.user.id);

    // 2. LOGIN (Step 1)
    console.log('\nStep 2: Initiating login (Credentials check)...');
    const loginStep1 = await login({ email: testEmail, password: initialPassword });
    console.log('✅ Step 1 login successful! OTP Required:', loginStep1.otpRequired);

    // Retrieve generated OTP from DB
    const otpRecord = await otpRepo.findByEmailAndType(testEmail, 'LOGIN');
    if (!otpRecord) throw new Error('OTP record not found in DB!');

    // Since OTP is hashed in DB, in dev mode OTP is written to otp-debug.log or logged
    // We can also generate a known OTP for test or read from log
    const fs = await import('fs');
    let loggedOtp = '123456';
    if (fs.existsSync('otp-debug.log')) {
      const logContent = JSON.parse(fs.readFileSync('otp-debug.log', 'utf8'));
      if (logContent.email === testEmail) loggedOtp = logContent.otp;
    }

    console.log(`🔑 OTP generated for test user: ${loggedOtp}`);

    // 3. VERIFY OTP (Step 2)
    console.log('\nStep 3: Verifying OTP for login...');
    const verifyResult = await verifyOtp({ email: testEmail, otp: loggedOtp });
    console.log('✅ OTP Verification successful! Token generated:', verifyResult.token.substring(0, 15) + '...');

    // 4. FORGOT PASSWORD
    console.log('\nStep 4: Initiating Forgot Password flow...');
    await forgotPassword({ email: testEmail });

    let resetOtp = loggedOtp;
    if (fs.existsSync('otp-debug.log')) {
      const logContent = JSON.parse(fs.readFileSync('otp-debug.log', 'utf8'));
      if (logContent.email === testEmail && logContent.type === 'PASSWORD_RESET') {
        resetOtp = logContent.otp;
      }
    }
    console.log(`🔑 Reset Password OTP generated: ${resetOtp}`);

    // 5. RESET PASSWORD
    console.log('\nStep 5: Resetting password with OTP...');
    await resetPassword({ email: testEmail, otp: resetOtp, password: updatedPassword });
    console.log('✅ Password reset successful!');

    // 6. LOGIN WITH NEW PASSWORD
    console.log('\nStep 6: Logging in with NEW password...');
    const loginNew = await login({ email: testEmail, password: updatedPassword });
    console.log('✅ Login with new password successful!');

    // CLEANUP
    console.log('\nCleaning up test user...');
    await db.delete(users).where(eq(users.email, testEmail));
    console.log('✅ Test user cleaned up.');

    console.log('\n==============================================');
    console.log('  🎉 ALL AUTHENTICATION FLOW TESTS PASSED!     ');
    console.log('==============================================\n');
  } catch (err) {
    console.error('\n❌ AUTH TEST FAILED:', err.message);
    // Cleanup on failure
    await db.delete(users).where(eq(users.email, testEmail)).catch(() => {});
    process.exit(1);
  }
}

testCompleteAuthFlow();
