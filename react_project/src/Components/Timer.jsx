import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTime, startTimer, stopTimer } from '../redux/timerSlice';
import axios from 'axios';

const Timer = () => {
    const dispatch = useDispatch();
    const time = useSelector((state) => state.timer.time);
    const isRunning = useSelector((state) => state.timer.isRunning);

    const [currentDate, setCurrentDate] = useState(new Date().toDateString());

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}:${secs}`;
    };

    const formatTimeWithoutSeconds = (seconds) => {
        const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    useEffect(() => {
        let timerInterval;
        if (isRunning) {
            timerInterval = setInterval(() => {
                dispatch(setTime(time + 1));
            }, 1000);
        } else {
            clearInterval(timerInterval);
        }

        return () => clearInterval(timerInterval);
    }, [isRunning, time, dispatch]);

    useEffect(() => {
        const checkDate = () => {
            const newDate = new Date().toDateString();
            if (newDate !== currentDate) {
                setCurrentDate(newDate);
                dispatch(setTime(0));
            }
        };

        const intervalId = setInterval(checkDate, 1000);

        return () => clearInterval(intervalId);
    }, [currentDate, dispatch]);

    const handleStartTimer = async () => {
        try {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzI5MDk5MzAzLCJpYXQiOjE3Mjg5MjY1MDMsImp0aSI6IjdhNTMzMmQ3MmU0ODQwMjg4MTMxMjdhZDcxMzZiODg5IiwidXNlcl9pZCI6Mn0.6O6OC72RKF3Vpu87GhBExyCHvqTvau8iXaOU8mhe3Gc'; // Replace with your actual token
            await axios.post('http://localhost:8000/api/user/activity-details/', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                action: 'start'
            });
            dispatch(startTimer());
        } catch (error) {
            console.error('Failed to start the timer:', error);
        }
    };

    const handleStopTimer = async () => {
        try {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzI5MDk5MzAzLCJpYXQiOjE3Mjg5MjY1MDMsImp0aSI6IjdhNTMzMmQ3MmU0ODQwMjg4MTMxMjdhZDcxMzZiODg5IiwidXNlcl9pZCI6Mn0.6O6OC72RKF3Vpu87GhBExyCHvqTvau8iXaOU8mhe3Gc'; // Replace with your actual token
            await axios.post(
                'http://localhost:8000/api/user/activity-details-stop/', 
                { action: 'stop' }, // Payload data
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Authorization header
                    }
                }
            );
            dispatch(stopTimer());
        } catch (error) {
            console.error('Failed to stop the timer:', error);
        }
    };

    return (
        <div>
            <section className="bg-gray-100 dark:bg-gray-900">
                <div className="flex flex-col items-center px-6 py-8 mx-auto">
                    <div className="w-full h-full bg-white rounded-lg shadow dark:border md:mt-0 xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-6 md:space-y-6 sm:p-8 flex justify-center">
                            <div className="text-center w-1/3 font-semibold text-2xl">
                                Timer
                            </div>
                        </div>
                        <div className="space-y-2 md:space-y-6 sm:pb-8 flex justify-center">
                            <div className="border border-blue text-center w-1/3">
                                <div className="border-gray-50 p-2 bg-blue-500 text-white font-semibold text-xl">
                                    {formatTime(time)}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center py-3 items-center text-sm text-gray-800 before:flex-1 before:border-t before:border-gray-200 before:me-6 after:flex-1 after:border-t after:border-gray-200 after:ms-6 dark:text-white dark:before:border-neutral-600 dark:after:border-neutral-600">
                            {!isRunning && (
                                <div
                                    className="relative w-16 h-16 flex items-center justify-center border-2 border-gray-200 rounded-full cursor-pointer"
                                    onClick={handleStartTimer}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="pl-1" width="36" height="36" viewBox="0 0 56 56">
                                        <path fill="#4f85f3" d="M13.094 47.84c.937 0 1.734-.375 2.672-.914l27.328-15.797c1.945-1.149 2.625-1.899 2.625-3.14c0-1.243-.68-1.993-2.625-3.118L15.766 9.051c-.938-.54-1.735-.89-2.672-.89c-1.735 0-2.813 1.312-2.813 3.35v32.954c0 2.039 1.078 3.375 2.813 3.375"/>
                                    </svg>
                                </div>
                            )}
                            {isRunning && (
                                <div
                                    className="relative w-16 h-16 flex items-center justify-center border-2 border-gray-200 rounded-full cursor-pointer"
                                    onClick={handleStopTimer}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 16 16">
                                        <path fill="#4f85f3" fillRule="evenodd" d="M4.5 1.5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 md:space-y-6 sm:pb-8 flex justify-center">
                            <div className="text-center w-full">
                                <div className="flex w-full divide-x h-8 text-gray-400">
                                    <div className='w-1/2'>No limits</div>
                                    <div className='w-1/2'>Time: {formatTimeWithoutSeconds(time)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Timer;
