import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../components/layout/Layout";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";

import StoriesLevels from "../pages/stories/StoriesLevels";
import StoriesList from "../pages/stories/StoriesList";
import StoryDetail from "../pages/stories/StoryDetail";

import QuizLevels from "../pages/quiz/QuizLevels";
import QuizTopics from "../pages/quiz/QuizTopics";
import QuizPlay from "../pages/quiz/QuizPlay";

import WordsLevels from "../pages/words/WordsLevels";
import WordsTopics from "../pages/words/WordsTopics";
import WordsList from "../pages/words/WordsList";

function OwnerOnly({ children }) {
  const { user } = useAuth();
  return user?.role === "owner" ? children : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<OwnerOnly><Dashboard /></OwnerOnly>} />
          <Route path="profile" element={<Profile />} />

          <Route path="stories" element={<StoriesLevels />} />
          <Route path="stories/:level" element={<StoriesList />} />
          <Route path="stories/:level/:storyId" element={<StoryDetail />} />

          <Route path="quiz" element={<QuizLevels />} />
          <Route path="quiz/:level" element={<QuizTopics />} />
          <Route path="quiz/:level/:topicId" element={<QuizPlay />} />

          <Route path="words" element={<WordsLevels />} />
          <Route path="words/:level" element={<WordsTopics />} />
          <Route path="words/:level/:topicId" element={<WordsList />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
