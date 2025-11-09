/**
 * Countdown Timer Component
 * Displays a live countdown until a target date/time
 */

import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ endDate, label = 'Time remaining' }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        expired: false,
      });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate) {
    return null;
  }

  if (timeRemaining.expired) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm font-semibold">
        ⏰ Return deadline has passed
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p className="text-xs text-gray-600 mb-2 font-medium">{label}:</p>
      <div className="flex gap-2 items-center">
        {timeRemaining.days > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-umass-maroon">{timeRemaining.days}</div>
            <div className="text-xs text-gray-600">day{timeRemaining.days !== 1 ? 's' : ''}</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-2xl font-bold text-umass-maroon">{String(timeRemaining.hours).padStart(2, '0')}</div>
          <div className="text-xs text-gray-600">hour{timeRemaining.hours !== 1 ? 's' : ''}</div>
        </div>
        <div className="text-gray-400">:</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-umass-maroon">{String(timeRemaining.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-gray-600">min</div>
        </div>
        <div className="text-gray-400">:</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-umass-maroon">{String(timeRemaining.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-gray-600">sec</div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Return by: {new Date(endDate).toLocaleString()}
      </p>
    </div>
  );
};

export default CountdownTimer;

