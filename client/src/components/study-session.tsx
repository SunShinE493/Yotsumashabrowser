import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VocabularyCard } from "./vocabulary-card";
import { useStudySession } from "@/hooks/use-study-session";
import type { StudySession as StudySessionType, VocabularyWord } from "@shared/schema";

interface StudySessionProps {
  session: StudySessionType;
  onComplete: (sessionId: string) => void;
  onBack: () => void;
}

export function StudySession({ session, onComplete, onBack }: StudySessionProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    currentWordIndex,
    currentWord,
    correctCount,
    incorrectCount,
    studyWords,
    nextWord,
    markWord,
    isComplete
  } = useStudySession(session);

  const recordProgressMutation = useMutation({
    mutationFn: async ({ wordId, isRemembered }: { wordId: string; isRemembered: boolean }) => {
      const response = await apiRequest("POST", "/api/study/progress", {
        wordId,
        sessionId: session.id,
        isRemembered,
        attempts: 1,
      });
      return response.json();
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<StudySessionType>) => {
      const response = await apiRequest("PATCH", `/api/study/session/${session.id}`, updates);
      return response.json();
    },
  });

  useEffect(() => {
    if (isComplete) {
      updateSessionMutation.mutate({
        correctCount,
        incorrectCount,
        isCompleted: true,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/vocabulary/review"] });
          onComplete(session.id);
        }
      });
    }
  }, [isComplete, correctCount, incorrectCount]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkWord = (isRemembered: boolean) => {
    if (!currentWord) return;

    recordProgressMutation.mutate({
      wordId: currentWord.id,
      isRemembered,
    });

    markWord(isRemembered);
    setIsFlipped(false);
  };

  const handleSkip = () => {
    nextWord();
    setIsFlipped(false);
  };

  if (!currentWord) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
            <p className="text-muted-foreground">単語を読み込んでいます...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentWordIndex + 1) / studyWords.length) * 100;

  return (
    <Card className="overflow-hidden">
      {/* Progress Header */}
      <div className="bg-muted/50 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              data-testid="button-back"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              戻る
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground" data-testid="text-current-question">
              {currentWordIndex + 1}
            </span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground" data-testid="text-total-questions">
              {studyWords.length}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-check-circle text-success text-sm"></i>
              <span className="text-sm text-success" data-testid="text-correct-count">{correctCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-times-circle text-warning text-sm"></i>
              <span className="text-sm text-warning" data-testid="text-incorrect-count">{incorrectCount}</span>
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="progress-bar bg-primary h-2 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
            data-testid="progress-bar"
          ></div>
        </div>
      </div>

      {/* Vocabulary Card */}
      <div className="p-8">
        <div className="max-w-md mx-auto">
          <VocabularyCard
            word={currentWord}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />

          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => handleMarkWord(false)}
              disabled={!isFlipped}
              data-testid="button-not-remembered"
            >
              <i className="fas fa-times mr-2"></i>
              覚えていない
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => handleMarkWord(true)}
              disabled={!isFlipped}
              className="bg-success hover:bg-success/90 text-success-foreground"
              data-testid="button-remembered"
            >
              <i className="fas fa-check mr-2"></i>
              覚えた
            </Button>
          </div>

          {/* Skip Button */}
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              data-testid="button-skip"
            >
              <i className="fas fa-forward mr-1"></i>
              スキップ
            </Button>
          </div>

          {!isFlipped && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              カードをタップして意味を表示
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
