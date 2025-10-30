import React from "react";
import { createBrowserRouter, useParams } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Hero from "@/features/home/Home";
import BrowseProjects from "@/features/browseProjects/BrowseProjects";
import PostProject from "@/features/postProject/PostProject";
import Profile from "@/features/profile/Profile";
import ReviewCenter from "@/features/reviewCenter/ReviewCenter";
import NotFound from "@/pages/NotFound";
import Auth from "./features/auth/Auth";
import ContactUs from "./features/staticPages/ContactUs";
import LearnMore from "./features/staticPages/LearnMore";
import TermsOfService from "./features/staticPages/TermsOfService";
import PrivacyPolicy from "./features/staticPages/PrivacyPolicy";
import RefundPolicy from "./features/staticPages/RefundPolicy";
import HelpCenter from "@/features/helpCenter/HelpCenter";

// Wrapper component to force Profile re-render when URL params change
const ProfileWrapper = () => {
  const { id } = useParams();
  return <Profile key={id} />;
};
import Dashboard from "./features/dashboard/Dashboard";
import UserManagement from "./pages/UserManagement";
import ProjectDetailView from "./features/browseProjects/components/ProjectDetailView";
import AdminPanel from "./features/admin/AdminDashbord";
import EmployeePanel from "./features/employee/EmployeeDashboard";
import PaymentPage from "./pages/PaymentPage";
import ProjectDepositPaymentPage from "./pages/ProjectDepositPaymentPage";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import { ProtectedEmployeeRoute } from "@/components/ProtectedEmployeeRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Hero />,
      },
      {
        path: "*", // catch-all for invalid routes
        element: <NotFound />,
      },
      {
        path: "post-project",
        element: <PostProject />,
      },
      {
        path: "profile/:id",
        element: <ProfileWrapper />,
      },
      {
        path: "auth",
        element: <Auth />,
      },
      {
        path: "review-center",
        element: <ReviewCenter />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "user-management",
        element: <UserManagement />,
      },
      {
        path: "project/:projectId",
        element: <ProjectDetailView />,
      },
      {
        path: "contact",
        element: <ContactUs />,
      },
      {
        path: "learn-more",
        element: <LearnMore />,
      },
      {
        path: "terms",
        element: <TermsOfService />,
      },
      {
        path: "privacy",
        element: <PrivacyPolicy />,
      },
      {
        path: "refund-policy",
        element: <RefundPolicy />,
      },
      {
        path: "help-center",
        element: <HelpCenter />,
      },
      {
        path: "payment/:submissionId",
        element: <PaymentPage />,
      },
      {
        path: "payment/project/:projectId",
        element: <ProjectDepositPaymentPage />,
      },
    ],
  },
  {
    path: "/admin/*",
    element: (
      <ProtectedAdminRoute>
        <AdminPanel />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/employee/*",
    element: (
      <ProtectedEmployeeRoute>
        <EmployeePanel />
      </ProtectedEmployeeRoute>
    ),
  },
]);
