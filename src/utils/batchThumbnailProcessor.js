/**
 * Batch Thumbnail Processor
 * Processes thumbnails in small batches with delays to reduce server load
 */

class BatchThumbnailProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 3; // Process 3 at a time
    this.delayBetweenBatches = 2000; // 2 second delay between batches
  }

  /**
   * Add files to processing queue
   * @param {Array} attachments - Array of attachment objects
   * @param {Function} onProgress - Progress callback
   */
  addToQueue(attachments, onProgress) {
    const newItems = attachments.map(attachment => ({
      attachment,
      onProgress,
      id: attachment._id || attachment.cloudStorage?.key || Math.random().toString()
    }));

    this.queue.push(...newItems);
    
    if (!this.processing) {
      this.startProcessing();
    }
  }

  /**
   * Start processing the queue
   */
  async startProcessing() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    console.log('📦 Starting batch thumbnail processing:', this.queue.length, 'items');

    while (this.queue.length > 0) {
      // Take a batch
      const batch = this.queue.splice(0, this.batchSize);
      
      console.log('🔄 Processing batch of', batch.length, 'thumbnails');
      
      // Process batch in parallel
      const promises = batch.map(item => this.processSingleThumbnail(item));
      await Promise.allSettled(promises);
      
      // Delay before next batch (if there are more items)
      if (this.queue.length > 0) {
        console.log('⏳ Waiting', this.delayBetweenBatches / 1000, 'seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
      }
    }

    this.processing = false;
    console.log('✅ Batch processing completed');
  }

  /**
   * Process a single thumbnail
   * @param {Object} item - Queue item
   */
  async processSingleThumbnail(item) {
    const { attachment, onProgress } = item;
    
    try {
      // Check if already cached
      const fileKey = attachment.cloudStorage?.key || attachment.filePath || attachment._id;
      const cachedUrl = thumbnailCache.getThumbnailUrl?.(fileKey);
      
      if (cachedUrl) {
        onProgress?.(attachment, cachedUrl, 'cached');
        return;
      }

      // Determine API endpoint
      let apiEndpoint;
      if (this.isPdfFile(attachment)) {
        apiEndpoint = '/api/pdf-thumbnail';
      } else if (this.isDocxFile(attachment)) {
        apiEndpoint = '/api/docx-thumbnail';
      } else if (this.isPptxFile(attachment)) {
        apiEndpoint = '/api/pptx-thumbnail';
      } else {
        onProgress?.(attachment, null, 'unsupported');
        return;
      }

      // Generate thumbnail
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey: attachment.cloudStorage?.key,
          filePath: attachment.filePath,
          contentId: attachment._id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onProgress?.(attachment, result.thumbnailUrl, 'generated');
      } else {
        onProgress?.(attachment, null, 'failed');
      }

    } catch (error) {
      console.error('❌ Error processing thumbnail:', error);
      onProgress?.(attachment, null, 'error');
    }
  }

  // File type helpers
  isPdfFile(attachment) {
    return attachment?.mimeType === 'application/pdf' ||
           attachment?.originalName?.toLowerCase().endsWith('.pdf');
  }

  isDocxFile(attachment) {
    return attachment?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           attachment?.originalName?.toLowerCase().endsWith('.docx');
  }

  isPptxFile(attachment) {
    return attachment?.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
           attachment?.originalName?.toLowerCase().endsWith('.pptx');
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      batchSize: this.batchSize,
      delayBetweenBatches: this.delayBetweenBatches
    };
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.queue = [];
    console.log('🗑️ Thumbnail processing queue cleared');
  }
}

// Export singleton
export const batchThumbnailProcessor = new BatchThumbnailProcessor();