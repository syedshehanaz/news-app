# Buzz News - Live Intelligence Feed

A full-stack Next.js application that provides a real-time, AI-curated news feed with a premium dark-mode aesthetic. 
Users can view dynamic trending keywords, read latest news, bookmark articles locally using an SQLite database, and ask an AI assistant questions about the headlines.

## Features

- **Live Headlines**: Fetches live news using the GNews API.
- **Dynamic Keywords**: Automatically extracts trending topics from current headlines.
- **AI Chat Assistant**: Integrated chatbot that can answer questions based on the live news context using any OpenAI-compatible API.
- **Local Bookmarking**: Save your favorite articles locally via Prisma and SQLite.
- **Premium UI/UX**: Sleek, dark-themed responsive design with glassmorphism and subtle animations.

## Prerequisites

- Node.js (v18 or higher recommended)
- A GNews API key (optional but recommended for live data)
- An OpenAI-compatible API key for the Chatbot

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd buzz_News
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your API keys in the `.env` file.

4. **Initialize the Database**
   This project uses Prisma with a local SQLite database. Run the following command to create the database schema:
   ```bash
   npx prisma db push
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Database ORM**: Prisma
- **Database**: SQLite
- **Styling**: Vanilla CSS (Global & CSS Modules)
