'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { useLayout } from '../../context/LayoutContext';

export default function Home({ userName }) { // Accept userName as prop
  const { openCreateCourseModal, openJoinCourseModal } = useLayout();
  const router = useRouter();
  const [user, setUser] = useState({ name: 'User' });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false); // Add isMounted state
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Ask'); // Track selected mode
  const [promptText, setPromptText] = useState(''); // Track textarea content

  useEffect(() => {
    setIsMounted(true); // Set to true on client mount
  }, []);

  useEffect(() => {
    if (isMounted) { // Only run on client side
      if (userName) {
        setUser({ name: userName });
      } else {
        setUser({ name: 'User' });
      }
      fetchUserCourses();
    }
  }, [userName, isMounted]); // Depend on userName and isMounted

  const fetchUserCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      // Map fetched courses to the expected format for display
      const formattedCourses = data.courses.map(course => ({
        id: course._id,
        title: course.subject,
        code: course.section,
        instructor: course.teacherName,
        progress: 0, // Assuming progress is not part of the fetched data yet
        color: course.coverColor,
        progressColor: course.coverColor, // Using coverColor for progressColor for now
      }));
      setCourses(formattedCourses);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch user courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedMode === 'Text to Docs' && promptText.trim()) {
      // Navigate to text-to-docs with the prompt as a URL parameter
      router.push(`/text-to-docs?prompt=${encodeURIComponent(promptText)}`);
    }
  };

  const recentActivities = [];

  if (loading) {
    return <div className="flex-1 min-h-screen p-8 text-center bg-gray-100">Loading courses...</div>;
  }

  if (error) {
    return <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">Error: {error}</div>;
  }

  return (
    <div className="flex-1 p-8 bg-gray-100">
      <div className="flex items-center justify-center mb-8">
        <div className="w-12 h-12 mr-4 bg-white rounded-full flex items-center justify-center shadow-md">
          <SparklesIcon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">Hello User!</h1>
      </div>

      <div className="p-4 bg-white shadow-lg rounded-xl">
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Ask or find anything from your workspace..."
          className="w-full p-2 text-base text-gray-700 placeholder-gray-500 bg-transparent border-none resize-none focus:outline-none"
          rows="3"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedMode('Ask')}
              className={`flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-md ${
                selectedMode === 'Ask' 
                  ? 'text-gray-700 bg-gray-200' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>Ask</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setSelectedMode('Research')}
              className={`px-3 py-1 text-sm font-semibold rounded-md ${
                selectedMode === 'Research' 
                  ? 'text-gray-700 bg-gray-200' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Research
            </button>
            <button 
              onClick={() => setSelectedMode('Text to Docs')}
              className={`px-3 py-1 text-sm font-semibold rounded-md ${
                selectedMode === 'Text to Docs' 
                  ? 'text-white bg-blue-600' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Text to Docs
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 rounded-full hover:bg-gray-200">
              <WebIcon className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-1 p-2 text-gray-500 rounded-full hover:bg-gray-200">
              <DocumentTextIcon className="w-5 h-5" />
              <span>All sources</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-500 rounded-full hover:bg-gray-200">
              <PaperClipIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSubmit}
              className="p-2 text-white bg-gray-800 rounded-full hover:bg-gray-900"
            >
              <ArrowUpIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
     <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-3">
       <div className="lg:col-span-2">
         <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-semibold text-gray-800">My Course</h2>
           <div className="relative">
             <button
               onClick={() => setIsCourseMenuOpen(!isCourseMenuOpen)}
               className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300"
             >
               <PlusIcon className="w-5 h-5 text-gray-700" />
             </button>
             {isCourseMenuOpen && (
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                 <button
                   onClick={() => {
                     openCreateCourseModal();
                     setIsCourseMenuOpen(false);
                   }}
                   className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                 >
                   Create Course
                 </button>
                 <button
                   onClick={() => {
                     openJoinCourseModal();
                     setIsCourseMenuOpen(false);
                   }}
                   className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                 >
                   Join Course
                 </button>
               </div>
             )}
           </div>
         </div>

         <div className="flex items-center gap-4 mb-6">
           <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
           </svg>
           <span className="font-medium text-gray-600">Cluster1</span>
         </div>

         <div className="relative">
           {courses.length === 0 ? (
             <EmptyState type="courses" />
           ) : (
             <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
               {courses.map((course) => (
                 <Link key={course.id} href={`/courses?slug=${course.title.toLowerCase().replace(/\s+/g, '-')}`} className="block">
                   <div className="flex flex-col overflow-hidden bg-white shadow-md rounded-2xl cursor-pointer">
                     <div className={`h-40 relative p-6 flex flex-col justify-between ${course.color}`}>
                       <div className="flex items-start justify-between">
                         <div></div>
                         <button className="text-white opacity-70 hover:opacity-100">
                           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                           </svg>
                         </button>
                       </div>
                       <div className={`absolute bottom-4 right-4 w-12 h-12 ${course.progressColor} rounded-full`}></div>
                     </div>

                     <div className="flex flex-col flex-grow p-6">
                       <h3 className="mb-2 text-lg font-bold text-gray-800">{course.title}</h3>
                       <p className="mb-2 text-sm text-gray-500">{course.code}</p>
                       <p className="mb-4 text-sm text-gray-500">{course.instructor}</p>
                       
                       <div className="flex items-center gap-2 mt-auto">
                         <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                         </svg>
                         <span className="text-lg font-bold text-orange-500">{course.progress}</span>
                       </div>
                     </div>
                   </div>
                 </Link>
               ))}
             </div>
           )}

           {courses.length > 0 && (
             <>
               <button className="absolute left-0 flex items-center justify-center w-10 h-10 transition-colors -translate-x-6 -translate-y-1/2 bg-white rounded-full shadow-lg top-1/2 hover:bg-gray-100">
                 <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
               </button>
               <button className="absolute right-0 flex items-center justify-center w-10 h-10 transition-colors translate-x-6 -translate-y-1/2 bg-white rounded-full shadow-lg top-1/2 hover:bg-gray-100">
                 <ChevronRightIcon className="w-5 h-5 text-gray-700" />
               </button>
             </>
           )}
         </div>

         {courses.length > 0 && (
           <div className="flex justify-end mt-6">
             <button className="font-medium text-gray-600 transition-colors hover:text-gray-900">See All</button>
           </div>
         )}
       </div>

       <div>
         <div className="p-6 bg-white shadow-md rounded-2xl">
           <h3 className="mb-6 text-lg font-semibold text-gray-800">Recent</h3>
           <div className="space-y-4">
             {recentActivities.length === 0 ? (
               <EmptyState type="recent" />
             ) : (
               recentActivities.map((activity) => (
                 <div key={activity.id} className="h-20 bg-gray-200 rounded-lg"></div>
               ))
             )}
           </div>
         </div>
       </div>
     </div>
    </div>
  );
}

const SparklesIcon = (props) => (
<svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" {...props}>
<mask id="mask0_171_151" style={{maskType:'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="42" height="42">
<circle cx="21" cy="21" r="21" fill="white"/>
</mask>
<g mask="url(#mask0_171_151)">
<circle cx="21" cy="21" r="21" fill="white"/>
<rect x="5.88" y="3.15564" width="26.7393" height="38.8443" fill="url(#pattern0_171_151)"/>
</g>
<defs>
<pattern id="pattern0_171_151" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlinkHref="#image0_171_151" transform="scale(0.00675676 0.00465116)"/>
</pattern>
<image id="image0_171_151" width="148" height="215" preserveAspectRatio="none" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAADXCAYAAAD88HgWAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAORSURBVHhe7dyxixxlAIfh71QIWuQaQwo9WwuRgxAMaG0pIvYKsUhhJRLQylpLFSwES4n/R4goIhwxoI3gjohiglzE4oq49nPVee8luZ3ngW1+s+XLfDA77NZ6vV4PiDwyH+A4BEVKUKQERUpQpARFSlCkBEVKUKQERUpQpARFSlCkBEVKUKQERUpQpARFSlCkBEVKUKQERUpQpARFSlCkBEVKUKQERUpQpARFSlCkBEVKUKQERUpQpARFSlCktpb6L8A3b/0z9u/+O58fmOefe3xsn31sPp86iw1q99LeWE0H8/mB2ft2dzzz9Jn5fOo48kgJipSgSAmKlKBICYqUoEgJipSgSAmKlKBICYqUoEgJipSgSAmK1GJfsHv/g1/G/v69+Xxk03Qwrn/993w+sk15wW6xQVW+/Or2ePudn+fzkW1KUI48UoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUosN6sLFq+Pc+cvj3PnL80scw2KD4mQIipSgjml7+9Gxs3Pm2J9Nsdg3Ni9cvDqm6c4YY4w///hifpn/yR2KlKBICYqUoEgJipSgSAmKlKBICYqUoEgJipTf8sYYL7347PzyfffJx2+NnZ0n5/OpI6iHxPfffbQRQTnySC32DjVNt+fTfffGm5+OH26txtigO9Rig3oYvPrah+PGjZ/G2KCgHHmkBEVKUKQERUpQpARFarGPDV55/cex+vVgPmf2vtmdT4ds4mODxQa1e2lvrKaTC+qv316YT4dsYlCOPFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIiUoUoIiJShSgiIlKFKCIrW1Xq/X83EJPvv897F/9958zrz37lPz6ZBr166P1XRnjDHGlSsvj+2zT8y/cuosNihOhiOPlKBICYqUoEgJipSgSAmKlKBICYqUoEgJipSgSAmKlKBICYqUoEgJipSgSAmKlKBICYqUoEgJipSgSAmKlKBICYqUoEgJipSgSAmKlKBICYqUoEgJipSgSAmKlKBICYrUfzBLotLFhVAoAAAAAElFTkSuQmCC"/>
</defs>
</svg>
);

const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const WebIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const DocumentTextIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const PaperClipIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 0119.5 7.372l-8.45 8.45a1.875 1.875 0 11-2.652-2.652L16.5 6" />
  </svg>
);

const ArrowUpIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
  </svg>
);