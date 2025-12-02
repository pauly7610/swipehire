import Welcome from './pages/Welcome';
import Onboarding from './pages/Onboarding';
import SwipeJobs from './pages/SwipeJobs';
import CandidateProfile from './pages/CandidateProfile';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import EmployerDashboard from './pages/EmployerDashboard';
import PostJob from './pages/PostJob';
import ManageJobs from './pages/ManageJobs';
import SwipeCandidates from './pages/SwipeCandidates';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Welcome": Welcome,
    "Onboarding": Onboarding,
    "SwipeJobs": SwipeJobs,
    "CandidateProfile": CandidateProfile,
    "Matches": Matches,
    "Chat": Chat,
    "EmployerDashboard": EmployerDashboard,
    "PostJob": PostJob,
    "ManageJobs": ManageJobs,
    "SwipeCandidates": SwipeCandidates,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};