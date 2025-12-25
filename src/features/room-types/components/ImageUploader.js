import React, { useState, useCallback, useRef } from 'react';
import { MdImage, MdClose, MdEdit, MdAdd, MdDragIndicator, MdDelete } from 'react-icons/md';
import './ImageUploader.css';

const ImageUploader = ({ images = [], onChange, maxImages = 10 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setReplaceTarget(null);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [images]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    if (replaceTarget) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        setReplaceTarget(null);
        return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(images.map(img => (
          img.id === replaceTarget
            ? { ...img, url: reader.result, name: file.name, file }
            : img
        )));
        setUploading(false);
        setReplaceTarget(null);
      };
      reader.onerror = () => {
        console.error('Error reading image file');
        alert('Failed to replace image');
        setUploading(false);
        setReplaceTarget(null);
      };
      reader.readAsDataURL(file);
      return;
    }

    handleFiles(files);
  };

  // Compress image function
  const compressImage = (file, maxWidth = 1200, maxHeight = 800, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              const originalSize = (file.size / 1024).toFixed(0);
              const compressedSize = (blob.size / 1024).toFixed(0);
              const saved = originalSize - compressedSize;
              
              resolve({
                file: compressedFile,
                url: canvas.toDataURL('image/jpeg', quality),
                originalSize,
                compressedSize,
                saved: saved > 0 ? saved : 0
              });
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (images.length + imageFiles.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setCompressing(true);

    try {
      // Compress and convert images
      const newImages = await Promise.all(
        imageFiles.map(async (file) => {
          const compressed = await compressImage(file);
          return {
            id: Date.now() + Math.random(),
            url: compressed.url,
            name: file.name,
            file: compressed.file,
            originalSize: compressed.originalSize,
            compressedSize: compressed.compressedSize,
            saved: compressed.saved
          };
        })
      );

      onChange([...images, ...newImages]);
      
      // Show compression feedback
      const totalSaved = newImages.reduce((sum, img) => sum + (img.saved || 0), 0);
      if (totalSaved > 0) {
        console.log(`✅ Compressed ${newImages.length} image(s), saved ${totalSaved}KB`);
      }
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Failed to process images');
    } finally {
      setUploading(false);
      setCompressing(false);
    }
  };

  // Drag and drop reordering functions
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const removeImage = (imageId) => {
    onChange(images.filter(img => img.id !== imageId));
  };

  const setAsFeatured = (imageId) => {
    const reordered = [...images];
    const index = reordered.findIndex(img => img.id === imageId);
    if (index > 0) {
      const [featured] = reordered.splice(index, 1);
      reordered.unshift(featured);
      onChange(reordered);
    }
  };

  const openFileDialog = (replaceId = null) => {
    setReplaceTarget(replaceId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleReplaceImage = (imageId) => {
    openFileDialog(imageId);
  };

  const slots = Array.from({ length: maxImages }, (_, index) => images[index] || null);

  return (
    <div
      className={`image-uploader ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={replaceTarget === null}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div className="uploader-header">
        <label style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#2c3e50',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <MdImage size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Room Images <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {compressing ? '🔄 Compressing…' : uploading ? 'Uploading…' : `${images.length}/${maxImages} images`}
        </span>
      </div>

      <div className={`image-grid ${isDragging ? 'dragging' : ''}`}>
        {slots.map((slot, index) => {
          if (slot) {
            return (
              <div 
                key={slot.id} 
                className={`image-slot has-image ${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
              >
                {index === 0 && (
                  <div className="primary-badge">Primary</div>
                )}
                {slot.saved > 0 && (
                  <div className="compression-badge" title={`Saved ${slot.saved}KB`}>
                    ⚡ -{slot.saved}KB
                  </div>
                )}
                <img
                  src={slot.url}
                  alt={slot.name}
                  onClick={() => setPreviewImage(slot)}
                />
                <div className="slot-actions">
                  <button
                    type="button"
                    className="slot-action danger"
                    onClick={() => removeImage(slot.id)}
                    title="Delete image"
                  >
                    <MdDelete size={18} />
                  </button>
                  <button
                    type="button"
                    className="slot-action"
                    onClick={() => handleReplaceImage(slot.id)}
                    title="Replace image"
                  >
                    <MdEdit size={18} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <button
              key={`empty-${index}`}
              type="button"
              className="image-slot empty"
              onClick={() => openFileDialog(null)}
            >
              <MdAdd size={28} />
              <span>Add photo</span>
              <small>JPG, PNG, WebP</small>
            </button>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-preview"
              onClick={() => setPreviewImage(null)}
            >
              <MdClose size={24} />
            </button>
            <img src={previewImage.url} alt={previewImage.name} />
            <p>{previewImage.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
