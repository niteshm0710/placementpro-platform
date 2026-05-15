import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import DashboardLayout from "@/components/DashboardLayout";

import StudentDashboard from "@/pages/student/Dashboard";
import StudentResume from "@/pages/student/Resume";
import StudentSkillGap from "@/pages/student/SkillGap";
import StudentPrediction from "@/pages/student/Prediction";
import StudentInterview from "@/pages/student/Interview";
import StudentJobs from "@/pages/student/Jobs";
import StudentApplications from "@/pages/student/Applications";
import StudentCourses from "@/pages/student/Courses";
import StudentNotifications from "@/pages/student/Notifications";
import StudentProfile from "@/pages/student/Profile";

import HodDashboard from "@/pages/hod/Dashboard";
import HodStudents from "@/pages/hod/Students";
import HodResumes from "@/pages/hod/Resumes";
import HodSkillGap from "@/pages/hod/SkillGap";
import HodReports from "@/pages/hod/Reports";

import TpoDashboard from "@/pages/tpo/Dashboard";
import TpoDrives from "@/pages/tpo/Drives";
import TpoApplications from "@/pages/tpo/Applications";
import TpoStudents from "@/pages/tpo/Students";
import TpoReports from "@/pages/tpo/Reports";
import TpoNotifications from "@/pages/tpo/Notifications";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/app" element={<RoleRedirect />} />

            <Route path="/student" element={<ProtectedRoute roles={["student"]}><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<StudentDashboard />} />
              <Route path="resume" element={<StudentResume />} />
              <Route path="skill-gap" element={<StudentSkillGap />} />
              <Route path="prediction" element={<StudentPrediction />} />
              <Route path="interview" element={<StudentInterview />} />
              <Route path="jobs" element={<StudentJobs />} />
              <Route path="applications" element={<StudentApplications />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            <Route path="/hod" element={<ProtectedRoute roles={["hod"]}><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<HodDashboard />} />
              <Route path="students" element={<HodStudents />} />
              <Route path="resumes" element={<HodResumes />} />
              <Route path="skill-gap" element={<HodSkillGap />} />
              <Route path="reports" element={<HodReports />} />
              <Route path="notifications" element={<StudentNotifications />} />
            </Route>

            <Route path="/tpo" element={<ProtectedRoute roles={["tpo"]}><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<TpoDashboard />} />
              <Route path="drives" element={<TpoDrives />} />
              <Route path="applications" element={<TpoApplications />} />
              <Route path="students" element={<TpoStudents />} />
              <Route path="reports" element={<TpoReports />} />
              <Route path="notifications" element={<TpoNotifications />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
