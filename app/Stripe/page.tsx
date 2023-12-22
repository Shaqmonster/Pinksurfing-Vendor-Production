"use client";
import React, { useEffect, useState } from 'react';
import { getOnboardingUrl } from '@/api/account';
import axios from 'axios';

const StripePage = () => {
    const [onboardingUrl, setOnboardingUrl] = useState(null);
  
    const handleClick = async () => {
      try {
        const token = localStorage.getItem('access');
        if (!token) {
          console.error('Access token not found in localStorage');
          return;
        }
  
        const response = await getOnboardingUrl(token);
  
        const url = response?.url;
        console.log('API Response:', response);
  
        if (!url) {
          console.error('Onboarding URL not found in the API response');
          return;
        }
  
        console.log('Onboarding URL:', url);
        setOnboardingUrl(url);

        window.open(url, '_blank');
      } catch (error) {
        console.error('Error:', error);
 
      }
    };
  
    useEffect(() => {

    }, [onboardingUrl]);
  
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <button
            className="bg-blue-500 border border-blue-600 text-black px-8 py-4 rounded-lg text-xl hover:bg-blue-600"
            onClick={handleClick}
          >
            Start Stripe Onboarding
          </button>
        </div>
      </div>
    );
  };
  
  export default StripePage;
  