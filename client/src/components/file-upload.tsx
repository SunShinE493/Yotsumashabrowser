import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; wordCount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (words: any[]) => {
      const response = await apiRequest("POST", "/api/vocabulary/upload", { words });
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedFile({ name: "vocabulary.json", wordCount: data.count });
      toast({
        title: "アップロード成功",
        description: `${data.count}個の単語が読み込まれました`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      onUploadSuccess();
    },
    onError: (error) => {
      toast({
        title: "アップロードエラー",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({
        title: "ファイル形式エラー",
        description: "JSONファイルのみ対応しています",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate JSON structure
        if (!Array.isArray(data)) {
          throw new Error("JSONファイルは配列形式である必要があります");
        }

        const words = data.map(item => {
          if (!item.word || !item.meaning) {
            throw new Error("各単語にはwordとmeaningフィールドが必要です");
          }
          return {
            word: item.word,
            meaning: item.meaning,
            category: item.category || "未分類",
            example: item.example,
            difficulty: item.difficulty || 1,
          };
        });

        uploadMutation.mutate(words);
      } catch (error) {
        toast({
          title: "ファイル読み込みエラー",
          description: error instanceof Error ? error.message : "ファイルの形式が正しくありません",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <i className="fas fa-upload text-primary"></i>
          <h2 className="text-lg font-semibold text-foreground">JSONファイルをアップロード</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* File Upload Area */}
          <div className="space-y-3">
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="area-file-upload"
            >
              <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground mb-3"></i>
              <p className="text-foreground font-medium">ファイルを選択またはドラッグ&ドロップ</p>
              <p className="text-sm text-muted-foreground mt-1">JSON形式のファイルのみ対応</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".json" 
                className="hidden"
                onChange={handleInputChange}
                data-testid="input-file"
              />
            </div>
            
            {/* Sample JSON Structure */}
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-2">サンプル構造:</p>
              <pre className="text-xs text-muted-foreground overflow-x-auto">
{`[
  {
    "word": "apple",
    "meaning": "りんご",
    "category": "food"
  }
]`}
              </pre>
            </div>
          </div>
          
          {/* Loaded File Info */}
          <div className="space-y-3">
            {uploadedFile ? (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <i className="fas fa-check-circle text-success"></i>
                  <span className="font-medium text-success-foreground" data-testid="text-filename">
                    {uploadedFile.name}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p data-testid="text-word-count">{uploadedFile.wordCount} 語彙が読み込まれました</p>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <i className="fas fa-info-circle text-muted-foreground"></i>
                  <span className="font-medium text-muted-foreground">ファイルが未選択</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>JSONファイルをアップロードしてください</p>
                </div>
              </div>
            )}
            
            {uploadMutation.isPending && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-spinner fa-spin text-primary"></i>
                  <span className="font-medium text-primary">アップロード中...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
