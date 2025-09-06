import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { StudyConfig, StudySession } from "@shared/schema";

interface RangeSelectorProps {
  totalWords: number;
  onStartSession: (session: StudySession) => void;
}

export function RangeSelector({ totalWords, onStartSession }: RangeSelectorProps) {
  const [startRange, setStartRange] = useState(1);
  const [endRange, setEndRange] = useState(Math.min(50, totalWords));
  const [questionCount, setQuestionCount] = useState(50);
  const [order, setOrder] = useState<"sequential" | "random" | "difficulty">("random");
  const [reviewOnly, setReviewOnly] = useState(false);
  const { toast } = useToast();

  const createSessionMutation = useMutation({
    mutationFn: async (config: StudyConfig) => {
      const response = await apiRequest("POST", "/api/study/session", config);
      return response.json();
    },
    onSuccess: (session) => {
      onStartSession(session);
    },
    onError: (error) => {
      toast({
        title: "セッション作成エラー",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleStartStudy = () => {
    if (totalWords === 0) {
      toast({
        title: "単語データなし",
        description: "先にJSONファイルをアップロードしてください",
        variant: "destructive",
      });
      return;
    }

    if (startRange > endRange) {
      toast({
        title: "範囲エラー",
        description: "開始番号は終了番号以下である必要があります",
        variant: "destructive",
      });
      return;
    }

    const config: StudyConfig = {
      startRange,
      endRange,
      questionCount: questionCount === -1 ? endRange - startRange + 1 : questionCount,
      order,
      reviewOnly,
    };

    createSessionMutation.mutate(config);
  };

  const setPresetRange = (start: number, end: number) => {
    setStartRange(start);
    setEndRange(Math.min(end, totalWords));
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <i className="fas fa-sliders-h text-primary"></i>
            <h2 className="text-lg font-semibold text-foreground">学習範囲の設定</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="review-mode" className="text-sm text-muted-foreground">復習のみ</Label>
            <Switch
              id="review-mode"
              checked={reviewOnly}
              onCheckedChange={setReviewOnly}
              data-testid="switch-review-mode"
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Range Inputs */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="start-range" className="text-sm font-medium text-foreground mb-1">
                開始番号
              </Label>
              <Input
                id="start-range"
                type="number"
                min="1"
                max={totalWords}
                value={startRange}
                onChange={(e) => setStartRange(parseInt(e.target.value) || 1)}
                data-testid="input-start-range"
              />
            </div>
            <div>
              <Label htmlFor="end-range" className="text-sm font-medium text-foreground mb-1">
                終了番号
              </Label>
              <Input
                id="end-range"
                type="number"
                min="1"
                max={totalWords}
                value={endRange}
                onChange={(e) => setEndRange(parseInt(e.target.value) || 1)}
                data-testid="input-end-range"
              />
            </div>
          </div>
          
          {/* Quick Presets */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground mb-2">クイック設定</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPresetRange(1, 100)}
                data-testid="button-preset-1-100"
              >
                1-100
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPresetRange(101, 200)}
                data-testid="button-preset-101-200"
              >
                101-200
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPresetRange(201, 300)}
                data-testid="button-preset-201-300"
              >
                201-300
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPresetRange(1, totalWords)}
                data-testid="button-preset-all"
              >
                全範囲
              </Button>
            </div>
          </div>
          
          {/* Study Options */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="question-count" className="text-sm font-medium text-foreground mb-1">
                問題数
              </Label>
              <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
                <SelectTrigger data-testid="select-question-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10問</SelectItem>
                  <SelectItem value="20">20問</SelectItem>
                  <SelectItem value="50">50問</SelectItem>
                  <SelectItem value="100">100問</SelectItem>
                  <SelectItem value="-1">全て</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="order" className="text-sm font-medium text-foreground mb-1">
                順序
              </Label>
              <Select value={order} onValueChange={(value: "sequential" | "random" | "difficulty") => setOrder(value)}>
                <SelectTrigger data-testid="select-order">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">順番通り</SelectItem>
                  <SelectItem value="random">ランダム</SelectItem>
                  <SelectItem value="difficulty">難易度順</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Start Study Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleStartStudy}
            disabled={createSessionMutation.isPending || totalWords === 0}
            size="lg"
            data-testid="button-start-study"
          >
            {createSessionMutation.isPending ? (
              <i className="fas fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fas fa-play mr-2"></i>
            )}
            学習を開始
          </Button>
        </div>
        
        {totalWords === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            単語データがありません。先にJSONファイルをアップロードしてください。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
