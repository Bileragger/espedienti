/**
 * ImageUploadService - ImgBB Image Upload with Drag & Drop
 *
 * Handles image upload to ImgBB API with drag & drop support and preview.
 *
 * Dependencies: EventBus
 */

import { eventBus } from '../core/event-bus.js';

export class ImageUploadService {
  constructor(eventBusInstance) {
    this.eventBus = eventBusInstance;
    this.baseUrl = 'https://api.imgbb.com/1/upload';
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.selectedImageUrl = null;
    this.currentDropzone = null;
  }

  /**
   * Initialize image upload service
   */
  initialize() {
    console.log('✅ ImageUploadService initialized');
  }

  /**
   * Set up drag and drop for a dropzone element
   * @param {HTMLElement} dropzone - Dropzone element
   * @param {HTMLInputElement} fileInput - File input element
   * @param {Function} onUploadComplete - Callback (url) => void
   */
  setupDragAndDrop(dropzone, fileInput, onUploadComplete) {
    if (!dropzone || !fileInput) {
      console.warn('⚠️ Dropzone or file input not found');
      return;
    }

    // Drag over
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    // Drag leave
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    // Drop
    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await this.handleFile(files[0], dropzone, onUploadComplete);
      }
    });

    // Click to select file
    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        await this.handleFile(e.target.files[0], dropzone, onUploadComplete);
      }
    });

    console.log('✅ Drag and drop set up for dropzone');
  }

  /**
   * Handle file selection/drop
   * @param {File} file - File object
   * @param {HTMLElement} dropzone - Dropzone element
   * @param {Function} onUploadComplete - Callback (url) => void
   */
  async handleFile(file, dropzone, onUploadComplete) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un file immagine (JPG, PNG, GIF)');
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      alert('Il file è troppo grande. Massimo 5MB');
      return;
    }

    // Show preview
    this.showPreview(file, dropzone);

    // Get API key
    const apiKey = this.getApiKey();

    if (apiKey) {
      // Upload to ImgBB
      try {
        const url = await this.upload(file, apiKey);
        this.selectedImageUrl = url;

        if (onUploadComplete) {
          onUploadComplete(url);
        }

        this.showStatus('success', '✅ Immagine caricata con successo!');
      } catch (error) {
        this.showStatus('error', `❌ Errore upload: ${error.message}`);
      }
    } else {
      // Store as base64 for local use
      const base64 = await this.fileToBase64(file);
      this.selectedImageUrl = base64;

      if (onUploadComplete) {
        onUploadComplete(base64);
      }

      this.showStatus('info', 'ℹ️ Immagine caricata localmente. Per caricarla online, aggiungi una API key ImgBB');
    }
  }

  /**
   * Show image preview
   * @param {File} file - File object
   * @param {HTMLElement} dropzone - Dropzone element
   */
  showPreview(file, dropzone) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'image-preview';

      dropzone.innerHTML = '';
      dropzone.appendChild(img);
      dropzone.classList.add('has-image');
    };

    reader.readAsDataURL(file);
  }

  /**
   * Upload image to ImgBB
   * @param {File} file - File object
   * @param {string} apiKey - ImgBB API key
   * @returns {Promise<string>} Image URL
   */
  async upload(file, apiKey) {
    this.showStatus('loading', '🔄 Caricamento in corso...');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const url = data.data.url;

        this.eventBus.emit('image:uploaded', { url, file });
        console.log('✅ Image uploaded to ImgBB:', url);

        return url;
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ ImgBB upload error:', error);
      this.eventBus.emit('image:uploadError', { error, file });
      throw error;
    }
  }

  /**
   * Convert file to base64
   * @param {File} file - File object
   * @returns {Promise<string>} Base64 string
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Get API key from input field
   * @returns {string|null} API key or null
   */
  getApiKey() {
    const apiKeyInput = document.getElementById('imgbbApiKey');
    return apiKeyInput ? apiKeyInput.value.trim() : null;
  }

  /**
   * Show upload status message
   * @param {string} type - Status type ('loading', 'success', 'error', 'info')
   * @param {string} message - Status message
   */
  showStatus(type, message) {
    const statusDiv = document.getElementById('uploadStatus');

    if (!statusDiv) return;

    const colors = {
      loading: '#007bff',
      success: '#155724',
      error: '#721c24',
      info: '#856404'
    };

    const color = colors[type] || colors.info;

    if (type === 'loading') {
      statusDiv.innerHTML = `<div class="loading"></div> ${message}`;
    } else {
      statusDiv.innerHTML = `<span style="color: ${color};">${message}</span>`;
    }
  }

  /**
   * Clear dropzone
   * @param {HTMLElement} dropzone - Dropzone element
   */
  clearDropzone(dropzone) {
    if (!dropzone) return;

    dropzone.innerHTML = `
      <div class="upload-icon">📁</div>
      <p>Trascina un'immagine o clicca per selezionare</p>
      <p style="font-size: 0.8rem; opacity: 0.7;">JPG, PNG, GIF - Max 5MB</p>
    `;

    dropzone.classList.remove('has-image');
    this.selectedImageUrl = null;
  }

  /**
   * Get selected image URL
   * @returns {string|null} Image URL or null
   */
  getSelectedImageUrl() {
    return this.selectedImageUrl;
  }

  /**
   * Set selected image URL
   * @param {string} url - Image URL
   */
  setSelectedImageUrl(url) {
    this.selectedImageUrl = url;
  }

  /**
   * Clear selected image
   */
  clearSelectedImage() {
    this.selectedImageUrl = null;
  }
}

// Export singleton instance
export const imageUploadService = new ImageUploadService(eventBus);
