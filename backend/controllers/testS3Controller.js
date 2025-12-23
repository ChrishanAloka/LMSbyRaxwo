import { uploadToS3, deleteFromS3 } from '../services/s3Service.js';

// @desc    Test S3 upload with a sample image
// @route   POST /api/test/s3-upload
// @access  Public (for testing only)
export const testS3Upload = async (req, res) => {
  try {
    // Create a simple test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const fileName = 'test-image.png';
    const mimetype = 'image/png';

    console.log('Testing S3 upload...');
    const imageUrl = await uploadToS3(testImageBuffer, fileName, mimetype);

    res.status(200).json({
      success: true,
      message: 'S3 upload test successful!',
      imageUrl: imageUrl,
      instructions: [
        '1. Copy the imageUrl above',
        '2. Paste it in your browser to see the uploaded image',
        '3. Check your S3 bucket to verify the file exists',
        '4. If you see the image, S3 is working correctly!'
      ]
    });
  } catch (error) {
    console.error('S3 upload test failed:', error);
    res.status(500).json({
      success: false,
      message: 'S3 upload test failed',
      error: error.message
    });
  }
};

// @desc    Test S3 delete
// @route   DELETE /api/test/s3-delete
// @access  Public (for testing only)
export const testS3Delete = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide imageUrl in request body'
      });
    }

    console.log('Testing S3 delete...');
    await deleteFromS3(imageUrl);

    res.status(200).json({
      success: true,
      message: 'S3 delete test successful!',
      deletedUrl: imageUrl
    });
  } catch (error) {
    console.error('S3 delete test failed:', error);
    res.status(500).json({
      success: false,
      message: 'S3 delete test failed',
      error: error.message
    });
  }
};

