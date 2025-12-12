# 🚀 UI Quick Start Guide

## What's Been Created

A complete, modern, responsive web application with:
- ✅ OAuth2 JWT Authentication (Login/Register)
- ✅ Dashboard with statistics
- ✅ Full CRUD for Products, Orders, Documents, Comments
- ✅ Responsive design (768px breakpoint)
- ✅ Hamburger mobile menu
- ✅ Modal forms for data entry
- ✅ Animations and transitions
- ✅ Google Fonts (Inter & Poppins)
- ✅ Font Awesome icons
- ✅ Toast notifications

## Files Created

```
wwwroot/
├── index.html              ✅ Main dashboard
├── login.html              ✅ Login page
├── register.html           ✅ Registration page
├── css/
│   ├── styles.css          ✅ Main styles (responsive, animations)
│   └── auth.css            ✅ Auth pages styles
└── js/
    ├── api.js              ✅ API integration
    ├── auth.js             ✅ Auth helpers
    ├── app.js              ✅ Main app logic & CRUD
    ├── login.js            ✅ Login functionality
    └── register.js         ✅ Registration functionality
```

## 🎨 Design Features

### Responsive Layout
- **Desktop (>768px)**: Horizontal menu, multi-column grids
- **Mobile (≤768px)**: Hamburger menu, single column, touch-friendly

