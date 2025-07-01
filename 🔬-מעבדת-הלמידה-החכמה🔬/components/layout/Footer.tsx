import React from 'react';
import Button from '../ui/Button';

const Footer: React.FC = () => {
  const workshopLink = 'https://www.sciencedu.online/product-page/%D7%A4%D7%99%D7%AA%D7%95%D7%97-%D7%90%D7%A4%D7%9C%D7%99%D7%A7%D7%A6%D7%99%D7%94-%D7%9C%D7%99%D7%9E%D7%95%D7%93%D7%99%D7%AA-ai-%D7%91%D7%94%D7%95%D7%A8%D7%90%D7%94';
  const mainSiteLink = 'https://www.sciencedu.online/eduai';
  const imageUrl = 'https://nofars.neocities.org/%D7%AA%D7%9E%D7%95%D7%A0%D7%94%20%D7%9C%D7%A7%D7%9E%D7%A4%D7%99%D7%99%D7%9F%20%D7%A1%D7%93%D7%A0%D7%AA%20AI%20%D7%95%D7%95%D7%99%D7%99%D7%91%20%D7%A7%D7%95%D7%93%D7%99%D7%A0%D7%92.png';

  return (
    <footer className="bg-gray-800 text-white w-full py-6 px-4 mt-auto">
      <div className="container mx-auto">
        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Marketing Content Column */}
          <div className="text-center md:text-right space-y-4 order-2 md:order-1">
            <p className="text-xl font-bold text-yellow-300">💡 האפליקציה הזו נוצרה בסדנת LIVE שלי!</p>
            <p className="text-lg">רוצים לבנות כזו בעצמכם? תקבלו:</p>
            <ul className="space-y-1 list-inside text-right w-fit mx-auto md:mx-0">
              <li>🎯 הקלטת הסדנה המלאה</li>
              <li>🎯 קורס מלווה עם כל הקבצים</li>
              <li>🎯 ליווי אישי שלי</li>
            </ul>
            <div className="pt-2">
                 <Button
                    onClick={() => window.open(workshopLink, '_blank')}
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto"
                >
                    👇 לחצו כאן לגישה מיידית
                </Button>
            </div>
          </div>
          
          {/* Image Column */}
          <div className="flex justify-center items-start order-1 md:order-2">
            <a href={workshopLink} target="_blank" rel="noopener noreferrer" className="block">
              <img 
                src={imageUrl} 
                alt="Promotional visual for the workshop"
                className="rounded-lg shadow-xl max-w-xs w-full transition-opacity duration-300 hover:opacity-90"
                style={{ clipPath: 'inset(0 0 20% 0)' }} 
              />
            </a>
          </div>
        </div>
        
        {/* Copyright Row */}
        <div className="text-center mt-8 pt-6 border-t border-gray-700">
           <p className="text-gray-400">
            כל הזכויות שמורות ל
            <a 
              href={mainSiteLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-indigo-300 hover:text-indigo-200 underline transition-colors mx-1"
            >
              נופר גרגרוד
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;