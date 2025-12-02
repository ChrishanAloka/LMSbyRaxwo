import https from 'https';
import { URL } from 'url';

// SMS Service using SMS Lenz API
const SMS_LENZ_CONFIG = {
  userId: '870',
  apiKey: '461c54e6-830c-4722-b181-1fa0943f7519',
  baseUrl: 'https://smslenz.lk/api',
  endpoint: 'https://smslenz.lk/api/send-sms',
  senderId: 'WISDOMEDU'
};

/**
  Send SMS using SMS Lenz API
  @param {string} mobileNumber - Mobile number 
  @param {string} message - SMS message content
  @returns {Promise<Object>} - Response from SMS API
 */
export const sendSMS = async (mobileNumber, message) => {
  try {
    console.log('=== sendSMS called ===');
    console.log('Original mobile number:', mobileNumber);
    console.log('Mobile number type:', typeof mobileNumber);
    
    if (!mobileNumber) {
      console.error(' Mobile number is required but not provided');
      return {
        success: false,
        error: 'Mobile number is required'
      };
    }

    // Convert to string if it's not already
    let mobileStr = String(mobileNumber).trim();
    console.log('Mobile after string conversion:', mobileStr);

    // Clean mobile number 
    let cleanMobile = mobileStr.replace(/[\s\-\(\)\+]/g, '');
    console.log('Mobile after cleaning:', cleanMobile);
    
    // Format mobile number 
    let formattedMobile = cleanMobile;
    
    if (cleanMobile.startsWith('94')) {
      // Already has country code
      formattedMobile = cleanMobile;
      console.log('Mobile already has country code 94');
    } else if (cleanMobile.startsWith('0')) {

      // Remove leading 0 and add country code
      formattedMobile = '94' + cleanMobile.substring(1);
      console.log('Mobile had leading 0, formatted to:', formattedMobile);
    } else if (cleanMobile.length === 9) {

      // 9-digit number, add country code
      formattedMobile = '94' + cleanMobile;
      console.log('Mobile was 9 digits, added country code:', formattedMobile);
    } else {

      // Use as is if it doesn't match expected formats
      formattedMobile = cleanMobile;
      console.log('Mobile format not recognized, using as is:', formattedMobile);
    }
    
    console.log('Final formatted mobile:', formattedMobile);

    // Format contact number 
    const contactNumber = '+' + formattedMobile;
    console.log('Contact number with + prefix:', contactNumber);

    // Prepare request parameters - SMS Lenz API format
    const params = new URLSearchParams({
      user_id: SMS_LENZ_CONFIG.userId,
      api_key: SMS_LENZ_CONFIG.apiKey,
      sender_id: SMS_LENZ_CONFIG.senderId, 
      contact: contactNumber, 
      message: message
    });

    console.log(`Attempting to send SMS to ${formattedMobile} with message: ${message}`);
    console.log(`API URL: ${SMS_LENZ_CONFIG.endpoint}`);
    console.log(`Parameters: ${params.toString()}`);

    // Send SMS using POST method with https module
    return new Promise((resolve, reject) => {
      const url = new URL(SMS_LENZ_CONFIG.endpoint);
      const postData = params.toString();

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          console.log('SMS API Response Status:', res.statusCode);
          console.log('SMS API Response:', responseData);

          let data;
          try {
            data = JSON.parse(responseData);
          } catch {
            data = { message: responseData, raw: responseData };
          }

          // Check if response indicates success
          if (res.statusCode === 200 || (data && (data.success || data.status === 'success' || (data.message && data.message.toLowerCase().includes('success'))))) {
            console.log(`SMS sent successfully to ${formattedMobile}`, data);
            resolve({
              success: true,
              data: data
            });
          } else {
            console.error(' SMS API Error - Status:', res.statusCode, 'Response:', data);
            resolve({
              success: false,
              error: data.message || data.error || data.raw || 'Failed to send SMS'
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error(' HTTPS Request Error:', error);
        resolve({
          success: false,
          error: error.message || 'Failed to send SMS'
        });
      });

      // Write data to request body
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
};

/**
 * Send SMS when student attempts a class
 * @param {Object} student - Student object with mobile number
 * @param {Object} classInstance - Class object with subject information, date, and time
 * @returns {Promise<Object>} - SMS sending result
 */

export const sendClassAttemptSMS = async (student, classInstance) => {
  try {
    console.log('=== sendClassAttemptSMS called ===');
    console.log('Student object:', JSON.stringify(student, null, 2));
    console.log('Student mobile:', student.mobile);
    console.log('Student mobile type:', typeof student.mobile);
    
    if (!student.mobile) {
      console.log('Student mobile number not found, skipping SMS');
      return { success: false, error: 'Mobile number not found' };
    }

    // Get subject name (populate if needed)
    let subjectName = 'the class';
    if (classInstance.subjectId) {
      if (typeof classInstance.subjectId === 'object' && classInstance.subjectId.name) {
        subjectName = classInstance.subjectId.name;
      } else {
        
        // Need to populate subject
        const Subject = (await import('../models/Subject.js')).default;
        const subject = await Subject.findById(classInstance.subjectId);
        if (subject) {
          subjectName = subject.name;
        }
      }
    }

    // Get class date and format it with month name
    let dateMonthStr = '';
    if (classInstance.date) {
      const classDate = new Date(classInstance.date);
      if (!isNaN(classDate.getTime())) {
        const day = classDate.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[classDate.getMonth()];
        dateMonthStr = `${day} ${monthName}`;
      } else if (typeof classInstance.date === 'string') {
        // If date is a string, try to parse it
        try {
          const parsedDate = new Date(classInstance.date);
          if (!isNaN(parsedDate.getTime())) {
            const day = parsedDate.getDate();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = monthNames[parsedDate.getMonth()];
            dateMonthStr = `${day} ${monthName}`;
          } else {
            dateMonthStr = classInstance.date;
          }
        } catch {
          dateMonthStr = classInstance.date;
        }
      }
    }

    
    let message = `Thank You! Your attendance for ${subjectName}`;
    if (dateMonthStr) {
      message += ` on ${dateMonthStr}`;
    }
    message += ` is recorded - Wisdom Institute`;

    console.log('SMS Message:', message);
    console.log('Calling sendSMS with mobile:', student.mobile);
    
    const result = await sendSMS(student.mobile, message);
    console.log('sendSMS result:', result);
    
    return result;
  } catch (error) {
    console.error(' Error sending class attempt SMS:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send SMS when payment is recorded
 * @param {Object} student - Student object with mobile number
 * @param {Object} payment - Payment object with payment details
 * @returns {Promise<Object>} - SMS sending result
 */

export const sendPaymentSMS = async (student, payment) => {
  try {
    console.log('=== sendPaymentSMS called ===');
    console.log('Student object:', JSON.stringify(student, null, 2));
    console.log('Payment object:', JSON.stringify(payment, null, 2));
    
    if (!student.mobile) {
      console.log('Student mobile number not found, skipping SMS');
      return { success: false, error: 'Mobile number not found' };
    }

    // Get payment details
    const price = payment.totalAmount || 0;
    const paymentMonth = payment.month || '';
    
    // Format months - handle single or multiple months
    let monthText = '';
    if (paymentMonth) {
      // Check if month contains commas (multiple months) or is an array
      if (typeof paymentMonth === 'string' && paymentMonth.includes(',')) {
        // Multiple months separated by commas
        const months = paymentMonth.split(',').map(m => m.trim()).filter(m => m);
        if (months.length > 1) {
          // Format: "month, month and for last month"
          const lastMonth = months.pop();
          monthText = months.join(', ') + ' and  ' + lastMonth;
        } else {
          monthText = paymentMonth;
        }
      } else if (Array.isArray(paymentMonth)) {
        // Month is an array
        const months = paymentMonth.filter(m => m);
        if (months.length > 1) {
          const lastMonth = months.pop();
          monthText = months.join(', ') + ' and for ' + lastMonth;
        } else {
          monthText = months[0] || '';
        }
      } else {
        // Single month
        monthText = paymentMonth;
      }
    }

    // payment message
    let message = `Thank You! We received your payment of LKR ${price}`;
    if (monthText) {
      message += ` for ${monthText}`;
    }
    message += ` - Wisdom Institute`;

    console.log('SMS Message:', message);
    console.log('Calling sendSMS with mobile:', student.mobile);
    
    const result = await sendSMS(student.mobile, message);
    console.log('sendSMS result:', result);
    
    return result;
  } catch (error) {
    console.error('Error sending payment SMS:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
};

