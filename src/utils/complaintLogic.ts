/**
 * Pure logic for GramVikas user authentication,
 * complaint lifecycle status transitions (Pending, Approved, Cancelled),
 * Sarpanch feedback, and role-based filtering.
 */

export interface UserSession {
  role: 'sarpanch' | 'user' | 'contractor';
  email: string;
  name: string;
  phone?: string;
  village?: string;
}

export type ComplaintStatus = 'Pending' | 'Approved' | 'Cancelled';

export interface ComplaintItem {
  id: string;
  trackingId: string;
  name: string;
  ownerEmail: string;
  phone?: string;
  category: string;
  title: string;
  description: string;
  location: string;
  priority?: 'Normal' | 'Urgent';
  gender?: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt?: string;
  sarpanchFeedback?: string;
  sarpanchFeedbackDate?: string;
  sarpanchFeedbackBy?: string;
  photo?: string | null;
}

export const AUTHORIZED_SARPANCH = {
  email: 'piyushyadav3077@gmail.com',
  password: '816111',
  name: 'Piyush Yadav (Sarpanch)',
  role: 'sarpanch' as const,
};

/**
 * Validates Sarpanch login. Only piyushyadav3077@gmail.com with password 816111 can log in as Sarpanch.
 */
export function validateSarpanchCredentials(email?: string, password?: string): {
  success: boolean;
  message: string;
  session?: UserSession;
} {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return {
      success: false,
      message: 'Both Sarpanch email and password are required.',
    };
  }

  if (
    cleanEmail === AUTHORIZED_SARPANCH.email.toLowerCase() &&
    cleanPassword === AUTHORIZED_SARPANCH.password
  ) {
    return {
      success: true,
      message: 'Sarpanch authenticated successfully.',
      session: {
        role: 'sarpanch',
        email: AUTHORIZED_SARPANCH.email,
        name: AUTHORIZED_SARPANCH.name,
      },
    };
  }

  return {
    success: false,
    message: 'Invalid credentials. Only the authorized Sarpanch (piyushyadav3077@gmail.com) can log in as Sarpanch.',
  };
}

/**
 * Validates Villager login against registered users in database / localStorage.
 */
export function validateVillagerCredentials(
  email: string,
  password: string,
  registeredUsers: Array<{ email?: string; gmail?: string; password: string; name: string; mobile?: string; village?: string }>
): {
  success: boolean;
  message: string;
  session?: UserSession;
} {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return {
      success: false,
      message: 'Please enter both your email address and password.',
    };
  }

  // Prevent Sarpanch from logging in via Villager form if wrong password or confuse credentials
  if (cleanEmail === AUTHORIZED_SARPANCH.email.toLowerCase()) {
    return {
      success: false,
      message: 'This email belongs to the village Sarpanch. Please use the Sarpanch Login tab.',
    };
  }

  const user = registeredUsers.find((u) => {
    const userEmail = (u.email || u.gmail || '').toLowerCase().trim();
    return userEmail === cleanEmail;
  });

  if (!user) {
    return {
      success: false,
      message: 'No villager account found with this email. Please register or check your email.',
    };
  }

  if (user.password !== cleanPassword) {
    return {
      success: false,
      message: 'Incorrect password. Please try again or reset your password.',
    };
  }

  return {
    success: true,
    message: `Welcome, ${user.name}!`,
    session: {
      role: 'user',
      email: cleanEmail,
      name: user.name,
      phone: user.mobile,
      village: user.village,
    },
  };
}

/**
 * Creates a complaint with default 'Pending' status and tracking ID.
 */
export function createNewComplaint(
  input: {
    title: string;
    description: string;
    category: string;
    location: string;
    priority?: 'Normal' | 'Urgent';
    photo?: string | null;
  },
  session: UserSession
): ComplaintItem {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const year = new Date().getFullYear();
  const trackingId = `GV-CMP-${year}-${randomSuffix}`;

  return {
    id: `cmp-${timestamp}-${randomSuffix}`,
    trackingId,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category || 'General',
    location: input.location.trim(),
    priority: input.priority || 'Normal',
    photo: input.photo || null,
    name: session.name || 'Villager',
    ownerEmail: (session.email || '').toLowerCase().trim(),
    phone: session.phone,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sarpanch reviews complaint: updates status (Pending, Approved, Cancelled)
 * and attaches official feedback remarks to the villager.
 */
export function updateComplaintStatusAndFeedback(
  complaint: ComplaintItem,
  newStatus: ComplaintStatus,
  feedbackText: string,
  sarpanchName = AUTHORIZED_SARPANCH.name
): ComplaintItem {
  const validStatuses: ComplaintStatus[] = ['Pending', 'Approved', 'Cancelled'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid complaint status: ${newStatus}`);
  }

  const now = new Date().toISOString();

  return {
    ...complaint,
    status: newStatus,
    sarpanchFeedback: feedbackText.trim(),
    sarpanchFeedbackDate: now,
    sarpanchFeedbackBy: sarpanchName,
    updatedAt: now,
  };
}

/**
 * Filters complaints based on user role and optional filter criteria.
 */
export function filterComplaintsForView(
  complaints: ComplaintItem[],
  session: UserSession | null,
  options?: {
    statusFilter?: string; // 'all' | 'Pending' | 'Approved' | 'Cancelled'
    searchQuery?: string;
    trackingId?: string;
  }
): ComplaintItem[] {
  let list = [...complaints];

  // Role visibility: Villagers see their own complaints, Sarpanch sees all
  if (session && session.role === 'user') {
    const userEmail = (session.email || '').toLowerCase().trim();
    list = list.filter((c) => (c.ownerEmail || '').toLowerCase().trim() === userEmail);
  }

  // Tracking ID exact search overrides general filters
  if (options?.trackingId) {
    const qTrack = options.trackingId.trim().toUpperCase();
    if (qTrack) {
      return complaints.filter(
        (c) => c.trackingId.toUpperCase() === qTrack || c.id.toUpperCase() === qTrack
      );
    }
  }

  // Filter by status (Pending, Approved, Cancelled)
  if (options?.statusFilter && options.statusFilter !== 'all') {
    list = list.filter((c) => c.status === options.statusFilter);
  }

  // Filter by search query (title, description, applicant name, category, location)
  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase().trim();
    list = list.filter((c) =>
      `${c.title} ${c.description} ${c.name} ${c.category} ${c.location} ${c.trackingId}`
        .toLowerCase()
        .includes(q)
    );
  }

  // Sort latest first
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Calculates complaint statistics.
 */
export function calculateComplaintStats(complaints: ComplaintItem[]) {
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'Pending').length;
  const approved = complaints.filter((c) => c.status === 'Approved').length;
  const cancelled = complaints.filter((c) => c.status === 'Cancelled').length;

  return {
    total,
    pending,
    approved,
    cancelled,
  };
}
