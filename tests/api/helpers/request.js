/**
 * Simple request helper for testing API endpoints
 * This is a simplified version that doesn't rely on Next.js internals
 */

/**
 * Makes a GET request to the specified URL using a mock handler
 * @param {Function} mockHandler - Mock handler function
 * @param {string} url - URL to make the request to
 * @param {Object} headers - Headers to include in the request
 * @returns {Promise} Promise that resolves to the response
 */
function get(mockHandler, url, headers = {}) {
  try {
    const req = { url, method: 'GET', headers };
    return mockHandler(req);
  } catch (error) {
    return {
      status: 500,
      json: async () => ({ success: false, error: error.message })
    };
  }
}

/**
 * Makes a POST request to the specified URL
 * @param {Function} mockHandler - Mock handler function
 * @param {string} url - URL to make the request to
 * @param {Object} body - Body to include in the request
 * @param {Object} headers - Headers to include in the request
 * @returns {Promise} Promise that resolves to the response
 */
function post(mockHandler, url, body, headers = {}) {
  try {
    const req = { url, method: 'POST', headers, body };
    return mockHandler(req);
  } catch (error) {
    return {
      status: 500,
      json: async () => ({ success: false, error: error.message })
    };
  }
}

/**
 * Makes a PUT request to the specified URL
 * @param {Function} mockHandler - Mock handler function
 * @param {string} url - URL to make the request to
 * @param {Object} body - Body to include in the request
 * @param {Object} headers - Headers to include in the request
 * @returns {Promise} Promise that resolves to the response
 */
function put(mockHandler, url, body, headers = {}) {
  try {
    const req = { url, method: 'PUT', headers, body };
    return mockHandler(req);
  } catch (error) {
    return {
      status: 500,
      json: async () => ({ success: false, error: error.message })
    };
  }
}

/**
 * Makes a DELETE request to the specified URL
 * @param {Function} mockHandler - Mock handler function
 * @param {string} url - URL to make the request to
 * @param {Object} headers - Headers to include in the request
 * @returns {Promise} Promise that resolves to the response
 */
function del(mockHandler, url, headers = {}) {
  try {
    const req = { url, method: 'DELETE', headers };
    return mockHandler(req);
  } catch (error) {
    return {
      status: 500,
      json: async () => ({ success: false, error: error.message })
    };
  }
}

module.exports = {
  get,
  post,
  put,
  del
};
