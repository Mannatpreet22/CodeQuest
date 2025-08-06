'use client';

import { useState, useEffect } from "react";
import { AiOutlineFullscreen, AiOutlineFullscreenExit, AiOutlineSetting, AiOutlineDown } from "react-icons/ai";
import { ISettings } from "../Playground";
import SettingsModal from "@/components/components/Modals/SettingsModal";

type PreferenceNavProps = {
	settings: ISettings;
	setSettings: React.Dispatch<React.SetStateAction<ISettings>>;
};

const PreferenceNav: React.FC<PreferenceNavProps> = ({ setSettings, settings }) => {
	const [isFullScreen, setIsFullScreen] = useState(false);
	const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

	const handleFullScreen = () => {
		if (isFullScreen) {
			document.exitFullscreen();
		} else {
			document.documentElement.requestFullscreen();
		}
		setIsFullScreen(!isFullScreen);
	};

	const handleLanguageChange = (language: string) => {
		setSettings(prev => ({ ...prev, language }));
		setIsLanguageDropdownOpen(false);
	};

	useEffect(() => {
		function exitHandler(e: any) {
			if (!document.fullscreenElement) {
				setIsFullScreen(false);
				return;
			}
			setIsFullScreen(true);
		}

		if (document.addEventListener) {
			document.addEventListener("fullscreenchange", exitHandler);
			document.addEventListener("webkitfullscreenchange", exitHandler);
			document.addEventListener("mozfullscreenchange", exitHandler);
			document.addEventListener("MSFullscreenChange", exitHandler);
		}
	}, [isFullScreen]);

	const languages = [
		{ id: "javascript", name: "JavaScript" },
		{ id: "python", name: "Python" },
		{ id: "java", name: "Java" },
		{ id: "cpp", name: "C++" },
	];

	return (
		<div className='flex items-center justify-between bg-dark-layer-2 h-11 w-full '>
			<div className='flex items-center text-white'>
				<div className='relative'>
					<button 
						className='flex cursor-pointer items-center rounded focus:outline-none bg-dark-fill-3 text-dark-label-2 hover:bg-dark-fill-2 px-2 py-1.5 font-medium'
						onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
					>
						<div className='flex items-center px-1'>
							<div className='text-xs text-label-2 dark:text-dark-label-2'>
								{languages.find(lang => lang.id === settings.language)?.name || "JavaScript"}
							</div>
							<AiOutlineDown className='ml-1 text-xs' />
						</div>
					</button>
					
					{isLanguageDropdownOpen && (
						<div className='absolute top-full left-0 mt-1 bg-dark-layer-1 border border-dark-layer-2 rounded-md shadow-lg z-50 min-w-[120px]'>
							{languages.map((language) => (
								<button
									key={language.id}
									className={`w-full text-left px-3 py-2 text-sm hover:bg-dark-fill-2 ${
										settings.language === language.id ? 'bg-dark-fill-2 text-white' : 'text-gray-300'
									}`}
									onClick={() => handleLanguageChange(language.id)}
								>
									{language.name}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			<div className='flex items-center m-2'>
				<button
					className='preferenceBtn group'
					onClick={() => setSettings({ ...settings, settingsModalIsOpen: true })}
				>
					<div className='h-4 w-4 text-dark-gray-6 font-bold text-lg'>
						<AiOutlineSetting />
					</div>
					<div className='preferenceBtn-tooltip'>Settings</div>
				</button>

				<button className='preferenceBtn group' onClick={handleFullScreen}>
					<div className='h-4 w-4 text-dark-gray-6 font-bold text-lg'>
						{!isFullScreen ? <AiOutlineFullscreen /> : <AiOutlineFullscreenExit />}
					</div>
					<div className='preferenceBtn-tooltip'>Full Screen</div>
				</button>
			</div>
			{settings.settingsModalIsOpen && <SettingsModal settings={settings} setSettings={setSettings} />}
		</div>
	);
};
export default PreferenceNav;
