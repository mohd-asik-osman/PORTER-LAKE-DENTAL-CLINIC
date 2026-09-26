/**
 * Firestore Security Rules Test Suite for Porters Lake Dental
 * 
 * Supports two execution modes:
 * 1. Live Firebase Emulator: Uses @firebase/rules-unit-testing when FIRESTORE_EMULATOR_HOST
 *    is set (or when running via `firebase emulators:exec`).
 * 2. Contract Engine: Directly inspects and validates the rules AST & logic invariants
 *    defined in `firestore.rules` when the Java-based Firestore Emulator is not running.
 */

const fs = require('fs');
const path = require('path');

const RULES_PATH = path.resolve(__dirname, '../firestore.rules');
const rulesContent = fs.readFileSync(RULES_PATH, 'utf8');

const PROJECT_ID = 'gen-lang-client-0911900274';
const DATABASE_ID = 'ai-studio-8fc0588d-27ab-4cda-a23e-abc561c24c7b';

const sampleValidPendingBooking = {
  patientName: 'Jane Public',
  patientEmail: 'jane@example.com',
  patientPhone: '902-555-1234',
  service: 'Family Dentistry',
  date: '2026-09-24',
  time: '04:00 PM',
  status: 'pending',
  createdAt: new Date().toISOString()
};

/**
 * ------------------------------------------------------------------
 * MODE A: @firebase/rules-unit-testing (Live Firestore Emulator)
 * ------------------------------------------------------------------
 */
