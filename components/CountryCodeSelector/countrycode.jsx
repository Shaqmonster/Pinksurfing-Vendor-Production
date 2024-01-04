import React, { useState, useEffect } from 'react';
import i18nIsoCountries from 'i18n-iso-countries';

const CountryCodeSelector = ({ onSelect }) => {
  const [countryCodes, setCountryCodes] = useState([]);

  useEffect(() => {
    i18nIsoCountries.registerLocale(require('i18n-iso-countries/langs/en.json'));
    const codes = i18nIsoCountries.getNames('en', { select: 'official' });
    const countryArray = Object.entries(codes).map(([code, name]) => ({ code, name }));
    setCountryCodes(countryArray);
  }, []);

  return (
    <select
      onChange={(e) => onSelect(e.target.value)}
      className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
    >
      <option value="">Select Country</option>
      {countryCodes.map((country) => (
        <option key={country.code} value={country.code}>
          {`${country.name} - ${country.code}`}
        </option>
      ))}
    </select>
  );
};

export default CountryCodeSelector;
