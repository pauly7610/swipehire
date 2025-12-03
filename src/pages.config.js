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
import EmployerMatches from './pages/EmployerMatches';
import EmployerChat from './pages/EmployerChat';
import SwipePeople from './pages/SwipePeople';
import JobAlerts from './pages/JobAlerts';
import SkillTests from './pages/SkillTests';
import CompanyBranding from './pages/CompanyBranding';
import EmployerAnalytics from './pages/EmployerAnalytics';
import CandidateCareerHub from './pages/CandidateCareerHub';
import Community from './pages/Community';
import Connections from './pages/Connections';
import VideoFeed from './pages/VideoFeed';
import ApplicationTracker from './pages/ApplicationTracker';
import CompanyProfile from './pages/CompanyProfile';
import ViewCandidateProfile from './pages/ViewCandidateProfile';
import AdminPanel from './pages/AdminPanel';
import RecruiterProfile from './pages/RecruiterProfile';
import ATS from './pages/ATS';
import PublicJobView from './pages/PublicJobView';
import BrowseJobs from './pages/BrowseJobs';
import DiscoverFeed from './pages/DiscoverFeed';
import JobsList from './pages/JobsList';
import Gamification from './pages/Gamification';
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
    "EmployerMatches": EmployerMatches,
    "EmployerChat": EmployerChat,
    "SwipePeople": SwipePeople,
    "JobAlerts": JobAlerts,
    "SkillTests": SkillTests,
    "CompanyBranding": CompanyBranding,
    "EmployerAnalytics": EmployerAnalytics,
    "CandidateCareerHub": CandidateCareerHub,
    "Community": Community,
    "Connections": Connections,
    "VideoFeed": VideoFeed,
    "ApplicationTracker": ApplicationTracker,
    "CompanyProfile": CompanyProfile,
    "ViewCandidateProfile": ViewCandidateProfile,
    "AdminPanel": AdminPanel,
    "RecruiterProfile": RecruiterProfile,
    "ATS": ATS,
    "PublicJobView": PublicJobView,
    "BrowseJobs": BrowseJobs,
    "DiscoverFeed": DiscoverFeed,
    "JobsList": JobsList,
    "Gamification": Gamification,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};