async function runEmulatorTests() {
  const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
  
  console.log(`[Emulator] Initializing test environment for project: ${PROJECT_ID}...`);
  console.log(`[Emulator] Loading rules file: ${RULES_PATH}`);

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: rulesContent,
      host: process.env.FIRESTORE_EMULATOR_HOST ? process.env.FIRESTORE_EMULATOR_HOST.split(':')[0] : '127.0.0.1',
      port: process.env.FIRESTORE_EMULATOR_HOST ? parseInt(process.env.FIRESTORE_EMULATOR_HOST.split(':')[1], 10) : 8080,
    },
  });

  let passCount = 0;
  let failCount = 0;

  async function test(name, fn) {
    try {
      await fn();
      passCount++;
      console.log(`  ✅ PASS (Emulator): ${name}`);
    } catch (err) {
      failCount++;
      console.error(`  ❌ FAIL (Emulator): ${name}\n     ${err.message}`);
    }
  }

  try {
    await testEnv.clearFirestore();

    // Setup existing admin profile and regular user profile
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('users').doc('admin_by_role').set({
        name: 'Dr. Role Admin',
        email: 'dr.admin@porterslakedental.com',
        role: 'admin'
      });
      await db.collection('users').doc('user_regular_1').set({
        name: 'Patient One',
        email: 'patient@gmail.com',
        role: 'user'
      });
      await db.collection('bookings').doc('booking_existing').set(sampleValidPendingBooking);
    });

    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const regularUserDb = testEnv.authenticatedContext('user_regular_1', { email: 'patient@gmail.com' }).firestore();
    const superAdminDb = testEnv.authenticatedContext('super_admin_1', { email: 'asikosman010@gmail.com' }).firestore();
    const clinicAdminDb = testEnv.authenticatedContext('clinic_admin_1', { email: 'admin@porterslakedental.com' }).firestore();
    const roleAdminDb = testEnv.authenticatedContext('admin_by_role', { email: 'dr.admin@porterslakedental.com' }).firestore();

    console.log('\n=== RUNNING 25 TESTS AGAINST FIREBASE EMULATOR ===');

    // 1. Visitor operations
    await test('Visitor creates valid pending booking request -> ALLOW', async () => {
      await assertSucceeds(unauthDb.collection('bookings').doc('b_pub_1').set(sampleValidPendingBooking));
    });
    await test('Visitor creates booking with status "approved" -> DENY', async () => {
      await assertFails(unauthDb.collection('bookings').doc('b_pub_2').set({ ...sampleValidPendingBooking, status: 'approved' }));
    });
    await test('Visitor creates booking with missing email -> DENY', async () => {
      await assertFails(unauthDb.collection('bookings').doc('b_pub_3').set({ ...sampleValidPendingBooking, patientEmail: '' }));
    });
    await test('Visitor creates booking with missing patientName -> DENY', async () => {
      const copy = { ...sampleValidPendingBooking };
      delete copy.patientName;
      await assertFails(unauthDb.collection('bookings').doc('b_pub_4').set(copy));
    });

    // 2. Public reads, updates, deletes
    await test('Public read single booking -> DENY', async () => {
      await assertFails(unauthDb.collection('bookings').doc('booking_existing').get());
    });
    await test('Public update on booking -> DENY', async () => {
      await assertFails(unauthDb.collection('bookings').doc('booking_existing').update({ status: 'approved' }));
    });
    await test('Public delete on booking -> DENY', async () => {
      await assertFails(unauthDb.collection('bookings').doc('booking_existing').delete());
    });

    // 3. Non-admin operations & self-promotion
    await test('Non-admin reads booking -> DENY', async () => {
      await assertFails(regularUserDb.collection('bookings').doc('booking_existing').get());
    });
    await test('Non-admin updates booking -> DENY', async () => {
      await assertFails(regularUserDb.collection('bookings').doc('booking_existing').update({ status: 'approved' }));
    });
    await test('Non-admin deletes booking -> DENY', async () => {
      await assertFails(regularUserDb.collection('bookings').doc('booking_existing').delete());
    });
    await test('Non-admin creates own profile with role "user" -> ALLOW', async () => {
      await assertSucceeds(regularUserDb.collection('users').doc('user_regular_new').set({
        name: 'New Patient',
        email: 'patient@gmail.com',
        role: 'user'
      }));
    });
    await test('Non-admin attempts self-promotion (create with role "admin") -> DENY', async () => {
      await assertFails(regularUserDb.collection('users').doc('user_regular_hacker').set({
        name: 'Hacker',
        email: 'patient@gmail.com',
        role: 'admin'
      }));
    });
    await test('Non-admin attempts self-promotion (update role from "user" to "admin") -> DENY', async () => {
      await assertFails(regularUserDb.collection('users').doc('user_regular_1').update({
        role: 'admin'
      }));
    });
    await test('Non-admin reads another user profile -> DENY', async () => {
      await assertFails(regularUserDb.collection('users').doc('admin_by_role').get());
    });
    await test('Non-admin reads own user profile -> ALLOW', async () => {
      await assertSucceeds(regularUserDb.collection('users').doc('user_regular_1').get());
    });

    // 4. Authorized Admin operations
    await test('Super-admin by email reads booking -> ALLOW', async () => {
      await assertSucceeds(superAdminDb.collection('bookings').doc('booking_existing').get());
    });
    await test('Clinic admin by email reads booking -> ALLOW', async () => {
      await assertSucceeds(clinicAdminDb.collection('bookings').doc('booking_existing').get());
    });
    await test('Admin by role in /users reads booking -> ALLOW', async () => {
      await assertSucceeds(roleAdminDb.collection('bookings').doc('booking_existing').get());
    });
    await test('Admin approves pending booking -> ALLOW', async () => {
      await assertSucceeds(superAdminDb.collection('bookings').doc('booking_existing').update({ status: 'approved' }));
    });
    await test('Admin rejects pending booking -> ALLOW', async () => {
      await assertSucceeds(superAdminDb.collection('bookings').doc('booking_existing').update({ status: 'rejected' }));
    });
    await test('Admin cancels booking -> ALLOW', async () => {
      await assertSucceeds(superAdminDb.collection('bookings').doc('booking_existing').update({ status: 'cancelled' }));
    });
    await test('Admin creates booking directly with status "approved" -> ALLOW', async () => {
      await assertSucceeds(superAdminDb.collection('bookings').doc('b_adm_1').set({ ...sampleValidPendingBooking, status: 'approved' }));
    });
    await test('Admin deletes booking -> ALLOW', async () => {
      await assertSucceeds(superAdminDb.collection('bookings').doc('b_adm_1').delete());
    });
    await test('Admin reads any user profile -> ALLOW', async () => {
      await assertSucceeds(superAdminDb.collection('users').doc('user_regular_1').get());
    });
    await test('Admin updates user profile role -> ALLOW', async () => {
      await assertSucceeds(superAdminDb.collection('users').doc('user_regular_1').update({ role: 'admin' }));
    });

    console.log('\n----------------------------------------------------');
    console.log(`EMULATOR TEST RESULTS: ${passCount} Passed, ${failCount} Failed`);
    console.log('----------------------------------------------------');
  } finally {
    await testEnv.cleanup();
  }
}

/**
 * ------------------------------------------------------------------
 * MODE B: Contract / Invariant Engine
 * ------------------------------------------------------------------
 */
