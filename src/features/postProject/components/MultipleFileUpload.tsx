import React, { useState } from "react";
import { X, FileText, Image, File, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
}

interface FilePreview {
  file: File;
  preview?: string;
  id: string;
}

const MultipleFileUpload: React.FC<FileUploadProps> = ({ 
  onFilesSelect,
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  acceptedFileTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
}) => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (fileType === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" exceeds maximum size of ${maxFileSize}MB`;
    }

    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      return `File type "${file.type}" is not supported`;
    }

    return null;
  };

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    setError(null);
    const fileArray = Array.from(selectedFiles);

    // Check total number of files
    if (files.length + fileArray.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }

    // Validate each file
    const validFiles: FilePreview[] = [];
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const filePreview: FilePreview = {
        file,
        id: `${Date.now()}-${Math.random()}`,
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        filePreview.preview = URL.createObjectURL(file);
      }

      validFiles.push(filePreview);
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesSelect(updatedFiles.map(f => f.file));
  };

  const handleRemoveFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onFilesSelect(updatedFiles.map(f => f.file));
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={files.length >= maxFiles}
        />
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              {files.length >= maxFiles 
                ? `Maximum ${maxFiles} files reached` 
                : 'Click or drag & drop files here'
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supported: Images, PDF, Word, Excel, Text files (Max {maxFileSize}MB each)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {files.length}/{maxFiles} files uploaded
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Files Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Uploaded Files:</p>
          <div className="grid grid-cols-1 gap-2">
            {files.map((filePreview) => (
              <div
                key={filePreview.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors"
              >
                {/* File Icon or Image Preview */}
                <div className="flex-shrink-0">
                  {filePreview.preview ? (
                    <img
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-background rounded">
                      {getFileIcon(filePreview.file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(filePreview.file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(filePreview.id)}
                  className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleFileUpload;
