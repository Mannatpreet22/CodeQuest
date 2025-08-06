// Component barrel exports for better import paths
export { default as Navbar } from './components/Navbar/Navbar';
export { default as ProblemsTable } from './components/ProblemsTable/ProblemsTable';
export { default as Workspace } from './components/Workspace/Workspace';
export { default as Timer } from './components/Timer/Timer';
export { default as SettingsModal } from './components/Modals/SettingsModal';
export { default as CircleSkeleton } from './components/Skeletons/CircleSkeleton';
export { default as RectangleSkeleton } from './components/Skeletons/RectangleSkeleton';
export { default as ToastProvider } from './ToastProvider';
export { default as ClientProviders } from './ClientProviders';
export { default as ProblemPageContent } from './ProblemPageContent';
export { default as HomePageContent } from './HomePageContent';

// Re-export workspace components
export { default as Playground } from './components/Workspace/Playground/Playground';
export { default as ProblemDescription } from './components/Workspace/ProblemDescription/ProblemDescription';