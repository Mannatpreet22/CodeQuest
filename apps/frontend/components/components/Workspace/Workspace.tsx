'use client';

import { useState } from "react";
import Split from "react-split";
import ProblemDescription from "./ProblemDescription/ProblemDescription";
import Playground from "./Playground/Playground";
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

	return (
		<Split className='split' minSize={0} sizes={[40, 60]} gutterSize={4}>
			<ProblemDescription problem={problem} _solved={solved} />
			<div className='bg-dark-fill-2'>
				<Playground problem={problem} pid={pid} setSuccess={setSuccess} setSolved={setSolved} />
				{success && <Confetti gravity={0.3} tweenDuration={4000} width={width - 1} height={height - 1} />}
			</div>
		</Split>
	);
};
export default Workspace;
