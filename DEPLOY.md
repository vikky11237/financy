# How to Deploy Your App (PostgreSQL Version)

You have migrated your app to use **PostgreSQL**, which allows you to deploy for **free** on platforms like **Render.com**.

## Prerequisites
1.  **GitHub Account**: You need to upload your code to a GitHub repository.
2.  **Postgres Database**: You need a free database connection string.

## Step 1: Get a Free Database (Neon.tech)
1.  Go to [Neon.tech](https://neon.tech) and Sign Up.
2.  Create a new project.
3.  Copy the **Connection String** (it looks like `postgres://user:password@...`).
    -   *Save this for later!*

## Step 2: Deploy to Render.com
1.  Go to [Render.com](https://render.com) and Sign Up.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings**:
    -   **Name**: `my-finance-app` (or whatever you like)
    -   **Runtime**: `Node`
    -   **Build Command**: `npm install`
    -   **Start Command**: `node server.js`
5.  **Environment Variables** (Crucial!):
    -   Scroll down to "Environment Variables".
    -   Add Variable:
        -   **Key**: `DATABASE_URL`
        -   **Value**: Paste your Neon Connection String starting with `postgres://...`
6.  Click **Create Web Service**.

## Step 3: Done!
Render will deploy your app. Visit the URL provided by Render (e.g., `https://my-finance-app.onrender.com`).
Your data will be safe and persistent in the Neon database.
