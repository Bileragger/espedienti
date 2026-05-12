/**
 * ImageUploadService - Firebase Storage image upload with drag & drop
 *
 * Dependencies: EventBus, window.storageModules (set by admin.html Firebase init)
 */

import { eventBus } from '../core/event-bus.js';

export class ImageUploadService {
  constructor(eventBusInstance) {
    this.eventBus = eventBusInstance;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.selectedImageUrl = null;
    this.currentDropzone = null;
  }

  initialize() {
    console.log('✅ ImageUploadService initialized');
  }

  setupDragAndDrop(dropzone, fileInput, onUploadComplete) {
    if (!dropzone || !fileInput) {
      console.warn('⚠️ Dropzone or file input not found');
      return;
    }

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        await this.handleFile(e.dataTransfer.files[0], dropzone, onUploadComplete);
      }
    });

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        await this.handleFile(e.target.files[0], dropzone, onUploadComplete);
      }
    });
  }

  async handleFile(file, dropzone, onUploadComplete) {
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un file immagine (JPG, PNG, GIF)');
      return;
    }

    if (file.size > this.maxFileSize) {
      alert('Il file è troppo grande. Massimo 5MB');
      return;
    }

    this.showPreview(file, dropzone);

    try {
      const url = await this._uploadToStorage(file);
      this.selectedImageUrl = url;
      if (onUploadComplete) onUploadComplete(url);
      this.showStatus('success', '✅ Immagine caricata su Firebase Storage!');
      this.eventBus.emit('image:uploaded', { url, file });
    } catch (error) {
      console.error('❌ Storage upload error:', error);
      this.showStatus('error', `❌ Errore upload: ${error.message}`);
      this.eventBus.emit('image:uploadError', { error, file });
    }
  }

  async _uploadToStorage(file) {
    this.showStatus('loading', '🔄 Caricamento in corso...');

    const { storage, ref, uploadBytes, getDownloadURL } = window.storageModules;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const path = `admin-uploads/${Date.now()}-${uid}-${safeName}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    console.log('✅ Image uploaded to Firebase Storage:', url);
    return url;
  }

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

  showStatus(type, message) {
    const statusDiv = document.getElementById('uploadStatus');
    if (!statusDiv) return;

    const colors = { loading: '#007bff', success: '#155724', error: '#721c24', info: '#856404' };

    if (type === 'loading') {
      statusDiv.innerHTML = `<div class="loading"></div> ${message}`;
    } else {
      statusDiv.innerHTML = `<span style="color:${colors[type] || colors.info};">${message}</span>`;
    }
  }

  clearDropzone(dropzone) {
    if (!dropzone) return;
    dropzone.innerHTML = `
      <div class="upload-icon">📁</div>
      <p>Trascina un'immagine o clicca per selezionare</p>
      <p style="font-size:0.8rem;opacity:0.7;">JPG, PNG, GIF - Max 5MB</p>
    `;
    dropzone.classList.remove('has-image');
    this.selectedImageUrl = null;
  }

  getSelectedImageUrl() { return this.selectedImageUrl; }
  setSelectedImageUrl(url) { this.selectedImageUrl = url; }
  clearSelectedImage() { this.selectedImageUrl = null; }
}

export const imageUploadService = new ImageUploadService(eventBus);
