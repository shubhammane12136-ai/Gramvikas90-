import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSarpanchCredentials,
  validateVillagerCredentials,
  createNewComplaint,
  updateComplaintStatusAndFeedback,
  filterComplaintsForView,
  calculateComplaintStats,
  ComplaintItem,
  UserSession,
} from './complaintLogic';

test('validateSarpanchCredentials rejects invalid emails and passwords', () => {
  const result1 = validateSarpanchCredentials('other@gmail.com', '816111');
  assert.equal(result1.success, false);
  assert.match(result1.message, /Only the authorized Sarpanch/);

  const result2 = validateSarpanchCredentials('piyushyadav3077@gmail.com', 'wrongpass');
  assert.equal(result2.success, false);
  assert.match(result2.message, /Only the authorized Sarpanch/);

  const resultEmpty = validateSarpanchCredentials('', '');
  assert.equal(resultEmpty.success, false);
});

test('validateSarpanchCredentials accepts authorized email and password', () => {
  const result = validateSarpanchCredentials('piyushyadav3077@gmail.com', '816111');
  assert.equal(result.success, true);
  assert.equal(result.session?.role, 'sarpanch');
  assert.equal(result.session?.email, 'piyushyadav3077@gmail.com');
  assert.match(result.session?.name || '', /Sarpanch/);
});

test('validateVillagerCredentials validates against registered user database', () => {
  const users = [
    {
      name: 'Ramesh Patil',
      email: 'ramesh.patil@gmail.com',
      password: 'password123',
      village: 'Adarsh Gram',
    },
  ];

  const ok = validateVillagerCredentials('ramesh.patil@gmail.com', 'password123', users);
  assert.equal(ok.success, true);
  assert.equal(ok.session?.role, 'user');
  assert.equal(ok.session?.name, 'Ramesh Patil');

  const wrongPass = validateVillagerCredentials('ramesh.patil@gmail.com', 'wrong', users);
  assert.equal(wrongPass.success, false);
  assert.match(wrongPass.message, /Incorrect password/);

  const unknown = validateVillagerCredentials('unknown@gmail.com', '123456', users);
  assert.equal(unknown.success, false);
  assert.match(unknown.message, /No villager account found/);

  const sarpanchInVillagerForm = validateVillagerCredentials(
    'piyushyadav3077@gmail.com',
    '816111',
    users
  );
  assert.equal(sarpanchInVillagerForm.success, false);
  assert.match(sarpanchInVillagerForm.message, /Sarpanch Login/);
});

test('createNewComplaint creates pending complaint with unique tracking ID', () => {
  const session: UserSession = {
    role: 'user',
    name: 'Suresh Patil',
    email: 'suresh@gmail.com',
    phone: '9876543210',
  };

  const complaint = createNewComplaint(
    {
      title: 'Water tap leaking near school',
      description: 'Clean drinking water is being wasted near the village primary school.',
      category: 'Water',
      location: 'Ward 2, near Primary School',
      priority: 'Urgent',
    },
    session
  );

  assert.equal(complaint.status, 'Pending');
  assert.equal(complaint.name, 'Suresh Patil');
  assert.equal(complaint.ownerEmail, 'suresh@gmail.com');
  assert.match(complaint.trackingId, /^GV-CMP-\d{4}-[A-Z0-9]+$/);
});

test('updateComplaintStatusAndFeedback records feedback and transitions status (Pending -> Approved -> Cancelled)', () => {
  const session: UserSession = {
    role: 'user',
    name: 'Sunita Rao',
    email: 'sunita@gmail.com',
  };

  const initial = createNewComplaint(
    {
      title: 'Street light broken',
      description: 'Pole #14 has burned out fixture',
      category: 'Electricity',
      location: 'East Ward',
    },
    session
  );

  assert.equal(initial.status, 'Pending');

  // Sarpanch approves the complaint
  const approved = updateComplaintStatusAndFeedback(
    initial,
    'Approved',
    'Electrical contractor assigned. New LED fixture will be installed by tomorrow morning.',
    'Piyush Yadav (Sarpanch)'
  );

  assert.equal(approved.status, 'Approved');
  assert.equal(
    approved.sarpanchFeedback,
    'Electrical contractor assigned. New LED fixture will be installed by tomorrow morning.'
  );
  assert.equal(approved.sarpanchFeedbackBy, 'Piyush Yadav (Sarpanch)');
  assert.ok(approved.sarpanchFeedbackDate);

  // Or Sarpanch cancels with explanation
  const cancelled = updateComplaintStatusAndFeedback(
    initial,
    'Cancelled',
    'This pole is private property outside Panchayat jurisdiction. Advised to consult property owner.',
    'Piyush Yadav (Sarpanch)'
  );

  assert.equal(cancelled.status, 'Cancelled');
  assert.match(cancelled.sarpanchFeedback || '', /outside Panchayat jurisdiction/);
});

