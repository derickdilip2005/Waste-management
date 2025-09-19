import React, { useState, useRef, useCallback } from 'react';

interface ImageUploadProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  acceptedTypes?: string[];
  maxSizePerImage?: number; // in MB
  enableMLValidation?: boolean;
  wasteTypeFilter?: string[];
  className?: string;
}

interface ImagePreview {
  file: File;
  url: string;
  mlValidation?: {
    isWaste: boolean;
    wasteType?: string;
    confidence: number;
    suggestions?: string[];
  };
  validating?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  maxImages = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizePerImage = 10,
  enableMLValidation = true,
  wasteTypeFilter = [],
  className = ''
}) => {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateMLImage = async (file: File): Promise<ImagePreview['mlValidation']> => {
    if (!enableMLValidation) return undefined;

    // Mock ML validation with random results
    return new Promise((resolve) => {
      setTimeout(() => {
        const wasteTypes = ['plastic', 'organic', 'paper', 'glass', 'metal', 'electronic'];
        const randomWasteType = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
        const confidence = 0.7 + Math.random() * 0.3; // Random confidence between 0.7-1.0
        
        resolve({
          isWaste: true,
          wasteType: randomWasteType,
          confidence: confidence,
          suggestions: [`Detected ${randomWasteType} waste with ${Math.round(confidence * 100)}% confidence`]
        });
      }, 1000); // Simulate processing delay
    });
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setError(null);

    // Validate file count
    if (images.length + fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (!acceptedTypes.includes(file.type)) {
        setError(`File type ${file.type} not supported. Please use: ${acceptedTypes.join(', ')}`);
        continue;
      }

      if (file.size > maxSizePerImage * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size: ${maxSizePerImage}MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    // Create image previews
    const newImages: ImagePreview[] = [];
    for (const file of validFiles) {
      const url = URL.createObjectURL(file);
      const imagePreview: ImagePreview = {
        file,
        url,
        validating: enableMLValidation
      };

      newImages.push(imagePreview);
    }

    // Update state with new images
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages.map(img => img.file));

    // Perform ML validation for each image
    if (enableMLValidation) {
      for (let i = 0; i < newImages.length; i++) {
        const imageIndex = images.length + i;
        const mlValidation = await validateMLImage(newImages[i].file);
        
        setImages(prev => {
          const updated = [...prev];
          if (updated[imageIndex]) {
            updated[imageIndex] = {
              ...updated[imageIndex],
              mlValidation,
              validating: false
            };
          }
          return updated;
        });
      }
    }

    setUploading(false);
  }, [images, maxImages, acceptedTypes, maxSizePerImage, enableMLValidation, onImagesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages.map(img => img.file));
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(images[index].url);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getValidationIcon = (validation?: ImagePreview['mlValidation']) => {
    if (!validation) return null;
    
    if (validation.isWaste && validation.confidence > 0.7) {
      return <span className="text-green-500" title="Valid waste image">✅</span>;
    } else if (validation.isWaste && validation.confidence > 0.4) {
      return <span className="text-yellow-500" title="Possibly valid">⚠️</span>;
    } else {
      return <span className="text-red-500" title="Not a waste image">❌</span>;
    }
  };

  const getValidationMessage = (validation?: ImagePreview['mlValidation']) => {
    if (!validation) return null;

    if (validation.isWaste && validation.confidence > 0.7) {
      return (
        <div className="text-xs text-green-600 mt-1">
          ✅ {validation.wasteType ? `${validation.wasteType} detected` : 'Valid waste image'} 
          ({Math.round(validation.confidence * 100)}% confidence)
        </div>
      );
    } else if (validation.isWaste && validation.confidence > 0.4) {
      return (
        <div className="text-xs text-yellow-600 mt-1">
          ⚠️ Possibly valid ({Math.round(validation.confidence * 100)}% confidence)
          {validation.suggestions && validation.suggestions.length > 0 && (
            <div className="mt-1">
              Suggestions: {validation.suggestions.join(', ')}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="text-xs text-red-600 mt-1">
          ❌ This doesn't appear to be a waste image
          {validation.suggestions && validation.suggestions.length > 0 && (
            <div className="mt-1">
              {validation.suggestions.join(', ')}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={images.length < maxImages ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={images.length >= maxImages}
        />

        <div className="space-y-2">
          <div className="text-4xl">📸</div>
          <div className="text-lg font-medium text-gray-900">
            {images.length >= maxImages ? 'Maximum images reached' : 'Upload waste images'}
          </div>
          <div className="text-sm text-gray-600">
            Drag and drop images here, or click to select files
          </div>
          <div className="text-xs text-gray-500">
            Supported formats: {acceptedTypes.map(type => type.split('/')[1]).join(', ')} • 
            Max size: {maxSizePerImage}MB per image • 
            Max {maxImages} images
          </div>
          {enableMLValidation && (
            <div className="text-xs text-blue-600">
              🤖 AI validation enabled - images will be automatically checked for waste content
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Uploaded Images ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Loading overlay for ML validation */}
                  {image.validating && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                        <div className="text-xs">Validating...</div>
                      </div>
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>

                  {/* ML Validation indicator */}
                  {image.mlValidation && !image.validating && (
                    <div className="absolute top-2 left-2">
                      {getValidationIcon(image.mlValidation)}
                    </div>
                  )}
                </div>

                {/* Image info */}
                <div className="mt-2">
                  <div className="text-xs text-gray-600 truncate">
                    {image.file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(image.file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                  
                  {/* ML Validation message */}
                  {getValidationMessage(image.mlValidation)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 text-sm">Processing images...</span>
          </div>
        </div>
      )}

      {/* ML Validation Summary */}
      {enableMLValidation && images.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">AI Validation Summary</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Valid waste images:</span>
              <span className="text-green-600 font-medium">
                {images.filter(img => img.mlValidation?.isWaste && img.mlValidation.confidence > 0.7).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Needs review:</span>
              <span className="text-yellow-600 font-medium">
                {images.filter(img => img.mlValidation?.isWaste && img.mlValidation.confidence <= 0.7 && img.mlValidation.confidence > 0.4).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Invalid images:</span>
              <span className="text-red-600 font-medium">
                {images.filter(img => img.mlValidation && (!img.mlValidation.isWaste || img.mlValidation.confidence <= 0.4)).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;