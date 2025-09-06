import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { StudySession, VocabularyWord } from "@shared/schema";

export function useStudySession(session: StudySession) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [studyWords, setStudyWords] = useState<VocabularyWord[]>([]);

  const { data: vocabularyWords = [] } = useQuery<VocabularyWord[]>({
    queryKey: [`/api/vocabulary/range/${session.startRange}/${session.endRange}`],
  });

  useEffect(() => {
    console.log('Vocabulary words loaded:', vocabularyWords.length);
    if (vocabularyWords.length > 0) {
      let words = [...vocabularyWords];
      
      // Shuffle if random order
      if (session.totalWords < words.length) {
        words = words.sort(() => Math.random() - 0.5);
        words = words.slice(0, session.totalWords);
      }
      
      console.log('Study words set:', words.length);
      setStudyWords(words);
    }
  }, [vocabularyWords, session]);

  const currentWord = studyWords[currentWordIndex] || null;
  const isComplete = studyWords.length > 0 && currentWordIndex >= studyWords.length;
  
  console.log('Current state:', {
    currentWordIndex,
    studyWordsLength: studyWords.length,
    isComplete,
    currentWord: currentWord?.word
  });

  const nextWord = () => {
    setCurrentWordIndex(prev => prev + 1);
  };

  const markWord = (isRemembered: boolean) => {
    if (isRemembered) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }
    nextWord();
  };

  return {
    currentWordIndex,
    currentWord,
    correctCount,
    incorrectCount,
    studyWords,
    isComplete,
    nextWord,
    markWord,
  };
}
