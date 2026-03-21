# 🌅 Daily Routine Tracker

Welcome to **Daily Routine**, a stunning, modern React web application designed for tracking personal habits and daily routines. Featuring a beautiful **Tailwind CSS** UI with seamless **Dark/Light Mode** integration, this app offers a fully mocked backend functionality entirely localized in the browser.

Perfect for demonstrating responsive frontend design, client-side security policies, and application state management.

## ✨ Key Features

- **🌗 Dual Theme:** A flawless Light and Dark mode toggle mechanism that remembers user preferences.
- **🛡️ Custom Admin Panel:** Includes a dedicated `/admin` dashboard to monitor total registered users, track platform-wide task completion stats, and ban/unban users.
- **🔐 Enhanced Security Simulation:** While using `localStorage` for the database, passwords are mathematically hashed using the **Web Crypto API (SHA-256)** instead of plaintext. Additionally incorporates a 24-hour persistent session expiration and strict account-blocking logic.
- **✨ Premium UI/UX:** Crafted with Tailwind CSS utilizing sleek glassmorphism effects (`backdrop-blur`), vibrant accent gradients, and smooth transition animations.
- **🚀 Fully Responsive:** Carefully optimized with Mobile-first principles so it looks perfect on phones, tablets, and desktop displays.

---

## 🛠️ Technology Stack

- **Framework:** React 18 + Vite
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Data Persistence:** Browser LocalStorage

---

## 💻 Getting Started (Local Setup)

To get a local copy up and running, follow these steps:

### Prerequisites

Make sure you have Node.js installed. ([Download Node.js](https://nodejs.org/))

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/daily-routine-app.git
   ```

2. **Navigate into the directory:**

   ```bash
   cd daily-routine
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Open `http://localhost:5173` to view the application in action.

---

## 👔 Admin Panel Access

You can explore the admin portal by registering or logging in with the predefined admin credentials:

- **Email**: `admin@admin.com`
- **Password**: _(Any password you set during initial signup as this email)_
  > _Upon logging in, an "Admin" shield icon will appear in the navigation bar._

---

## 🚀 Deployment Guide (Vercel / Netlify)

Because this project uses **Vite**, deploying it to a free platform like Vercel or Netlify takes less than 2 minutes!

### Deploying to Vercel (Recommended)

1. Go to [Vercel](https://vercel.com/) and Link your GitHub account.
2. Click **Add New** > **Project** and select this repository from your list.
3. Vercel will automatically detect `Vite` settings.
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click **Deploy**. Within a minute, your website will be live!

### Deploying to Netlify

1. Log in to [Netlify](https://www.netlify.com/).
2. Click **Add new site** > **Import an existing project** directly from GitHub.
3. Select this repository.
4. Set the Build Command to `npm run build` and the Publish Directory to `dist`.
5. Click **Deploy Site**.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](../../issues).

## 📄 License

This open-source project is available under the [MIT License](LICENSE).
