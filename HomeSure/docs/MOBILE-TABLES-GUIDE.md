# 📱 MOBILE TABLE LAYOUT GUIDE

## ❌ PROBLEM:
Tables with many columns get **cramped and unreadable** on mobile screens.

## ✅ SOLUTION:
Tables automatically convert to **card layout** on mobile (768px and below).

---

## 🔧 HOW TO USE:

### **Step 1: Add `data-label` to all `<td>` elements**

```html
<table class="data-table">
  <thead>
    <tr>
      <th>Admin</th>
      <th>Email</th>
      <th>Status</th>
      <th>Date Added</th>
      <th>Added By</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Admin">
        <div class="user-cell">
          <img src="avatar.jpg" />
          <span>Andrea Villanueva</span>
        </div>
      </td>
      <td data-label="Email">admin@homesure.com</td>
      <td data-label="Status">
        <span class="status-badge active">Active</span>
      </td>
      <td data-label="Date Added">2025-08-15</td>
      <td data-label="Added By">Ricardo Dela Cruz</td>
    </tr>
  </tbody>
</table>
```

**IMPORTANT:** Every `<td>` MUST have `data-label="Column Name"`

---

## 📱 WHAT HAPPENS ON MOBILE:

### **Desktop (768px+):**
```
┌─────────────────────────────────────────────────────┐
│ Admin         │ Email            │ Status  │ Date  │
├─────────────────────────────────────────────────────┤
│ Andrea V.     │ admin@...        │ Active  │ 08-15 │
│ Jose Reyes    │ jose@...         │ Active  │ 07-22 │
└─────────────────────────────────────────────────────┘
```

### **Mobile (< 768px):**
```
┌───────────────────────────────────┐
│ ADMIN:        Andrea Villanueva   │
│ EMAIL:        admin@homesure.com  │
│ STATUS:       Active ✓            │
│ DATE ADDED:   2025-08-15          │
│ ADDED BY:     Ricardo Dela Cruz   │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│ ADMIN:        Jose Reyes          │
│ EMAIL:        jose@homesure.com   │
│ STATUS:       Active ✓            │
│ DATE ADDED:   2025-07-22          │
│ ADDED BY:     Andrea Villanueva   │
└───────────────────────────────────┘
```

---

## 🎨 FEATURES:

✅ **Automatic conversion** - No JavaScript needed  
✅ **Card-based layout** - Each row becomes a card  
✅ **Labels from data-label** - Column names show on left  
✅ **Better readability** - Vertical stacking  
✅ **Touch-friendly** - Large tap targets  
✅ **Scrollable** - No horizontal overflow  

---

## 📋 EXAMPLES:

### **Admin Management Table:**
```html
<table class="data-table">
  <thead>
    <tr>
      <th>Admin</th>
      <th>Email</th>
      <th>Status</th>
      <th>Date Added</th>
      <th>Added By</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Admin">Andrea Villanueva</td>
      <td data-label="Email">admin@homesure.com</td>
      <td data-label="Status">
        <span class="badge badge-success">Active</span>
      </td>
      <td data-label="Date Added">2025-08-15</td>
      <td data-label="Added By">Ricardo Dela Cruz</td>
    </tr>
  </tbody>
</table>
```

### **Activity Log Table:**
```html
<table class="data-table">
  <thead>
    <tr>
      <th>Timestamp</th>
      <th>User</th>
      <th>Role</th>
      <th>Action</th>
      <th>IP Address</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Timestamp">2026-04-06 09:14</td>
      <td data-label="User">
        <div class="user-cell">
          <img class="avatar" src="avatar.jpg" />
          <span>Andrea Villanueva</span>
        </div>
      </td>
      <td data-label="Role">
        <span class="badge badge-admin">Admin</span>
      </td>
      <td data-label="Action">Approved listing</td>
      <td data-label="IP Address">192.168.1.1</td>
    </tr>
  </tbody>
</table>
```

### **Payments Table:**
```html
<table class="data-table">
  <thead>
    <tr>
      <th>Property</th>
      <th>Buyer</th>
      <th>Amount</th>
      <th>Status</th>
      <th>Date</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Property">1-Bedroom Apartment</td>
      <td data-label="Buyer">Maria Santos</td>
      <td data-label="Amount">₱15,000</td>
      <td data-label="Status">
        <span class="badge badge-success">Completed</span>
      </td>
      <td data-label="Date">2026-05-28</td>
      <td data-label="Actions">
        <div class="action-btns">
          <button class="btn-sm btn-primary">View</button>
          <button class="btn-sm btn-outline">Receipt</button>
        </div>
      </td>
    </tr>
  </tbody>
</table>
```

---

## 🚫 COMMON MISTAKES:

### ❌ **Missing data-label:**
```html
<td>admin@homesure.com</td>  <!-- NO LABEL! -->
```

### ✅ **Correct:**
```html
<td data-label="Email">admin@homesure.com</td>
```

### ❌ **Inconsistent labels:**
```html
<td data-label="Email">admin@...</td>
<td data-label="E-mail">jose@...</td>  <!-- Different! -->
```

### ✅ **Correct:**
```html
<td data-label="Email">admin@...</td>
<td data-label="Email">jose@...</td>  <!-- Same! -->
```

---

## 🎯 WHEN TO USE:

✅ **Admin tables** - User management, logs, reports  
✅ **Transaction tables** - Payments, orders, history  
✅ **Listing tables** - Properties, products, items  
✅ **Activity logs** - Audit trails, notifications  
✅ **Any table with 4+ columns** - Gets cramped on mobile  

❌ **Don't use for:**
- Simple 2-column tables (can stay as table)
- Forms (use proper form layout)
- Navigation (use menus)

---

## 📏 RESPONSIVE BREAKPOINTS:

- **Desktop (1200px+):** Full table with all columns
- **Tablet (768px-1199px):** Horizontal scroll table
- **Mobile (< 768px):** Card layout (automatic!)

---

## 🔧 FILES TO UPDATE:

### **1. Add data-label to existing tables:**

Find all tables in:
- `module/admin/*.html`
- `module/super-admin/*.html`
- Any page with `<table class="data-table">`

Add `data-label="Column Name"` to every `<td>`

### **2. Test on mobile:**

```
1. Open any admin page with tables
2. Resize browser to < 768px
3. Tables should become cards!
4. Check that all labels show correctly
```

---

## ✅ CHECKLIST:

```
□ All tables have class="data-table"
□ All <td> elements have data-label attribute
□ Labels match column headers exactly
□ Tested on mobile (< 768px)
□ Action buttons work in card layout
□ Status badges display correctly
□ User avatars + names show properly
□ No horizontal scrolling on mobile
```

---

## 🚀 READY FOR JUNE 4!

Mobile table layout is now automatic with proper HTML structure! 📱✅
