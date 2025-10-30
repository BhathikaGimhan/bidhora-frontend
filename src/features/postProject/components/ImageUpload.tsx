import React, { useState } from "react";

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setPreview(URL.createObjectURL(file));
      onFileSelect(file);
    } else {
      setPreview(null);
      onFileSelect(null);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onFileSelect(null);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <label className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-500 transition-colors">
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {!preview ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
            <p className="text-lg font-medium">Click or Drag & Drop to upload</p>
            <p className="text-sm">Supported formats: PNG, JPG, JPEG</p>
          </div>
        ) : (
          <img src={preview} alt="Preview" className="max-h-60 mx-auto rounded-md object-contain" />
        )}
      </label>
      {preview && (
        <button
          type="button"
          onClick={handleRemove}
          className="mt-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Remove Image
        </button>
      )}
    </div>
  );
};

export default ImageUpload;
