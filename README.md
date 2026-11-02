# Plate2Plate – From Surplus to Someone

**Plate2Plate** is a food redistribution platform designed to reduce food waste by connecting food donors with NGOs, volunteers, and communities in need.

The platform allows restaurants, bakeries, hostels, and other food providers to list their surplus food, making it easier for eligible recipients to discover, request, and collect available donations.

## About the Project

Food wastage is a major problem, while many communities continue to face food insecurity. Plate2Plate aims to bridge this gap by providing a simple digital platform for redistributing surplus food to people who need it.

The project focuses on making food donation and collection more accessible, organised, and efficient.

## Key Features

- **Food Donation:** Donors can list surplus food available for donation.
- **Food Listings:** View available food donations with relevant details.
- **Donation Requests:** Recipients can request available food.
- **Pickup Management:** Manage donation confirmation and collection.
- **User Authentication:** Provides user access and authentication functionality.
- **Dashboard:** View and manage relevant donation activities.
- **Admin Management:** Administrative functionality for managing platform activities.
- **Food Categories:** Organise food donations into different categories.
- **Location-Based Discovery:** Helps recipients discover nearby food donations.
- **Donation History:** Track donation activities and their status.

## Technology Stack

**Frontend**
- React.js
- JavaScript
- HTML5
- CSS3

**Backend**
- Node.js
- Express.js

**Database**
- Database integration through the backend.

**Development Tools**
- Visual Studio Code
- Git
- GitHub
- Vite

## Project Structure

```text
Plate2Plate/
│
├── public/
│   └── images/
│
├── server/
│   ├── admin-routes.js
│   ├── db.js
│   └── server.js
│
├── src/
│   ├── Admin.jsx
│   ├── App.jsx
│   ├── Auth.jsx
│   ├── Dashboard.jsx
│   ├── Donate.jsx
│   ├── Food.jsx
│   ├── Home.jsx
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the project directory

```bash
cd Plate2Plate
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the appropriate location and configure the required database credentials and environment variables.

Do not upload your `.env` file or expose sensitive credentials.

### 5. Run the application

Start the frontend using the appropriate development script defined in `package.json`.

Start the backend using the server script and configuration defined in the project.

## Project Objective

The primary objective of Plate2Plate is to encourage responsible food distribution, minimise food wastage, and make surplus food more accessible to communities in need through technology.

## Future Enhancements

- Improved location-based food discovery.
- Automated expiry notifications.
- Enhanced donation analytics.
- Better coordination between donors, NGOs, and volunteers.
- Additional platform accessibility features.

---

**Plate2Plate – From Surplus to Someone.**

*Reducing food waste. Redistributing hope. Creating impact.*
