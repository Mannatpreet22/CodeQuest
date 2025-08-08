import React from "react";
import { BsChevronUp, BsChevronDown } from "react-icons/bs";

type EditorFooterProps = {
	handleRun: () => void;
	handleSubmit: () => void;
	isConsoleOpen: boolean;
	toggleConsole: () => void;
	isRunning?: boolean;
	isSubmitting?: boolean;
	rightPanelWidth: number;
};

const EditorFooter: React.FC<EditorFooterProps> = ({ handleRun, handleSubmit, isConsoleOpen, toggleConsole, isRunning = false, isSubmitting = false, rightPanelWidth }) => {
	return (
		<div 
			className='flex bg-dark-layer-1 fixed bottom-0 right-0 z-50 border-t border-gray-700 shadow-lg'
			style={{ width: `${rightPanelWidth}%` }}
		>
			<div className='mx-5 my-[10px] flex justify-between w-full'>
				<div className='mr-2 flex flex-1 flex-nowrap items-center space-x-4'>
					<button 
						className='px-3 py-1.5 font-medium items-center transition-all inline-flex bg-dark-fill-3 text-sm hover:bg-dark-fill-2 text-dark-label-2 rounded-lg pl-3 pr-2'
						onClick={toggleConsole}
					>
						TestCases
						<div className='ml-1 transform transition flex items-center'>
							{isConsoleOpen ? (
								<BsChevronDown className='fill-gray-6 mx-1 fill-dark-gray-6' />
							) : (
								<BsChevronUp className='fill-gray-6 mx-1 fill-dark-gray-6' />
							)}
						</div>
					</button>
				</div>
				<div className='ml-auto flex items-center space-x-4'>
					<button
						className={`px-3 py-1.5 text-sm font-medium items-center whitespace-nowrap transition-all focus:outline-none inline-flex rounded-lg ${
							isRunning 
								? 'bg-dark-fill-2 text-dark-label-2 cursor-not-allowed' 
								: 'bg-dark-fill-3 hover:bg-dark-fill-2 text-dark-label-2'
						}`}
						onClick={handleRun}
						disabled={isRunning || isSubmitting}
					>
						{isRunning ? 'Running...' : 'Run'}
					</button>
					<button
						className={`px-3 py-1.5 font-medium items-center transition-all focus:outline-none inline-flex text-sm rounded-lg ${
							isSubmitting 
								? 'bg-green-3 text-white cursor-not-allowed' 
								: 'text-white bg-dark-green-s hover:bg-green-3'
						}`}
						onClick={handleSubmit}
						disabled={isRunning || isSubmitting}
					>
						{isSubmitting ? 'Submitting...' : 'Submit'}
					</button>
				</div>
			</div>
		</div>
	);
};
export default EditorFooter;
