import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  X, 
  Eye,
  Image as ImageIcon,
  FileType,
  File,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface DocumentFile {
  url: string;
  name: string;
  type?: string;
  size?: number;
}

interface DocumentViewerProps {
  files: DocumentFile[];
  isOpen: boolean;
  onClose: () => void;
  initialFileIndex?: number;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  files, 
  isOpen, 
  onClose,
  initialFileIndex = 0 
}) => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialFileIndex);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentFile = files[currentIndex];

  // Determine file type from URL or provided type
  const getFileType = (file: DocumentFile): string => {
    if (file.type) return file.type;
    
    const url = file.url.toLowerCase();
    const name = file.name.toLowerCase();
    
    // Check by URL or filename extension
    if (url.includes('.pdf') || name.endsWith('.pdf')) return 'pdf';
    if (url.includes('.doc') || name.endsWith('.doc') || name.endsWith('.docx')) return 'doc';
    if (url.includes('.xls') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'excel';
    if (url.includes('.ppt') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'powerpoint';
    if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)/i) || name.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)) return 'image';
    if (url.includes('.txt') || name.endsWith('.txt')) return 'text';
    if (url.includes('.zip') || url.includes('.rar') || name.endsWith('.zip') || name.endsWith('.rar')) return 'archive';
    
    return 'unknown';
  };

  const fileType = getFileType(currentFile);

  // Download file
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Fetch file from Firebase Storage (token-based auth, no credentials needed)
      const response = await fetch(currentFile.url, {
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentFile.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${currentFile.name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback: Open in new tab if direct download fails (CORS issue)
      toast({
        title: "Opening in New Tab",
        description: "Download directly by clicking the download icon in your browser, or right-click and select 'Save As'",
      });
      window.open(currentFile.url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    window.open(currentFile.url, '_blank');
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Navigation
  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % files.length);
    setZoom(100);
    setRotation(0);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + files.length) % files.length);
    setZoom(100);
    setRotation(0);
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Get file icon
  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
        return <FileType className="w-5 h-5 text-blue-500" />;
      case 'excel':
        return <FileType className="w-5 h-5 text-green-500" />;
      case 'powerpoint':
        return <FileType className="w-5 h-5 text-orange-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Render file content
  const renderFileContent = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg min-h-[500px]">
            <img
              src={currentFile.url}
              alt={currentFile.name}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease',
              }}
              className="object-contain"
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-[70vh] rounded-lg overflow-hidden border border-border">
            <iframe
              src={`${currentFile.url}#view=FitH`}
              className="w-full h-full"
              title={currentFile.name}
            />
          </div>
        );

      case 'doc':
      case 'excel':
      case 'powerpoint':
        // Use Microsoft Office Online Viewer or Google Docs Viewer
        return (
          <div className="w-full h-[70vh] rounded-lg overflow-hidden border border-border">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentFile.url)}`}
              className="w-full h-full"
              title={currentFile.name}
            />
          </div>
        );

      case 'text':
        return (
          <div className="w-full h-[70vh] rounded-lg overflow-hidden border border-border">
            <iframe
              src={currentFile.url}
              className="w-full h-full"
              title={currentFile.name}
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-lg min-h-[500px]">
            <File className="w-24 h-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Preview Not Available</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              This file type cannot be previewed in the browser. 
              You can download it to view on your device.
            </p>
            <Button onClick={handleDownload} disabled={isDownloading}>
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download File'}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden custom-scrollbar p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg truncate">{currentFile.name}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(currentFile.size)} • {fileType.toUpperCase()} File
                </p>
              </div>
            </div>
            
            {/* File counter when multiple files */}
            {files.length > 1 && (
              <Badge variant="secondary" className="ml-2">
                {currentIndex + 1} / {files.length}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-6 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            {/* Zoom controls for images */}
            {fileType === 'image' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2">{zoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="ml-2"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {renderFileContent()}
        </div>

        {/* Navigation for multiple files */}
        {files.length > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <div className="flex gap-2 overflow-x-auto max-w-md custom-scrollbar">
              {files.map((file, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoom(100);
                    setRotation(0);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all ${
                    index === currentIndex
                      ? 'border-primary shadow-lg'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {getFileType(file) === 'image' ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === files.length - 1}
            >
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
