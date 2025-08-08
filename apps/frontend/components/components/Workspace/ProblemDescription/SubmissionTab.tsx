export const SubmissionRow = ({ submission, expanded, toggle }: any) => (
    <>
      <tr
        key={submission.id}
        className='border-b border-gray-700/50 cursor-pointer hover:bg-dark-layer-1/80 transition-all duration-200 group'
        onClick={() => toggle(expanded === submission.id ? null : submission.id)}
      >
        <td className='px-6 py-4'>
          <div className='flex items-center'>
            <svg
              className={`w-4 h-4 mr-3 transform transition-transform duration-300 text-gray-400 group-hover:text-gray-300 cursor-pointer ${
                expanded ? 'rotate-90' : 'rotate-0'
              }`}
              fill='currentColor'
              viewBox='0 0 20 20'
              onClick={(e) => {
                e.stopPropagation();
                if (expanded) {
                  toggle(null);
                } else {
                  toggle(submission.id);
                }
              }}
            >
              <path fillRule='evenodd' d='M6 8l4 4 4-4' clipRule='evenodd' />
            </svg>
            <div className='flex flex-col'>
              <div className='flex items-center space-x-2'>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  submission.status === 'Accepted' || submission.status === 'AC'
                    ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                    : submission.status === 'Compile Error' || submission.status === 'CE'
                    ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                    : submission.status === 'Time Limit Exceeded' || submission.status === 'TLE'
                    ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                    : submission.status === 'Runtime Error' || submission.status === 'RE'
                    ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                    : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {(submission.status === 'Accepted' || submission.status === 'AC') && (
                    <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  )}
                  {(submission.status === 'Compile Error' || submission.status === 'CE') && (
                    <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                    </svg>
                  )}
                  {(submission.status === 'Time Limit Exceeded' || submission.status === 'TLE') && (
                    <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
                    </svg>
                  )}
                  {submission.status === 'AC' ? 'Accepted' : 
                   submission.status === 'WA' ? 'Wrong Answer' :
                   submission.status === 'TLE' ? 'Time Limit Exceeded' :
                   submission.status === 'CE' ? 'Compile Error' :
                   submission.status === 'RE' ? 'Runtime Error' :
                   submission.status}
                </span>
              </div>
              <div className='text-xs text-gray-500 mt-1 flex items-center'>
                <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
                </svg>
                {submission.date}
              </div>
            </div>
          </div>
        </td>
        <td className='px-6 py-4'>
          <span className='inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600/50'>
            <svg className='w-3 h-3 mr-1.5' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z' clipRule='evenodd' />
            </svg>
            {submission.language}
          </span>
        </td>
        <td className='px-6 py-4'>
          <div className='flex items-center space-x-1'>
            <svg className='w-3 h-3 text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
            </svg>
            <span className='text-sm font-medium text-gray-300'>{submission.runtime}</span>
          </div>
        </td>
        <td className='px-6 py-4'>
          <div className='flex items-center space-x-1'>
            <svg className='w-3 h-3 text-purple-400' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clipRule='evenodd' />
            </svg>
            <span className='text-sm font-medium text-gray-300'>{submission.memory}</span>
          </div>
        </td>
        <td className='px-6 py-4'>
          {submission.hasNotes ? (
            <div className='flex items-center text-blue-400 cursor-pointer hover:text-blue-300 transition-colors duration-200'>
              <svg className='w-4 h-4 mr-1.5' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z' clipRule='evenodd' />
              </svg>
              <span className='text-sm font-medium'>Notes</span>
            </div>
          ) : (
            <span className='text-gray-500 text-sm'>-</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className='bg-dark-layer-1/50 border-t border-gray-700/50'>
          <td colSpan={5} className='px-6 py-6'>
            <div className='bg-dark-layer-2 border border-gray-700/50 rounded-xl p-6 shadow-lg'>
              <div className='flex justify-between items-center mb-4'>
                <div className='flex items-center space-x-2'>
                  <svg className='w-5 h-5 text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z' clipRule='evenodd' />
                  </svg>
                  <span className='text-white text-sm font-semibold'>Submitted Code</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggle(null); }} 
                  className='text-gray-400 hover:text-white hover:bg-gray-700/50 p-1.5 rounded-lg transition-all duration-200'
                >
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd' />
                  </svg>
                </button>
              </div>
              <div className='bg-dark-layer-1 border border-gray-700/50 rounded-lg overflow-hidden'>
                <div className='bg-gray-800/50 px-4 py-2 border-b border-gray-700/50 flex items-center justify-between'>
                  <span className='text-gray-300 text-xs font-medium'>{submission.language}</span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span className='text-gray-400 text-xs'>Code Editor</span>
                  </div>
                </div>
                <pre className='text-gray-300 text-sm p-4 overflow-x-auto leading-relaxed'>
                  <code className='font-mono'>{submission.code}</code>
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
  
  export const SubmissionsTable = ({ submissions, expandedSubmission, setExpandedSubmission }: any) => (
    <div className='bg-dark-layer-2 rounded-xl overflow-hidden border border-gray-700/50 shadow-lg'>
      <div className='bg-dark-layer-1 px-6 py-4 border-b border-gray-700/50'>
        <div className='flex items-center justify-between'>
          <h3 className='text-white font-semibold text-sm'>History</h3>
          <div className='flex items-center space-x-2 text-xs text-gray-400'>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
            </svg>
            <span>{submissions.length} submissions</span>
          </div>
        </div>
      </div>
      <table className='w-full text-sm text-left'>
        <thead className='text-xs text-gray-400 uppercase bg-dark-layer-1/80 border-b border-gray-700/50'>
          <tr>
            <th className='px-6 py-4 font-medium'>Status & Date</th>
            <th className='px-6 py-4 font-medium'>Language</th>
            <th className='px-6 py-4 font-medium'>Runtime</th>
            <th className='px-6 py-4 font-medium'>Memory</th>
            <th className='px-6 py-4 font-medium'>Notes</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-700/30'>
          {submissions.map((submission: any) => (
            <SubmissionRow
              key={submission.id}
              submission={submission}
              expanded={expandedSubmission === submission.id}
              toggle={setExpandedSubmission}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
  