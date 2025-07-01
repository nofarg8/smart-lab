import React from 'react';

const Header: React.FC = () => {
  const linkUrl = 'https://www.sciencedu.online/product-page/%D7%A4%D7%99%D7%AA%D7%95%D7%97-%D7%90%D7%A4%D7%9C%D7%99%D7%A7%D7%A6%D7%99%D7%94-%D7%9C%D7%99%D7%9E%D7%95%D7%93%D7%99%D7%AA-ai-%D7%91%D7%94%D7%95%D7%A8%D7%90%D7%94';
  const logoUrl = 'https://nofars.neocities.org/logopic.png';

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-md w-full z-50">
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="container mx-auto px-4 py-2 flex items-center justify-center gap-6 hover:bg-white/10 transition-colors duration-300"
      >
        <div className="text-center md:text-right text-sm md:text-base">
          <p className="font-semibold">אפליקציה זו נוצרה בסדנת LIVE "פיתוח אפליקציות לימודיות" - שילוב AI בהוראה</p>
          <p>לחצו על המוח <span className="inline-block animate-pulse text-lg">👈</span> כדי לפתח כזו בעצמכם</p>
        </div>
        <div className="bg-white rounded-full p-1 shadow-lg flex-shrink-0">
          <img src={logoUrl} alt="לוגו המוח של נופר" className="h-16 w-16 object-contain" />
        </div>
      </a>
    </header>
  );
};

export default Header;