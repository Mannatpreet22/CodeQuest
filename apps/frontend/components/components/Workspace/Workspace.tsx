'use client';

import { useState, useRef, useEffect } from "react";
import Split from "react-split";
import ProblemDescription from "./ProblemDescription/ProblemDescription";
import Playground from "./Playground/Playground";
import EditorFooter from "./Playground/EditorFooter";
import { Problem } from "@/utils/utils/types/problem";
import { SerializableProblem } from "@/utils/utils/types/serializable";
import Confetti from "react-confetti";
import useWindowSize from "@/hooks/hooks/useWindowSize";

type WorkspaceProps = {
	problem: SerializableProblem;
	pid: string;
};

const Workspace: React.FC<WorkspaceProps> = ({ problem, pid }) => {
	const { width, height } = useWindowSize();
	const [success, setSuccess] = useState(false);
	const [solved, setSolved] = useState(false);
	const [isConsoleOpen, setIsConsoleOpen] = useState(true);
	const [isRunning, setIsRunning] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [rightPanelWidth, setRightPanelWidth] = useState(60); // Default 60%
	const runHandlerRef = useRef<(() => void) | null>(null);
	const submitHandlerRef = useRef<(() => void) | null>(null);

	const toggleConsole = () => {
		setIsConsoleOpen(!isConsoleOpen);
	};

	const handleRun = () => {
		if (runHandlerRef.current) {
			runHandlerRef.current();
		}
	};

	const handleSubmit = () => {
		if (submitHandlerRef.current) {
			submitHandlerRef.current();
		}
	};

	const handleSplitChange = (sizes: number[]) => {
		setRightPanelWidth(sizes[1]); // Update right panel width
	};

	const handleSplitDrag = (sizes: number[]) => {
		setRightPanelWidth(sizes[1]); // Update right panel width in real-time
	};

	// Effect to handle confetti timer
	useEffect(() => {
		if (success) {
			const timer = setTimeout(() => {
				setSuccess(false);
			}, 5000); // 5 seconds

			return () => clearTimeout(timer)
		}
	}, [success]);

	return (
		<div className='relative h-screen'>
			<Split className='split' minSize={0} sizes={[40, 60]} gutterSize={4} onDrag={handleSplitDrag} onDragEnd={handleSplitChange}>
				<div className='overflow-hidden'>
					<ProblemDescription problem={problem} _solved={solved} />
				</div>
				<div className='bg-dark-fill-2 overflow-hidden'>
					<Playground 
						problem={problem} 
						pid={pid} 
						setSuccess={setSuccess} 
						setSolved={setSolved}
						isConsoleOpen={isConsoleOpen}
						setIsConsoleOpen={setIsConsoleOpen}
						isRunning={isRunning}
						setIsRunning={setIsRunning}
						isSubmitting={isSubmitting}
						setIsSubmitting={setIsSubmitting}
						runHandlerRef={runHandlerRef}
						submitHandlerRef={submitHandlerRef}
					/>
					{success && <Confetti gravity={0.3} tweenDuration={4000} width={width - 1} height={height - 1} />}
				</div>
			</Split>
			<EditorFooter 
				handleRun={handleRun} 
				handleSubmit={handleSubmit} 
				isConsoleOpen={isConsoleOpen} 
				toggleConsole={toggleConsole}
				isRunning={isRunning}
				isSubmitting={isSubmitting}
				rightPanelWidth={rightPanelWidth}
			/>
		</div>
	);
};
export default Workspace;
