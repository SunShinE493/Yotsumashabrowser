import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { RangeSelector } from "@/components/range-selector";
import { StudySession } from "@/components/study-session";
import { StudyResults } from "@/components/study-results";
import { ReviewWords } from "@/components/review-words";
import { useQuery } from "@tanstack/react-query";
import type { VocabularyWord, StudySession as StudySessionType } from "@shared/schema";

export default function Home() {
  const [currentSession, setCurrentSession] = useState<StudySessionType | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [completedSession, setCompletedSession] = useState<StudySessionType | null>(null);

  const { data: vocabularyWords = [], refetch: refetchVocabulary } = useQuery<VocabularyWord[]>({
    queryKey: ["/api/vocabulary"],
  });

  const { data: reviewWords = [] } = useQuery({
    queryKey: ["/api/vocabulary/review"],
  });

  const handleUploadSuccess = () => {
    refetchVocabulary();
  };

  const handleStartSession = (session: StudySessionType) => {
    setCurrentSession(session);
    setShowResults(false);
  };

  const handleSessionComplete = async (sessionData?: StudySessionType) => {
    try {
      if (sessionData) {
        // セッションデータが直接渡された場合（復習セッションなど）
        setCompletedSession(sessionData);
        setShowResults(true);
      } else if (currentSession) {
        // 通常セッションの場合、サーバーから最新データを取得
        const response = await fetch(`/api/study/session/${currentSession.id}`);
        if (response.ok) {
          const updatedSession = await response.json();
          setCompletedSession(updatedSession);
        } else {
          setCompletedSession(currentSession);
        }
        setShowResults(true);
      }
    } catch (error) {
      console.error('Failed to fetch completed session:', error);
      setCompletedSession(currentSession);
      setShowResults(true);
    }
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setCompletedSession(null);
    setShowResults(false);
  };

  const handleStartReview = () => {
    if (reviewWords.length > 0) {
      // 復習セッションを作成
      const reviewSession: StudySessionType = {
        id: `review-${Date.now()}`,
        startRange: 1,
        endRange: reviewWords.length,
        totalWords: reviewWords.length,
        correctCount: 0,
        incorrectCount: 0,
        isCompleted: false,
        createdAt: new Date(),
      };
      setCurrentSession(reviewSession);
      setShowResults(false);
    }
  };

  const handleQuickStart = async () => {
    if (vocabularyWords.length === 0) {
      // 単語がない場合は何もしない
      return;
    }

    try {
      // デフォルト設定で学習セッションを作成
      const endRange = Math.min(20, vocabularyWords.length);
      const config = {
        startRange: 1,
        endRange,
        questionCount: endRange,
        order: "random" as const,
        reviewOnly: false,
      };

      const response = await fetch("/api/study/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const session = await response.json();
        handleStartSession(session);
      }
    } catch (error) {
      console.error('Failed to start quick session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-book text-primary-foreground"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">単語暗記アプリ</h1>
                <p className="text-sm text-muted-foreground">Vocabulary Learning</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="touch-target p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
                data-testid="button-settings"
              >
                <i className="fas fa-cog text-secondary-foreground"></i>
              </button>
              <div className="hidden sm:flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
                <i className="fas fa-chart-line text-primary text-sm"></i>
                <span className="text-sm font-medium text-foreground" data-testid="text-progress">
                  {vocabularyWords.length > 0 ? `${vocabularyWords.length}語` : "0語"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Show study session if active */}
        {currentSession && !showResults && (
          <StudySession 
            session={currentSession}
            onComplete={handleSessionComplete}
            onBack={handleNewSession}
          />
        )}

        {/* Show results if session completed */}
        {showResults && (completedSession || currentSession) && (
          <StudyResults
            session={completedSession || currentSession!}
            onNewSession={handleNewSession}
            onReview={handleStartReview}
          />
        )}

        {/* Show setup if no active session */}
        {!currentSession && (
          <>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            
            <RangeSelector 
              totalWords={vocabularyWords.length}
              onStartSession={handleStartSession}
            />

            <ReviewWords 
              reviewWords={reviewWords} 
              onStartReview={handleStartReview}
            />
          </>
        )}

      </main>

      {/* Floating Action Button */}
      {!currentSession && vocabularyWords.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button 
            onClick={handleQuickStart}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center group"
            data-testid="button-quick-start"
            title="クイック学習開始（最初の20語をランダムで学習）"
          >
            <i className="fas fa-play text-xl group-hover:scale-110 transition-transform"></i>
          </button>
        </div>
      )}
    </div>
  );
}