test('filterComplaintsForView limits villager view to own complaints and allows tracking ID lookup', () => {
  const c1: ComplaintItem = {
    id: '1',
    trackingId: 'GV-CMP-2026-AAA1',
    name: 'Ramesh',
    ownerEmail: 'ramesh@gmail.com',
    title: 'Pothole on main road',
    description: 'Road damage',
    category: 'Road',
    location: 'Main Road',
    status: 'Pending',
    createdAt: '2026-08-01T10:00:00Z',
  };

  const c2: ComplaintItem = {
    id: '2',
    trackingId: 'GV-CMP-2026-BBB2',
    name: 'Sita',
    ownerEmail: 'sita@gmail.com',
    title: 'Drainage overflow',
    description: 'Needs cleaning',
    category: 'Sanitation',
    location: 'Ward 4',
    status: 'Approved',
    createdAt: '2026-08-02T10:00:00Z',
  };

  const all = [c1, c2];

  // Villager Ramesh only sees c1
  const rameshSession: UserSession = { role: 'user', name: 'Ramesh', email: 'ramesh@gmail.com' };
  const rameshView = filterComplaintsForView(all, rameshSession);
  assert.equal(rameshView.length, 1);
  assert.equal(rameshView[0].id, '1');

  // Sarpanch sees both
  const sarpanchSession: UserSession = {
    role: 'sarpanch',
    name: 'Piyush Yadav',
    email: 'piyushyadav3077@gmail.com',
  };
  const sarpanchView = filterComplaintsForView(all, sarpanchSession);
  assert.equal(sarpanchView.length, 2);

  // Filter by status Approved
  const approvedOnly = filterComplaintsForView(all, sarpanchSession, { statusFilter: 'Approved' });
  assert.equal(approvedOnly.length, 1);
  assert.equal(approvedOnly[0].id, '2');

  // Exact Tracking ID lookup
  const tracked = filterComplaintsForView(all, rameshSession, { trackingId: 'GV-CMP-2026-BBB2' });
  assert.equal(tracked.length, 1);
  assert.equal(tracked[0].trackingId, 'GV-CMP-2026-BBB2');
});

test('calculateComplaintStats correctly counts total, pending, approved and cancelled', () => {
  const items: ComplaintItem[] = [
    {
      id: '1',
      trackingId: 'T1',
      name: 'A',
      ownerEmail: 'a@g.com',
      title: 'T1',
      description: 'D',
      category: 'C',
      location: 'L',
      status: 'Pending',
      createdAt: '',
    },
    {
      id: '2',
      trackingId: 'T2',
      name: 'B',
      ownerEmail: 'b@g.com',
      title: 'T2',
      description: 'D',
      category: 'C',
      location: 'L',
      status: 'Approved',
      createdAt: '',
    },
    {
      id: '3',
      trackingId: 'T3',
      name: 'C',
      ownerEmail: 'c@g.com',
      title: 'T3',
      description: 'D',
      category: 'C',
      location: 'L',
      status: 'Approved',
      createdAt: '',
    },
    {
      id: '4',
      trackingId: 'T4',
      name: 'D',
      ownerEmail: 'd@g.com',
      title: 'T4',
      description: 'D',
      category: 'C',
      location: 'L',
      status: 'Cancelled',
      createdAt: '',
    },
  ];

  const stats = calculateComplaintStats(items);
  assert.equal(stats.total, 4);
  assert.equal(stats.pending, 1);
  assert.equal(stats.approved, 2);
  assert.equal(stats.cancelled, 1);
});