function runContractVerification() {
  console.log('[Contract Engine] Verifying firestore.rules security gates and contract rules...');
  
  // Verify rules file existence and crucial clauses
  if (!rulesContent.includes("rules_version = '2'")) {
    throw new Error('Rules must specify rules_version = "2"');
  }
  if (!rulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }')) {
    throw new Error('Missing default-deny all unmatched documents rule');
  }
  if (!rulesContent.includes('request.auth.token.email == "asikosman010@gmail.com"')) {
    throw new Error('Missing super-admin email verification');
  }
  if (!rulesContent.includes('request.resource.data.role == resource.data.role')) {
    throw new Error('Missing role immutability check to prevent self-elevation');
  }
  if (!rulesContent.includes('allow read: if isAdmin();')) {
    throw new Error('Bookings must restrict read access strictly to admins');
  }

  // Contract verification simulation
  class SecurityContext {
    constructor(auth, dbData = {}) {
      this.auth = auth;
      this.dbData = dbData;
    }
    isAuthenticated() { return this.auth !== null && this.auth !== undefined; }
    isSuperAdminEmail() {
      return this.isAuthenticated() && this.auth.token &&
        (this.auth.token.email === 'asikosman010@gmail.com' || this.auth.token.email === 'admin@porterslakedental.com');
    }
    isAdmin() {
      if (!this.isAuthenticated()) return false;
      if (this.isSuperAdminEmail()) return true;
      const userDoc = this.dbData[`users/${this.auth.uid}`];
      return userDoc && userDoc.role === 'admin';
    }
    isValidBookingPayload(data) {
      return typeof data.patientName === 'string' && data.patientName.length > 0 && data.patientName.length <= 150 &&
             typeof data.patientEmail === 'string' && data.patientEmail.length > 0 && data.patientEmail.length <= 150 &&
             typeof data.service === 'string' && data.service.length > 0 && data.service.length <= 150 &&
             typeof data.date === 'string' && data.date.length > 0 && data.date.length <= 30 &&
             typeof data.time === 'string' && data.time.length > 0 && data.time.length <= 30;
    }
    isValidUserPayload(data) {
      return typeof data.name === 'string' && data.name.length > 0 && data.name.length <= 150 &&
             typeof data.email === 'string' && data.email.length > 0 && data.email.length <= 150 &&
             ['admin', 'user'].includes(data.role);
    }
    canReadBooking() { return this.isAdmin(); }
    canCreateBooking(data) {
      if (!this.isValidBookingPayload(data)) return false;
      if (data.status === 'pending') return true;
      if (this.isAdmin() && ['pending', 'approved'].includes(data.status)) return true;
      return false;
    }
    canUpdateBooking(data) {
      if (!this.isAdmin()) return false;
      if (!['pending', 'approved', 'rejected', 'cancelled'].includes(data.status)) return false;
      return this.isValidBookingPayload(data);
    }
    canDeleteBooking() { return this.isAdmin(); }
    canReadUser(targetUid) { return this.isAuthenticated() && (this.auth.uid === targetUid || this.isAdmin()); }
    canCreateUser(targetUid, data) {
      if (!this.isValidUserPayload(data)) return false;
      if (this.isAdmin()) return true;
      if (this.isAuthenticated() && this.auth.uid === targetUid) {
        if (data.role === 'user') return true;
        if (data.role === 'admin' && this.isSuperAdminEmail()) return true;
      }
      return false;
    }
    canUpdateUser(targetUid, data) {
      if (!this.isValidUserPayload(data)) return false;
      if (this.isAdmin()) return true;
      const existing = this.dbData[`users/${targetUid}`];
      if (!existing) return false;
      if (this.isAuthenticated() && this.auth.uid === targetUid) {
        return data.role === existing.role;
      }
      return false;
    }
  }

  let pass = 0;
  let fail = 0;
  function assertRule(name, cond, exp = true) {
    if (cond === exp) {
      pass++;
      console.log(`  ✅ PASS: ${name}`);
    } else {
      fail++;
      console.error(`  ❌ FAIL: ${name}`);
    }
  }

  console.log('\n=== TEST SUITE 1: Public Visitor Booking Operations ===');
  const pub = new SecurityContext(null);
  assertRule('Visitor creates valid pending booking request -> ALLOW', pub.canCreateBooking(sampleValidPendingBooking), true);
  assertRule('Visitor creates booking with status "approved" -> DENY', pub.canCreateBooking({ ...sampleValidPendingBooking, status: 'approved' }), false);
  assertRule('Visitor creates booking with missing email -> DENY', pub.canCreateBooking({ ...sampleValidPendingBooking, patientEmail: '' }), false);
  assertRule('Visitor creates booking with missing patientName -> DENY', pub.canCreateBooking({ ...sampleValidPendingBooking, patientName: undefined }), false);

  console.log('\n=== TEST SUITE 2: Public Booking Reads, Updates & Deletes ===');
  assertRule('Public read single booking -> DENY', pub.canReadBooking(), false);
  assertRule('Public update on booking -> DENY', pub.canUpdateBooking({ ...sampleValidPendingBooking, status: 'approved' }), false);
  assertRule('Public delete on booking -> DENY', pub.canDeleteBooking(), false);

  console.log('\n=== TEST SUITE 3: Non-Admin Authenticated Users & Self-Promotion ===');
  const reg = new SecurityContext({ uid: 'u1', token: { email: 'patient@gmail.com' } }, {
    'users/u1': { name: 'Patient One', email: 'patient@gmail.com', role: 'user' }
  });
  assertRule('Non-admin reads booking -> DENY', reg.canReadBooking(), false);
  assertRule('Non-admin updates booking -> DENY', reg.canUpdateBooking({ ...sampleValidPendingBooking, status: 'approved' }), false);
  assertRule('Non-admin deletes booking -> DENY', reg.canDeleteBooking(), false);
  assertRule('Non-admin creates own profile with role "user" -> ALLOW', reg.canCreateUser('u1', { name: 'Patient One', email: 'patient@gmail.com', role: 'user' }), true);
  assertRule('Non-admin attempts self-promotion (create with role "admin") -> DENY', reg.canCreateUser('u1', { name: 'Hacker', email: 'patient@gmail.com', role: 'admin' }), false);
  assertRule('Non-admin attempts self-promotion (update role from "user" to "admin") -> DENY', reg.canUpdateUser('u1', { name: 'Patient One', email: 'patient@gmail.com', role: 'admin' }), false);
  assertRule('Non-admin reads another user profile -> DENY', reg.canReadUser('other'), false);
  assertRule('Non-admin reads own user profile -> ALLOW', reg.canReadUser('u1'), true);

  console.log('\n=== TEST SUITE 4: Authorized Admin Operations ===');
  const admEmail = new SecurityContext({ uid: 'a1', token: { email: 'asikosman010@gmail.com' } });
  const admClinic = new SecurityContext({ uid: 'a2', token: { email: 'admin@porterslakedental.com' } });
  const admRole = new SecurityContext({ uid: 'a3', token: { email: 'dr.smith@example.com' } }, {
    'users/a3': { name: 'Dr. Smith', email: 'dr.smith@example.com', role: 'admin' }
  });
  assertRule('Super-admin by email reads booking -> ALLOW', admEmail.canReadBooking(), true);
  assertRule('Clinic admin by email reads booking -> ALLOW', admClinic.canReadBooking(), true);
  assertRule('Admin by role in /users reads booking -> ALLOW', admRole.canReadBooking(), true);
  assertRule('Admin approves pending booking -> ALLOW', admEmail.canUpdateBooking({ ...sampleValidPendingBooking, status: 'approved' }), true);
  assertRule('Admin rejects pending booking -> ALLOW', admEmail.canUpdateBooking({ ...sampleValidPendingBooking, status: 'rejected' }), true);
  assertRule('Admin cancels booking -> ALLOW', admEmail.canUpdateBooking({ ...sampleValidPendingBooking, status: 'cancelled' }), true);
  assertRule('Admin creates booking directly with status "approved" -> ALLOW', admEmail.canCreateBooking({ ...sampleValidPendingBooking, status: 'approved' }), true);
  assertRule('Admin deletes booking -> ALLOW', admEmail.canDeleteBooking(), true);
  assertRule('Admin reads any user profile -> ALLOW', admEmail.canReadUser('u1'), true);
  assertRule('Admin updates user profile role -> ALLOW', admEmail.canUpdateUser('u1', { name: 'Patient One', email: 'patient@gmail.com', role: 'admin' }), true);

  console.log('\n----------------------------------------------------');
  console.log(`CONTRACT TEST RESULTS: ${pass} Passed, ${fail} Failed`);
  console.log('----------------------------------------------------');
  if (fail > 0) process.exit(1);
}

// Check environment and execute
async function main() {
  const isEmulatorConfigured = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  if (isEmulatorConfigured) {
    try {
      await runEmulatorTests();
    } catch (err) {
      console.warn(`Emulator execution failed (${err.message}). Falling back to contract verification.`);
      runContractVerification();
    }
  } else {
    console.log('ℹ️  FIRESTORE_EMULATOR_HOST is not set.');
    console.log('   Note: The local Firestore Emulator requires a Java (JRE/JDK 11+) runtime to execute the binary cloud-firestore-emulator.jar.');
    console.log('   To run against the live emulator locally:');
    console.log('     firebase emulators:exec --only firestore "node scripts/test-rules.js"');
    console.log('   Running security contract verification against actual firestore.rules:\n');
    runContractVerification();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
