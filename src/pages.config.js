import Welcome from './pages/Welcome';
import Onboarding from './pages/Onboarding';
import SwipeJobs from './pages/SwipeJobs';
import CandidateProfile from './pages/CandidateProfile';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Welcome": Welcome,
    "Onboarding": Onboarding,
    "SwipeJobs": SwipeJobs,
    "CandidateProfile": CandidateProfile,
    "Matches": Matches,
    "Chat": Chat,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};