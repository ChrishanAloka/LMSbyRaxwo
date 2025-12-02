# 📝 Editable Components Guide

This LMS Client UI is designed with **fully editable components**. Here's how to customize everything:

## 🎨 **How to Edit Components**

### **1. Edit Course Data**
Location: `src/pages/client/CoursesPage.jsx`

Find the `allCourses` array (around line 20-90). Each course object has:

```javascript
{
  id: 1,                    // Unique ID
  title: "Course Title",    // ✅ EDIT THIS
  description: "Description", // ✅ EDIT THIS
  price: 60,                // ✅ EDIT THIS
  image: "url",             // ✅ EDIT THIS - Use image URL
  age: "3-5 Years",         // ✅ EDIT THIS
  time: "8-10 PM",          // ✅ EDIT THIS
  capacity: "30 Kids",      // ✅ EDIT THIS
  featured: false           // ✅ EDIT THIS - true = green button
}
```

**To add a new course:** Copy a course object and paste it to the array.

**To remove a course:** Delete the course object from the array.

### **2. Edit Header Content**
Location: `src/components/Header.jsx`

- **Logo Text (line 11):** Change "Hikmah" to your brand name
- **Navigation Links (lines 15-19):** Edit the text or links
- **Button Text (line 29):** Change "Create an account" to your desired text

### **3. Edit Filter Categories**
Location: `src/pages/client/CoursesPage.jsx`

Find the `categories` array (around line 9-16):

```javascript
const categories = [
  'All Courses',
  'Learning Arabic',    // ✅ EDIT THESE
  'Islamic Science',     // ✅ ADD/REMOVE CATEGORIES
  // ... add more categories
];
```

### **4. Edit Hero Section Text**
Location: `src/pages/client/CoursesPage.jsx`

- **Title (line 85):** Change "Our Courses"
- **Description (lines 86-88):** Change the subtitle text

### **5. Edit Colors (Green Theme)**
All components use green (`#22c55e`). To change the color:

**Find and replace in these files:**
- `src/components/Header.css`
- `src/components/CourseCard.css`
- `src/components/FilterButtons.css`

Search for: `#22c55e` and replace with your color (hex code)

## 🚀 **Run the Application**

```bash
npm start
```

The app will open at `http://localhost:5173`

## 📁 **Component Structure**

```
src/
├── components/
│   ├── Header.jsx           # Top navigation bar
│   ├── Header.css
│   ├── CourseCard.jsx       # Individual course card
│   ├── CourseCard.css
│   ├── FilterButtons.jsx    # Category filter buttons
│   └── FilterButtons.css
└── pages/
    └── client/
        ├── CoursesPage.jsx  # Main courses page
        └── CoursesPage.css
```

## ✨ **Features**

- ✅ Fully responsive design
- ✅ Hover effects on cards
- ✅ Filter buttons with active state
- ✅ Shopping cart icon with count
- ✅ Featured courses (green button)
- ✅ Clean, modern UI matching your design
- ✅ **NO unnecessary decorative elements**