### Color Scheme
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Success**: Green (#43e97b)
- **Danger**: Red (#f5576c)
- **Warning**: Yellow (#feca57)
- **Info**: Blue (#4facfe)

### Typography
- **Headings**: Poppins (600, 700)
- **Body**: Inter (300-700)
- From Google Fonts

### Animations
- Page transitions (fadeIn, slideDown)
- Button hover effects (translateY, shadow)
- Card hover animations
- Modal slide-up
- Toast notifications
- Loading spinners
- Hamburger → X transformation

## 🔧 How to Test Locally

### 1. Start the Application

```powershell
cd c:\Users\Dell\Desktop\unikas\7_pusm\Saitynai\skaiciuokle\projektas
dotnet run
```

### 2. Open Browser

Navigate to: `https://localhost:5001/register.html` (or the port shown)

### 3. Create Account

1. Fill in:
   - Username: `admin`
   - Email: `admin@test.com`
   - Password: `Admin123!`
   - Confirm Password: `Admin123!`
   - Check "I agree to Terms"
2. Click "Create Account"
3. You'll be redirected to the dashboard

### 4. Explore Features

**Dashboard**
- View statistics cards
- See total counts

**Products**
- Click "Products" in menu
- Click "+ Add Product" button
- Fill form:
  - Name: `Test Fence`
  - Description: `A test product`
  - Price: `99.99`
  - Quantity: `10`
  - Type: `Fence (0)`
- Click "Create Product"
- See it appear in table
- Try View/Edit/Delete buttons

**Orders**
- Click "Orders"
- Click "+ Create Order"
- Fill form and submit
- Test CRUD operations

**Documents**
- Click "Documents"
- Click "+ Add Document"
- Link to an order
- Test CRUD operations

**Comments**
- Click "Comments"
- Click "+ Add Comment"
- Choose Order or Document comment
- Test CRUD operations

### 5. Test Responsive Design

**Desktop → Mobile**
1. Open browser DevTools (F12)
2. Click responsive design mode
3. Resize to 768px and below
4. Watch menu change to hamburger
5. Test mobile menu toggle
6. Check all pages are responsive

## 📱 Mobile Menu Test

1. Resize browser to < 768px
2. Click hamburger icon (☰)
3. Menu slides down with animation
4. Hamburger transforms to X
5. Click menu items - menu closes
6. Click X - menu closes

## 🎭 Modal Forms Test

1. Click any "+ Add" button
2. Modal slides up from bottom
3. Backdrop has blur effect
4. Fill form fields
5. Check validation (leave fields empty)
6. Submit valid data
7. Click X or outside to close

## 🎨 Animation Checklist

Test these animations:
- [ ] Header slides down on page load
- [ ] Stat cards lift on hover
- [ ] Navigation links highlight smoothly
- [ ] Buttons show ripple effect
- [ ] Modal slides up
- [ ] Toast slides in from right
- [ ] Mobile menu slides down
- [ ] Hamburger transforms to X
- [ ] Logo icon pulses
- [ ] Dropdown menu fades in

## 🔐 Authentication Flow

### Register
1. Go to `/register.html`
2. Fill all fields
3. Password must be 6+ chars
4. Passwords must match
5. Submit → Token saved → Redirect to dashboard

### Login
1. Go to `/login.html`
2. Enter email & password
3. Toggle password visibility (eye icon)
4. Submit → Token saved → Redirect to dashboard

### Logout
1. Click user menu (top right)
2. Click "Logout"
3. Token cleared → Redirect to login

### Auto-Redirect
- If logged in → Try to access login → Redirect to dashboard
- If not logged in → Try dashboard → Redirect to login

## 🎯 Testing All Features

### ✅ Responsive Layout
- [ ] Breakpoint at 768px works
- [ ] Desktop: horizontal menu
- [ ] Mobile: hamburger menu
- [ ] All pages adapt to screen size
- [ ] Images don't overflow

### ✅ Header/Content/Footer
- [ ] Header: Gradient, white text, sticky
- [ ] Content: Light bg, cards, tables
- [ ] Footer: Dark, 3 columns, social links
- [ ] All have distinct styles

### ✅ Input Elements
- [ ] Text inputs
- [ ] Email inputs
- [ ] Password inputs with toggle
- [ ] Number inputs
- [ ] Textareas
- [ ] Select dropdowns
- [ ] Checkboxes
- [ ] All validated properly

### ✅ Icons
- [ ] Font Awesome loads
- [ ] Icons in navigation
- [ ] Icons in buttons
- [ ] Icons in footer
- [ ] Icons in forms

### ✅ Fonts
- [ ] Google Fonts load
- [ ] Poppins for headings
- [ ] Inter for body

### ✅ Colors
- [ ] Consistent color scheme
- [ ] Good contrast
- [ ] Gradients on primary actions

### ✅ Grid Layout
- [ ] Stats grid (4→1 columns)
- [ ] Footer grid (3→1 columns)
- [ ] Form grids (2→1 columns)
- [ ] Everything aligned

## 🚀 Deployment

To deploy to Azure (where your API is):

```powershell
# 1. Build project
cd projektas
dotnet publish -c Release -o ./publish

# 2. Deploy to Azure (your existing app)
# The wwwroot files will be included automatically
```

Then access:
- Login: `https://skaiciuokle.azurewebsites.net/login.html`
- Register: `https://skaiciuokle.azurewebsites.net/register.html`
- Dashboard: `https://skaiciuokle.azurewebsites.net/index.html`

## 🐛 Troubleshooting

### Issue: White screen
**Solution**: Check browser console for errors, ensure API is running

### Issue: Can't login
**Solution**: 
- Check API is running on same origin
- Check console for CORS errors
- Verify JWT settings are configured

### Issue: Mobile menu not working
**Solution**: 
- Clear browser cache
- Check JavaScript console
- Ensure viewport meta tag is present

### Issue: Styles not loading
**Solution**:
- Hard refresh (Ctrl+F5)
- Check CSS files are served correctly
- Check browser console for 404s

### Issue: Can't create data
**Solution**:
- Check you're logged in
- Check token in localStorage
- Check API endpoints are accessible
- Check browser console for errors

## 📚 API Endpoints Used

The UI connects to these endpoints:

**Auth**
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

**Products**
- GET `/api/products` (public)
- GET `/api/products/{id}`
- POST `/api/products` (manager+)
- PUT `/api/products/{id}` (manager+)
- DELETE `/api/products/{id}` (admin)

**Orders**
- GET `/api/orders`
- GET `/api/orders/{id}`
- POST `/api/orders`
- PUT `/api/orders/{id}`
- DELETE `/api/orders/{id}` (manager+)

**Documents**
- GET `/api/documents`
- GET `/api/documents/{id}`
- POST `/api/documents`
- PUT `/api/documents/{id}`
- DELETE `/api/documents/{id}` (manager+)

**Comments**
- GET `/api/comments`
- GET `/api/comments/{id}`
- POST `/api/comments`
- PUT `/api/comments/{id}`
- DELETE `/api/comments/{id}` (manager+)

## 🎓 Key Learnings

This UI demonstrates:
1. Modern responsive design patterns
2. CSS Grid and Flexbox layouts
3. Mobile-first development
4. JWT authentication flow
5. RESTful API integration
6. Form validation and UX
7. Animation and transition best practices
8. Accessibility considerations
9. Component-based thinking
10. Clean, maintainable code

## 🎉 You're Done!

Your complete UI is ready to use. It includes:
- ✅ All required features
- ✅ Responsive design
- ✅ Beautiful animations
- ✅ Full CRUD operations
- ✅ Professional design
- ✅ Production-ready code

Start the app and explore! 🚀
