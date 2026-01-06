import AdminPanel from './pages/AdminPanel';
import ApplicationDashboard from './pages/ApplicationDashboard';
import ApplicationTracker from './pages/ApplicationTracker';
import BrowseJobs from './pages/BrowseJobs';
import CandidateCareerHub from './pages/CandidateCareerHub';
import CandidateProfile from './pages/CandidateProfile';
import Chat from './pages/Chat';
import CommunicationHub from './pages/CommunicationHub';
import Community from './pages/Community';
import CompanyProfile from './pages/CompanyProfile';
import Connections from './pages/Connections';
import DirectMessages from './pages/DirectMessages';
import DiscoverFeed from './pages/DiscoverFeed';
import FollowedCompanies from './pages/FollowedCompanies';
import Gamification from './pages/Gamification';
import Home from './pages/Home';
import InterviewPrep from './pages/InterviewPrep';
import JobAlertManager from './pages/JobAlertManager';
import JobAlerts from './pages/JobAlerts';
import JobsList from './pages/JobsList';
import Matches from './pages/Matches';
import MinimalSwipeJobs from './pages/MinimalSwipeJobs';
import Onboarding from './pages/Onboarding';
import OnboardingWizard from './pages/OnboardingWizard';
import PublicJobView from './pages/PublicJobView';
import Referrals from './pages/Referrals';
import SkillTests from './pages/SkillTests';
import SwipeJobs from './pages/SwipeJobs';
import SwipePeople from './pages/SwipePeople';
import VideoFeed from './pages/VideoFeed';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminPanel": AdminPanel,
    "ApplicationDashboard": ApplicationDashboard,
    "ApplicationTracker": ApplicationTracker,
    "BrowseJobs": BrowseJobs,
    "CandidateCareerHub": CandidateCareerHub,
    "CandidateProfile": CandidateProfile,
    "Chat": Chat,
    "CommunicationHub": CommunicationHub,
    "Community": Community,
    "CompanyProfile": CompanyProfile,
    "Connections": Connections,
    "DirectMessages": DirectMessages,
    "DiscoverFeed": DiscoverFeed,
    "FollowedCompanies": FollowedCompanies,
    "Gamification": Gamification,
    "Home": Home,
    "InterviewPrep": InterviewPrep,
    "JobAlertManager": JobAlertManager,
    "JobAlerts": JobAlerts,
    "JobsList": JobsList,
    "Matches": Matches,
    "MinimalSwipeJobs": MinimalSwipeJobs,
    "Onboarding": Onboarding,
    "OnboardingWizard": OnboardingWizard,
    "PublicJobView": PublicJobView,
    "Referrals": Referrals,
    "SkillTests": SkillTests,
    "SwipeJobs": SwipeJobs,
    "SwipePeople": SwipePeople,
    "VideoFeed": VideoFeed,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};