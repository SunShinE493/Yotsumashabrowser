import { useState } from "react";
import type { VocabularyWord } from "@shared/schema";

interface VocabularyCardProps {
  word: VocabularyWord;
  isFlipped: boolean;
  onFlip: () => void;
}

export function VocabularyCard({ word, isFlipped, onFlip }: VocabularyCardProps) {
  return (
    <div 
      className="relative h-64 cursor-pointer touch-target"
      onClick={onFlip}
      data-testid="card-vocabulary"
    >
      <div className={`card-flip relative w-full h-full ${isFlipped ? 'flipped' : ''}`}>
        {/* Front of Card (Word) */}
        <div className="card-front bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center text-center">
          <div className="space-y-4">
            <div className="text-sm text-primary-foreground/80 font-medium">単語</div>
            <div className="text-3xl font-bold text-primary-foreground" data-testid="text-word">
              {word.word}
            </div>
            {word.category && (
              <div className="text-sm text-primary-foreground/80" data-testid="text-category">
                {word.category}
              </div>
            )}
          </div>
          <div className="absolute bottom-4 right-4">
            <i className="fas fa-hand-pointer text-primary-foreground/60 text-sm"></i>
          </div>
        </div>

        {/* Back of Card (Meaning) */}
        <div className="card-back bg-gradient-to-br from-accent to-muted rounded-xl shadow-lg p-8 flex flex-col items-center justify-center text-center">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground font-medium">意味</div>
            <div className="text-2xl font-bold text-foreground" data-testid="text-meaning">
              {word.meaning}
            </div>
            {word.example && (
              <div className="text-sm text-muted-foreground" data-testid="text-example">
                例: {word.example}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
