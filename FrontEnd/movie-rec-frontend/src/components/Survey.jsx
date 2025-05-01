import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SurveyService from '../services/SurveyService';

const Survey = () => {
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    mood: '',
    occasion: '',
    genres: [],
    agePreference: '',
    isRatingImportant: '',
    themes: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Дефинираме кои въпроси са multiple-choice
  const isMultipleChoice = (filterProperty) => {
    return filterProperty === 'genres' || filterProperty === 'themes';
  };

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await SurveyService.getSurveyQuestions();
        // Сортираме въпросите, за да гарантираме, че genres и themes са multiple
        const sortedQuestions = data.map(q => ({
          ...q,
          isMultipleChoice: isMultipleChoice(q.filterProperty)
        }));
        setQuestions(sortedQuestions);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const handleAnswerChange = (field, value) => {
    setAnswers(prev => {
      if (isMultipleChoice(field)) {
        const currentValues = Array.isArray(prev[field]) ? prev[field] : [];
        return {
          ...prev,
          [field]: currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value]
        };
      }
      return { ...prev, [field]: value };
    });

    // Автоматично преминаване напред за единични въпроси
    if (!isMultipleChoice(field)) {
      setTimeout(() => {
        if (currentStep < questions.length - 1) {
          setCurrentStep(prev => prev + 1);
        }
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...answers,
        isRatingImportant: answers.isRatingImportant === "Yes"
      };

      const data = await SurveyService.submitSurveyAnswers(payload);
      navigate('/survey-results', { state: { movies: data.movies } });
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-white">Зареждане на анкетата...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-900 bg-opacity-80 border-l-4 border-red-500 text-red-100 p-4 max-w-md mx-4 rounded">
          <p className="font-bold">Грешка</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Опитай отново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden md:max-w-2xl border border-gray-700">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Какъв филм да гледаме?</h1>
            <span className="text-sm text-gray-400">
              Въпрос {currentStep + 1} от {questions.length}
            </span>
          </div>

          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full" 
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-50 text-red-100 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {questions.map((question, index) => (
              <div 
                key={question.id} 
                className={`transition-all duration-300 ${index === currentStep ? 'block' : 'hidden'}`}
              >
                <h2 className="text-xl font-semibold text-white mb-4">
                  {question.text}
                  {!isMultipleChoice(question.filterProperty) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </h2>

                <div className="space-y-3 mb-6">
                  {question.options.map(option => (
                    <div key={option} className="flex items-center">
                      {isMultipleChoice(question.filterProperty) ? (
                        <label className={`flex items-center w-full p-3 rounded-lg border cursor-pointer transition-colors ${
                          answers[question.filterProperty]?.includes(option)
                            ? 'border-blue-400 bg-blue-900 bg-opacity-30'
                            : 'border-gray-600 hover:bg-gray-700'
                        }`}>
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-400 rounded focus:ring-blue-500"
                            checked={answers[question.filterProperty]?.includes(option) || false}
                            onChange={() => handleAnswerChange(question.filterProperty, option)}
                          />
                          <span className="ml-3 text-gray-200">{option}</span>
                        </label>
                      ) : (
                        <label className={`flex items-center w-full p-3 rounded-lg border cursor-pointer transition-colors ${
                          answers[question.filterProperty] === option
                            ? 'border-blue-400 bg-blue-900 bg-opacity-30'
                            : 'border-gray-600 hover:bg-gray-700'
                        }`}>
                          <input
                            type="radio"
                            name={question.filterProperty}
                            className="form-radio h-5 w-5 text-blue-400 focus:ring-blue-500"
                            checked={answers[question.filterProperty] === option}
                            onChange={() => handleAnswerChange(question.filterProperty, option)}
                          />
                          <span className="ml-3 text-gray-200">{option}</span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentStep === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                } transition-colors`}
              >
                Назад
              </button>

              {currentStep < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    !answers[questions[currentStep].filterProperty] || 
                    (Array.isArray(answers[questions[currentStep].filterProperty]) && 
                    answers[questions[currentStep].filterProperty].length === 0)
                  }
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    !answers[questions[currentStep].filterProperty] || 
                    (Array.isArray(answers[questions[currentStep].filterProperty]) && 
                    answers[questions[currentStep].filterProperty].length === 0)
                      ? 'bg-blue-700 bg-opacity-50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500'
                  } transition-colors`}
                >
                  Напред
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-lg font-medium text-white ${
                    isSubmitting
                      ? 'bg-blue-700 bg-opacity-50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500'
                  } transition-colors`}
                >
                  {isSubmitting ? 'Изпращане...' : 'Получи препоръки'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Survey;