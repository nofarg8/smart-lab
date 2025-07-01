import React, { useState } from 'react';
import type { Student, Grade } from './types';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import LinguisticPathController from './components/features/linguistic/LinguisticPathController';
import MathematicalPathController from './components/features/mathematical/MathematicalPathController';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

type AppState = 'login' | 'path_selection' | 'linguistic' | 'mathematical';

const WelcomeScreen: React.FC<{ onLogin: (student: Student) => void }> = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState<Grade | ''>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && grade) {
            onLogin({ name, grade });
        } else {
            alert('נא למלא שם וכיתה');
        }
    };
    
    return (
        <Card className="max-w-lg mx-auto text-center animate-fade-in">
            <h1 className="text-3xl font-bold mb-2 text-[#7371fc]">ברוכים הבאים! 👋 בואו נכיר</h1>
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div>
                    <label htmlFor="name" className="block text-lg font-medium text-gray-700">שם:</label>
                    <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7371fc]" required/>
                </div>
                <div>
                    <span className="block text-lg font-medium text-gray-700">כיתה:</span>
                    <div className="flex justify-center gap-3 mt-2">
                        {(['ג', 'ד', 'ה', 'ו'] as Grade[]).map(g => (
                            <button key={g} type="button" onClick={() => setGrade(g)} className={`w-14 h-14 text-xl font-bold rounded-full border-2 transition-all ${grade === g ? 'bg-[#7371fc] text-white border-[#7371fc]' : 'bg-gray-100 border-gray-300'}`}>{g}</button>
                        ))}
                    </div>
                </div>
                 <Button type="submit" variant="primary">שמירה והמשך</Button>
            </form>
        </Card>
    );
};

const PathSelection: React.FC<{ student: Student, onSelectPath: (path: 'linguistic' | 'mathematical') => void, onLogout: () => void }> = ({ student, onSelectPath, onLogout }) => {
    return (
        <Card className="max-w-2xl mx-auto text-center animate-fade-in">
            <h2 className="text-3xl font-bold">הי {student.name}! 👋</h2>
            <p className="text-xl mt-2 mb-6">אני נופר, המורה שלכם! באפליקציה זו יש לכם 2 מסלולי לימוד:</p>
            <div className="space-y-4 text-right my-6 p-4 bg-gray-50 rounded-lg">
                 <p className="text-lg"><span className="font-bold text-[#7371fc]">🎨 מסלול לשוני</span> - ניצור סיפור מותאם במיוחד בשבילכם, נענה על שאלות ולבסוף ניצור תמונה המתאימה לתשובותיכם!</p>
                 <p className="text-lg"><span className="font-bold text-[#ffa62b]">🔢 מסלול מתמטי</span> - נבחר נושא שאנו רוצים לעבוד עליו, נפתור יחד וגם נקבל הדרכה כשצריך.</p>
            </div>
            <h3 className="text-2xl font-semibold my-6">מה תרצו ללמוד היום?</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button onClick={() => onSelectPath('linguistic')} variant="primary" className="text-xl">🎨 שפה עברית</Button>
                <Button onClick={() => onSelectPath('mathematical')} variant="secondary" className="text-xl">🔢 מתמטיקה</Button>
            </div>
            <div className="mt-8">
                <button onClick={onLogout} className="text-sm text-gray-500 hover:text-[#7371fc] hover:underline">
                    התחברות ממשתמש אחר
                </button>
            </div>
        </Card>
    )
}

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [student, setStudent] = useState<Student | null>(null);

  const handleLogin = (studentData: Student) => {
    setStudent(studentData);
    setAppState('path_selection');
  };
  
  const handleExitPath = () => {
      setAppState('path_selection');
  }
  
  const handleLogout = () => {
      setStudent(null);
      setAppState('login');
  }

  const renderContent = () => {
    switch (appState) {
        case 'login':
            return <WelcomeScreen onLogin={handleLogin} />;
        case 'path_selection':
            if (student) {
                return <PathSelection student={student} onSelectPath={setAppState} onLogout={handleLogout} />;
            }
            // Fallback if student is somehow null
            return <WelcomeScreen onLogin={handleLogin} />;
        case 'linguistic':
            if (student) {
                return <LinguisticPathController student={student} onExit={handleExitPath} />;
            }
            return <WelcomeScreen onLogin={handleLogin} />; // Should not happen
        case 'mathematical':
            if (student) {
                return <MathematicalPathController student={student} onExit={handleExitPath} />;
            }
            return <WelcomeScreen onLogin={handleLogin} />; // Should not happen
        default:
            return <div>Error</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="w-full flex-grow flex flex-col items-center justify-center p-4">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
