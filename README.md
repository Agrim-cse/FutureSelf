Here is the properly formatted, ready-to-copy `README.md`. I have included your live public link right at the top so the judges can't miss it, along with the exact problem statement context from the hackathon document.

```markdown
# FinQuest (FutureSelf) 🚀

**Live Web App:** [https://finquest-2abd6.web.app](https://finquest-2abd6.web.app)  
**Demo Video:** [https://drive.google.com/file/d/1SJeTDqafrm4QlhBeiov-UcZ9LpMdQnZq/view?usp=drivesdk]

A gamified financial self-improvement platform designed to cure "Retirement Blindness" among Gen Z by bridging the gap between financial awareness and immediate action. [cite_start]Built for the Vashisht Hackathon 3.0[cite: 1].

## [cite_start]🎯 The Problem: Retirement Blindness Among Gen Z [cite: 10, 11]
[cite_start]Gen Z often suffers from retirement blindness[cite: 11]. [cite_start]Students struggle to plan for retirement due to its distant and abstract nature, leading them to prioritize immediate financial needs and lifestyle goals instead[cite: 12]. [cite_start]Limited financial literacy further contributes to this issue, making it difficult for young people to understand the importance of early investing[cite: 13]. [cite_start]This highlights a critical need for solutions that make financial planning engaging, relatable, and accessible[cite: 16].

## 💡 Our Solution
FinQuest combines personal development with game mechanics to motivate users to achieve their long-term financial objectives:

- **The "Vibe Check" Onboarding:** A psychological profiling system that generates a realistic, personalized starting database based on user habits.
- **Dual Dashboards:** Tailored UI experiences for 'Campus' (non-earning students forecasting debt) and 'Pro' (salaried users optimizing asset allocation).
- **"What-If" Time Machine:** A dynamic, interactive chart that visualizes how cutting small daily "Wants" exponentially alters net worth by retirement age.
- **Gamified Quests & Leaderboard:** Earn XP, unlock lifetime achievements, and compete globally by logging positive financial actions.
- **Daily Insights:** Live API integrations for real-time market data and tailored financial news.

## 🛠 Tech Stack
- **Frontend:** React 19, React Router v7, CSS3
- **Backend & Auth:** Firebase 12 (Authentication, Firestore NoSQL)
- **Visualizations:** Chart.js 4, React-ChartJS-2
- **Hosting:** Firebase Hosting

## ⚙️ Local Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FutureSelf
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the application**
   ```bash
   npm start
   ```
   *The app will launch at `http://localhost:3000`.*

## 🚀 Deployment
This project is fully deployed via Firebase Hosting. To deploy future updates:
```bash
npm run build
firebase deploy
```
```
