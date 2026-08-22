import fs from 'fs';
import path from 'path';
import * as store from './store';

// Define DB paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Interfaces
export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
}

export interface ExpenseClaim {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_department: string;
  tour_title: string;
  destination: string;
  start_date: string;
  end_date: string;
  purpose: string;
  claimed_total: number;
  approved_total: number;
  status: 'pending' | 'approved' | 'partially_approved' | 'rejected';
  hr_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  payroll_added: boolean;
  payroll_month?: string;
  payroll_year?: string;
  payroll_entry_id?: string;
}

export interface ExpenseCategory {
  id: string;
  expense_claim_id: string;
  category_name: string;
  employee_category_total: number;
  hr_category_total: number;
  review_status: 'pending' | 'reviewed';
  reviewed_at?: string;
}

export interface ExpenseBill {
  id: string;
  expense_claim_id: string;
  expense_category_id: string;
  bill_file: string; // Filename on disk
  original_file_name: string;
  employee_amount: number;
  hr_approved_amount: number | null; // NULL represents not reviewed, 0 is explicit zero
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'submit' | 'review' | 'payroll';
  target_role: 'employee' | 'hr';
  employee_id?: string; // For employee target
  claim_id?: string;
  created_at: string;
  read: boolean;
}

// Resolve live store employees dynamically
export const getDBEmployees = (): Employee[] => {
  return store.employees.map(emp => {
    const dept = store.departments.find(d => d.id === emp.departmentId);
    const desig = store.designations.find(d => d.id === emp.designationId);
    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      role: desig ? desig.name : 'Employee',
      department: dept ? dept.name : 'Engineering',
      email: emp.email,
      avatar: emp.profilePhoto || 'https://i.pravatar.cc/150?u=' + emp.id
    };
  });
};

// Helper to write to JSON db
const saveDatabase = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

// Helper to read from JSON db
export const loadDatabase = () => {
  const currentEmployees = getDBEmployees();
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      employees: currentEmployees,
      claims: [],
      categories: [],
      bills: [],
      notifications: []
    };
    saveDatabase(initialDb);
    return initialDb;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    
    // Ensure all keys exist
    data.employees = currentEmployees;
    if (!data.claims) data.claims = [];
    if (!data.categories) data.categories = [];
    if (!data.bills) data.bills = [];
    if (!data.notifications) data.notifications = [];
    
    return data;
  } catch (error) {
    console.error("DB Load error, recreating initial database:", error);
    const initialDb = {
      employees: currentEmployees,
      claims: [],
      categories: [],
      bills: [],
      notifications: []
    };
    saveDatabase(initialDb);
    return initialDb;
  }
};

// Base64 file saver
export const saveBase64File = (fileName: string, base64Data: string): string => {
  try {
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const fileBuffer = Buffer.from(cleanBase64, 'base64');
    const uniqueName = `${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);
    fs.writeFileSync(filePath, fileBuffer);
    return uniqueName;
  } catch (error) {
    console.error("Failed to save base64 file:", error);
    throw error;
  }
};

// Operations
export const db = {
  getClaims: (): ExpenseClaim[] => {
    return loadDatabase().claims;
  },

  getClaimsByEmployee: (empId: string): ExpenseClaim[] => {
    return loadDatabase().claims.filter((c: ExpenseClaim) => c.employee_id === empId);
  },

  getClaimById: (id: string): ExpenseClaim | undefined => {
    return loadDatabase().claims.find((c: ExpenseClaim) => c.id === id);
  },

  getCategoriesByClaim: (claimId: string): ExpenseCategory[] => {
    return loadDatabase().categories.filter((c: ExpenseCategory) => c.expense_claim_id === claimId);
  },

  getBillsByClaim: (claimId: string): ExpenseBill[] => {
    return loadDatabase().bills.filter((b: ExpenseBill) => b.expense_claim_id === claimId);
  },

  getNotifications: (): NotificationItem[] => {
    return loadDatabase().notifications;
  },

  saveClaim: (claim: ExpenseClaim) => {
    const database = loadDatabase();
    const index = database.claims.findIndex((c: ExpenseClaim) => c.id === claim.id);
    if (index >= 0) {
      database.claims[index] = claim;
    } else {
      database.claims.push(claim);
    }
    saveDatabase(database);
  },

  saveCategory: (cat: ExpenseCategory) => {
    const database = loadDatabase();
    const index = database.categories.findIndex((c: ExpenseCategory) => c.id === cat.id);
    if (index >= 0) {
      database.categories[index] = cat;
    } else {
      database.categories.push(cat);
    }
    saveDatabase(database);
  },

  saveBill: (bill: ExpenseBill) => {
    const database = loadDatabase();
    const index = database.bills.findIndex((b: ExpenseBill) => b.id === bill.id);
    if (index >= 0) {
      database.bills[index] = bill;
    } else {
      database.bills.push(bill);
    }
    saveDatabase(database);
  },

  addNotification: (noti: Omit<NotificationItem, 'id' | 'created_at' | 'read'>) => {
    const database = loadDatabase();
    const newNoti: NotificationItem = {
      ...noti,
      id: `NOTI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      read: false
    };
    database.notifications.unshift(newNoti);
    saveDatabase(database);
    return newNoti;
  },

  markNotificationsRead: (role: 'employee' | 'hr', empId?: string) => {
    const database = loadDatabase();
    database.notifications.forEach((n: NotificationItem) => {
      if (n.target_role === role) {
        if (role === 'employee' && empId && n.employee_id !== empId) return;
        n.read = true;
      }
    });
    saveDatabase(database);
  }
};
