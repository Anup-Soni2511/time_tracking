import { useState, useEffect } from "react";
import { DatePicker } from 'rsuite';
import 'rsuite/DatePicker/styles/index.css';
import { addDays, subDays, format, addMinutes, startOfHour, parse } from 'date-fns';
import axios from 'axios';
import Lottie from 'lottie-react'; // Import Lottie
import animationData from '../../Animations/Animation - 1729060841093.json'
import animationLoader from '../../Animations/Animation - 1729077237017.json'



const Home = () => {
const HOST_URL = import.meta.env.VITE_HOST_URL
const [startDate, setStartDate] = useState(new Date());
const [pageData, setPageData] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedImageIndex, setSelectedImageIndex] = useState(null);
const [workedTime, setWorkedTime] = useState('');
const [averageActivity, setAverageActivity] = useState('');
const [hasError, setHasError] = useState(false);
const [loader, setLoader] = useState(true)

const convertToHMS = (timeString) => {
    const timeParts = timeString.match(/(\d+)\s*minutes?\s*(\d+\.\d+)?\s*seconds?/);
    
    if (timeParts) {
        const minutes = parseInt(timeParts[1], 10) || 0;
        const seconds = Math.floor(parseFloat(timeParts[2]) || 0);
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        // Format as hh:mm:ss
        const formattedTime = `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return formattedTime;
    }

    return '00:00:00'; // Default if parsing fails
};


const formatDate = (date) => {
    return date ? format(date, 'yyyy-MM-dd') : 'No Date Selected';
};
console.log(formatDate(startDate));

//   const pageData = [
//     { id: 0, time: "09:00 AM to 09:10 AM", percent: 39, duration: '10 Minute', mouse: '25%', keyboard: '40%' },
//     { id: 1, time: "10:00 AM to 10:10 AM", percent: 96, duration: '10 Minute', mouse: '25%', keyboard: '40%' },
//     { id: 3, time: "10:20 AM to 10:30 AM", percent: 67, duration: '10 Minute', mouse: '25%', keyboard: '40%' },
//     { id: 4, time: "10:30 AM to 10:40 AM", percent: 20, duration: '10 Minute', mouse: '25%', keyboard: '40%' },
//     { id: 5, time: "10:40 AM to 10:50 AM", percent: 56, duration: '10 Minute', mouse: '25%', keyboard: '40%' },
//     { id: 6, time: "10:50 AM to 11:00 AM", percent: 100, duration: '10 Minute', mouse: '25%', keyboard: '40%' },
//     { id: 7, time: "11:00 AM to 11:10 AM", percent: 39, duration: '10 Minute', mouse: '25%', keyboard: '40%' },
//     { id: 7, time: "02:00 PM to 02:10 PM", percent: 39, duration: '10 Minute', mouse: '25%', keyboard: '40%' }
//   ];

useEffect(() => {
    const fetchData = async () => {
    try {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzI5MjI4ODAyLCJpYXQiOjE3MjkwNTYwMDIsImp0aSI6IjQ3ZmMxMGQ3ZjI1ZTQzMTZhZWVmNmFjNmE5ZjM1YmU3IiwidXNlcl9pZCI6Mn0.fjaFPtNt4K6fQ_5_vsOAcC558BCNU6MmAg4TBMEZBUs'; // Replace with your actual token
        const formattedDate = formatDate(startDate);
        const response = await axios.get(HOST_URL+'/api/user/activity-details/', {
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: {
            date: formattedDate, // Pass the formatted date as a query parameter
        }
        });

        console.log('API Response Data:', response.data); // Debug the response data
        if (response.data && response.data.intervals) {
            setPageData(response.data.intervals);
            const formattedWorkedTime = convertToHMS(response.data.total_worked_time);
            setWorkedTime(formattedWorkedTime);  // Set worked time
            setAverageActivity(response.data.total_working_percentage);  // Set average activity
            setHasError(false);// Reset error state if successful
            setLoader(false)  
        } else {
            setHasError(true);  // No intervals, set error state
            setLoader(true) 
        }

    } catch (error) {
        setHasError(true);
        setLoader(true)
        console.error("Error fetching data:", error);
    }
    };

    fetchData();
}, [startDate]);

useEffect(() => {
    console.log('Updated pageData:', JSON.stringify(pageData)); // Nicely formatted JSON output
}, [pageData]);

useEffect(() => {
    console.log('Updated pageData:', pageData);
    window.pageData = pageData;  // Assign to window for global access
}, [pageData]);


// Find the earliest and latest time in pageData
const getEarliestAndLatestTimes = () => {
    let earliestTime = new Date();
    let latestTime = new Date(0);

    pageData.forEach(item => {
    const [start, end] = item.time.split(' - ');
    const startTime = parse(start, 'hh:mm a', new Date());
    const endTime = parse(end, 'hh:mm a', new Date());
    
    if (startTime < earliestTime) earliestTime = startTime;
    if (endTime > latestTime) latestTime = endTime;
    });

    return { earliestTime, latestTime };
};

const { earliestTime, latestTime } = getEarliestAndLatestTimes();

// Generate time sections based on the earliest and latest times
const generateDynamicTimeSections = () => {

    const sections = [];
    let current = startOfHour(earliestTime);
    const end = latestTime;

    while (current <= end) {
    const sectionEnd = addMinutes(current, 60); // Section length is 1 hour
    sections.push({
        sectionStart: current,
        sectionEnd: sectionEnd
    });
    current = sectionEnd;
    }
    return sections;
};

const timeSections = generateDynamicTimeSections();


const generateTimeSlots = (start, end, intervalMinutes = 10) => {
    const slots = [];
    let current = startOfHour(start);
    while (current < end) {
    const next = addMinutes(current, intervalMinutes);
    slots.push({
        startTime: format(current, 'hh:mm a'),
        endTime: format(next, 'hh:mm a'),
        time: `${format(current, 'hh:mm a')} - ${format(next, 'hh:mm a')}`
    });
    current = next;
    }
    return slots;
};

const getCardsForTimeSlot = (timeSlot) => {

    return pageData.filter(item => item.time === timeSlot.time);
};

const getColorClass = (percent) => {
    if (percent >= 0 && percent <= 25) return 'bg-danger';
    if (percent > 25 && percent <= 50) return 'bg-warning';
    if (percent > 50 && percent <= 100) return 'bg-success';
    return 'bg-gray-200'; // fallback color
};

const handleImageClick = (id) => {
    const index = pageData.findIndex(item => item.id === id);
    setSelectedImageIndex(index);
    setIsModalOpen(true);
};

const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
};

const filteredIndices = pageData.map((item, index) => item.percent > 0 ? index : null).filter(index => index !== null);

const handleNext = () => {
    if (selectedImageIndex !== null) {
    const currentIndex = filteredIndices.indexOf(selectedImageIndex);
    if (currentIndex < filteredIndices.length - 1) {
        setSelectedImageIndex(filteredIndices[currentIndex + 1]);
    }
    }
};

const handlePrevious = () => {
    if (selectedImageIndex !== null) {
    const currentIndex = filteredIndices.indexOf(selectedImageIndex);
    if (currentIndex > 0) {
        setSelectedImageIndex(filteredIndices[currentIndex - 1]);
    }
    }
};

const increaseDate = () => {
    setStartDate(prevDate => addDays(prevDate, 1));
};

const decreaseDate = () => {
    setStartDate(prevDate => subDays(prevDate, 1));
};

return (
    
        loader ? (
            <div className="flex flex-col items-center justify-center">
            <Lottie animationData={animationLoader} loop={true} />
        </div>
        ) : (
    <div>
    <section className="bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center px-4 py-8 mx-auto">
        <div className="w-full h-full bg-white rounded-lg shadow dark:border md:mt-0 xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 space-y-4 md:space-y-6 sm:p-4">
            <div className="text-3xl">Screenshots</div>
            <div className="flex items-center space-x-4">
                <button
                type="button"
                className="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={decreaseDate}
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
                    <g fill="none" stroke="#FFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4">
                    <path d="M5.79889 24H41.7989" />
                    <path d="M17.7988 36L5.79883 24L17.7988 12" />
                    </g>
                </svg>
                </button>
                <DatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="Select Date"
                className="px-2"
                style={{ width: 300 }}
                format="EEE, MMM dd, yyyy"
                />
                <button
                type="button"
                className="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={increaseDate}
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
                    <g fill="none" stroke="#FFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4">
                    <path d="M41.9999 24H5.99994" />
                    <path d="M30 12L42 24L30 36" />
                    </g>
                </svg>
                </button>
            </div>

            <div className="flex my-8 bg-white shadow-sm border border-slate-200 rounded-lg w-1/3 h-40 text-center">
                <div className="flex flex-grow">
                <div className="flex-1 p-4 content-center">
                    <h5 className="mb-2 text-slate-800 text-xl font-medium">
                    WORKED TIME
                    </h5>
                    <p className="text-slate-600 text-2xl leading-normal font-light">
                    {workedTime}
                    </p>
                </div>

                <div className="border-r border-slate-200 h-20 self-center"></div>

                <div className="flex-1 p-4 content-center">
                    <h5 className="mb-2 text-slate-800 text-xl font-medium">
                    AVG. ACTIVITY
                    </h5>
                    <p className="text-slate-600 text-2xl leading-normal font-light">
                    {averageActivity}%
                    </p>
                </div>
                </div>
            </div>

            {
            hasError ? (
                <div className="flex flex-col items-center justify-center h-1/2">
                <Lottie animationData={animationData} loop={true} />
            </div>
            ) : (timeSections.map((section, sectionIndex) => {
                const timeSlots = generateTimeSlots(section.sectionStart, section.sectionEnd);
                return (
                <div key={sectionIndex} className="my-8">
                    <h2 className="text-xl font-bold mb-4 py-3 flex items-center text-gray-800 after:flex-1 after:border-t after:border-gray-200 after:ms-6 dark:text-white dark:after:border-neutral-600">{format(section.sectionStart, 'h:mm a')} to {format(section.sectionEnd, 'h:mm a')}</h2>
                    <div className="flex flex-wrap justify-center grid grid-cols-6">
                    {timeSlots.map((slot, slotIndex) => {
                        const cards = getCardsForTimeSlot(slot);
                        return (
                        cards.length > 0 ? (
                            cards.map((item) => (
                            <div
                                key={item.id}
                                className="relative overflow-hidden shadow-lg m-3 pb-4 cursor-pointer group rounded-2xl h-52 "
                                onClick={() => handleImageClick(item.id)}
                            >
                                <img className="w-full h-28" src={`${HOST_URL}/media/${item.image_url}`} alt="Screenshot" />
                                <div className="px-3 pt-3">
                                <div className="font-normal text-sm mb-4">{item.time}</div>
                                </div>
                                <div className="h-1 relative w-56 m-auto px-10 rounded-2xl bg-gray-200">
                                <div
                                    className={`absolute top-0 left-0 h-full rounded-2xl ${getColorClass(item.percent)}`}
                                    style={{ width: `${item.percent}%` }}
                                />
                                </div>
                                <p className="text-xs w-full text-center pt-2">{item.percent}% of {item.duration}</p>

                                {/* Hover Preview */}
                                <div className="absolute h-28 inset-0 bg-gray-800 bg-opacity-75 text-white p-4 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="border rounded-md p-2 bg-white text-black">
                                    <p className="text-md font-normal">View Screen</p>
                                </div>
                                </div>
                            </div>
                            ))
                        ) : (
                            <div
                            key={slot.time}
                            className="relative overflow-hidden shadow-lg m-3 pb-4 group rounded-2xl bg-gray-300 h-52"
                            >
                            <img className="w-full h-28" src="data:image/jpeg;base64,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" alt="Screenshot" />
                            {/* <p className="text-lg text-center font-medium text-600">No Activity</p> */}
                            </div>
                        )
                        );
                    })}
                    </div>
                </div>
                );
                }))}
            </div>
        </div>
        </div>
    </section>

    {isModalOpen && selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-3/5 relative">
            <button
            className="absolute top-2 right-2 p-2 bg-gray-300 rounded-full text-gray-600 hover:text-gray-900 flex items-center justify-center"
            onClick={closeModal}
            style={{ width: 40, height: 40 }}
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" fill="currentColor">
                <path d="M24 22.627l-8.485-8.486 8.485-8.486L24 6.127l-8.486 8.485L7.03 6.127 6.127 7.03 14.613 15.515 6.127 23.998l.903.903 8.485-8.485L24 22.627z" />
            </svg>
            </button>
            <div className="text-center text-xl font-semibold flex-grow">Date : {formatDate(startDate)}</div>
            <img className="w-full mb-4" src={`${HOST_URL}/media/${pageData[selectedImageIndex]?.image_url}`} alt="Detailed view" />
            <div className="flex justify-between items-center mt-4">
            <button
                onClick={handlePrevious}
                disabled={filteredIndices.indexOf(selectedImageIndex) === 0}
                className="text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
                Previous
            </button>
            <p className="text-center text-sm font-semibold flex-grow">
                Time: {pageData[selectedImageIndex]?.time} | Percent: {pageData[selectedImageIndex]?.percent}% <span className={`w-4 h-4 me-3 inline-flex ${getColorClass(pageData[selectedImageIndex]?.percent)} rounded-full`}></span> | Duration: {pageData[selectedImageIndex]?.duration} <br></br> Mouse: {pageData[selectedImageIndex]?.mouse_activity_percentage}% | KeyBoard: {pageData[selectedImageIndex]?.keyboard_activity_percentage}%
            </p>
            
            <button
                onClick={handleNext}
                disabled={filteredIndices.indexOf(selectedImageIndex) === filteredIndices.length - 1}
                className="text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
                Next
            </button>
            </div>
        </div>
        </div>
    )}
    
    </div>
        )
);
};


export default Home;